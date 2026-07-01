from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Faculty, Course, Classroom, Enrollment, Module, LiveSession, StudyMaterial, StudyMaterialCompletion, Assignment, AssignmentSubmission

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ['id', 'name', 'email', 'avatar', 'bio']

class LiveSessionSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()  # Calls models.py property

    class Meta:
        model = LiveSession
        fields = ['id', 'title', 'description', 'start_time', 'end_time', 'meeting_link', 'status']

class StudyMaterialSerializer(serializers.ModelSerializer):
    completed = serializers.SerializerMethodField()

    class Meta:
        model = StudyMaterial
        fields = ['id', 'title', 'material_type', 'content_url', 'completed']

    def get_completed(self, obj):
        user = self.context.get('request').user
        if not user or user.is_anonymous:
            return False
        # Checked via prefetch_related/completions logic in view to avoid N+1
        return getattr(obj, 'is_completed_by_user', False)

class AssignmentSerializer(serializers.ModelSerializer):
    status_label = serializers.SerializerMethodField()
    marks_obtained = serializers.SerializerMethodField()
    feedback = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'due_date', 'max_marks', 'status_label', 'marks_obtained', 'feedback']

    def _get_submission(self, obj):
        user = self.context.get('request').user
        if not user or user.is_anonymous:
            return None
        # Cache submissions on the object in view to avoid query-in-loop (N+1)
        submissions = getattr(obj, 'cached_submissions_dict', {})
        return submissions.get(user.id)

    def get_status_label(self, obj):
        submission = self._get_submission(obj)
        if not submission:
            return "published"
        elif submission.marks_obtained is None:
            return "submitted"
        else:
            return "evaluated"

    def get_marks_obtained(self, obj):
        submission = self._get_submission(obj)
        return submission.marks_obtained if submission else None

    def get_feedback(self, obj):
        submission = self._get_submission(obj)
        return submission.feedback if submission else ""

class ModuleSerializer(serializers.ModelSerializer):
    study_materials = StudyMaterialSerializer(many=True, read_only=True)
    assignments = AssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'order', 'study_materials', 'assignments']

class CourseListSerializer(serializers.ModelSerializer):
    classroom_name = serializers.SerializerMethodField()
    classroom_assigned = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'code', 'title', 'description', 'classroom_name', 'classroom_assigned', 'progress_percentage']

    def get_classroom_name(self, obj):
        enrollment = self.context.get('enrollments_dict', {}).get(obj.id)
        if enrollment and enrollment.classroom:
            return enrollment.classroom.name
        return "Not Assigned"

    def get_classroom_assigned(self, obj):
        enrollment = self.context.get('enrollments_dict', {}).get(obj.id)
        return enrollment is not None and enrollment.classroom is not None

    def get_progress_percentage(self, obj):
        user = self.context.get('request').user
        if not user or user.is_anonymous:
            return 0
        total_materials = getattr(obj, 'total_materials_count', 0)
        completed_materials = getattr(obj, 'completed_materials_count', 0)
        if total_materials == 0:
            return 0
        return int((completed_materials / total_materials) * 100)

class CourseDetailSerializer(serializers.ModelSerializer):
    classroom_name = serializers.SerializerMethodField()
    classroom_assigned = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    faculty = FacultySerializer(many=True, read_only=True)
    live_sessions = LiveSessionSerializer(many=True, read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'code', 'title', 'description', 
            'classroom_name', 'classroom_assigned', 'progress_percentage',
            'faculty', 'live_sessions', 'modules'
        ]

    def get_classroom_name(self, obj):
        enrollment = self.context.get('enrollment')
        if enrollment and enrollment.classroom:
            return enrollment.classroom.name
        return "Not Assigned"

    def get_classroom_assigned(self, obj):
        enrollment = self.context.get('enrollment')
        return enrollment is not None and enrollment.classroom is not None

    def get_progress_percentage(self, obj):
        total_materials = getattr(obj, 'total_materials_count', 0)
        completed_materials = getattr(obj, 'completed_materials_count', 0)
        if total_materials == 0:
            return 0
        return int((completed_materials / total_materials) * 100)
