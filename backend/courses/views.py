from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.db import connection

from .models import Course, Classroom, Enrollment, StudyMaterial, StudyMaterialCompletion, Assignment, AssignmentSubmission, LiveSession
from .serializers import CourseListSerializer, CourseDetailSerializer

class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # We start by getting courses the user is enrolled in
        user = self.request.user
        return Course.objects.filter(enrollments__student=user)

    def list(self, request, *args, **kwargs):
        user = request.user
        
        # 1. Fetch all enrollments with courses and classrooms to map them
        enrollments = Enrollment.objects.filter(student=user).select_related('course', 'classroom')
        enrollments_dict = {e.course_id: e for e in enrollments}
        course_ids = list(enrollments_dict.keys())
        
        # 2. Query courses and annotate completion metrics in a single query
        courses = Course.objects.filter(id__in=course_ids).annotate(
            total_materials_count=Count('modules__study_materials', distinct=True),
            completed_materials_count=Count(
                'modules__study_materials__completions',
                filter=Q(modules__study_materials__completions__student=user),
                distinct=True
            )
        )
        
        # Print database query count for logging/debugging
        print(f"DEBUG: List view executed {len(connection.queries)} queries.")
        
        serializer = CourseListSerializer(
            courses, 
            many=True, 
            context={
                'request': request, 
                'enrollments_dict': enrollments_dict
            }
        )
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        pk = kwargs.get('pk')
        
        # 1. IDOR Check: Ensure the student is enrolled in the course
        try:
            enrollment = Enrollment.objects.select_related('classroom').get(student=user, course_id=pk)
        except Enrollment.DoesNotExist:
            raise PermissionDenied("You are not enrolled in this course.")
            
        # 2. Fetch Course with precalculated metrics
        course = Course.objects.filter(id=pk).annotate(
            total_materials_count=Count('modules__study_materials', distinct=True),
            completed_materials_count=Count(
                'modules__study_materials__completions',
                filter=Q(modules__study_materials__completions__student=user),
                distinct=True
            )
        ).first()
        
        if not course:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        # 3. Retrieve all completed materials in this course to avoid N+1 queries in loops
        completed_material_ids = set(
            StudyMaterialCompletion.objects.filter(
                student=user,
                study_material__module__course_id=pk
            ).values_list('study_material_id', flat=True)
        )

        # 4. Fetch user's submissions in this course to prevent N+1 queries for assignments
        submissions = AssignmentSubmission.objects.filter(
            student=user,
            assignment__module__course_id=pk
        )
        submissions_dict = {s.assignment_id: s for s in submissions}

        # 5. Attach prefetched data in-memory to prevent database hits during serialization
        # We prefetch modules, materials, and assignments using prefetch_related
        modules = course.modules.all().prefetch_related('study_materials', 'assignments')
        
        # Attach in-memory cache attributes
        for module in modules:
            for material in module.study_materials.all():
                material.is_completed_by_user = material.id in completed_material_ids
            for assignment in module.assignments.all():
                assignment.cached_submissions_dict = {user.id: submissions_dict.get(assignment.id)}

        # 6. Fetch faculty and live sessions if classroom is assigned
        faculty_list = []
        live_sessions_list = []
        if enrollment.classroom:
            faculty_list = enrollment.classroom.faculty.all()
            live_sessions_list = enrollment.classroom.live_sessions.all()
            
        # Set attributes directly on course object to be serialized
        course.faculty = faculty_list
        course.live_sessions = live_sessions_list
        
        # Overwrite modules relationship with our pre-annotated queryset
        course.modules_prefetched = modules

        # Print query count for assessment requirements
        print(f"DEBUG: Detail view executed {len(connection.queries)} queries.")

        serializer = CourseDetailSerializer(
            course, 
            context={'request': request, 'enrollment': enrollment}
        )
        
        # Since serializer defaults to standard model relations, we inject modules manually
        data = serializer.data
        # Manually serialize modules since we cached attributes on prefetched list
        from .serializers import ModuleSerializer
        data['modules'] = ModuleSerializer(modules, many=True, context={'request': request}).data
        
        return Response(data)

class StudyMaterialToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        user = request.user
        material = get_object_or_404(StudyMaterial, pk=pk)
        
        # 1. Authorization check: Student must be enrolled in the course containing this material
        course = material.module.course
        is_enrolled = Enrollment.objects.filter(student=user, course=course).exists()
        if not is_enrolled:
            raise PermissionDenied("You are not authorized to access this study material.")
            
        # 2. Get requested completed status from body
        completed_status = request.data.get('completed')
        if completed_status is None:
            raise ValidationError({"completed": "This field is required."})
            
        if not isinstance(completed_status, bool):
            raise ValidationError({"completed": "Must be a boolean value."})

        # 3. Idempotent toggle mutation
        completion_exists = StudyMaterialCompletion.objects.filter(student=user, study_material=material).exists()
        
        if completed_status:
            if not completion_exists:
                StudyMaterialCompletion.objects.create(student=user, study_material=material)
        else:
            if completion_exists:
                StudyMaterialCompletion.objects.filter(student=user, study_material=material).delete()
                
        return Response({
            "study_material_id": material.id,
            "completed": completed_status
        }, status=status.HTTP_200_OK)
