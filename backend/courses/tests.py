from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta

from courses.models import Faculty, Course, Classroom, Enrollment, Module, StudyMaterial, StudyMaterialCompletion, Assignment, AssignmentSubmission

class LMSAPITestCase(APITestCase):

    def setUp(self):
        # 1. Create Students
        self.student1 = User.objects.create_user(username='teststudent1', password='password123', email='s1@test.com')
        self.student2 = User.objects.create_user(username='teststudent2', password='password123', email='s2@test.com')

        # 2. Create Faculty
        self.faculty1 = Faculty.objects.create(name='Ada Lovelace', email='ada@test.com')

        # 3. Create Courses
        self.course1 = Course.objects.create(title='Intro to Computer Science', code='CS-101', description='Test course description')
        self.course2 = Course.objects.create(title='Intro to Physics', code='PHYS-101', description='Physics description')

        # 4. Create Classroom
        self.classroom1 = Classroom.objects.create(name='Classroom 1A', course=self.course1)
        self.classroom1.faculty.add(self.faculty1)

        # 5. Enroll student1 in CS-101 (with classroom) and PHYS-101 (without classroom)
        # student2 is enrolled only in CS-101
        self.enrollment1 = Enrollment.objects.create(student=self.student1, course=self.course1, classroom=self.classroom1)
        self.enrollment2 = Enrollment.objects.create(student=self.student1, course=self.course2, classroom=None)
        self.enrollment3 = Enrollment.objects.create(student=self.student2, course=self.course1, classroom=self.classroom1)

        # 6. Modules and materials for CS-101
        self.module1 = Module.objects.create(course=self.course1, title='Module 1', order=1)
        self.material1 = StudyMaterial.objects.create(
            module=self.module1, title='Material 1', material_type='pdf', content_url='https://example.com/pdf1'
        )
        self.material2 = StudyMaterial.objects.create(
            module=self.module1, title='Material 2', material_type='video', content_url='https://example.com/vid1'
        )

        # Assignment for CS-101
        self.assignment1 = Assignment.objects.create(
            module=self.module1, title='Assignment 1', description='Desc', due_date=timezone.now() + timedelta(days=2), max_marks=100
        )

        # 7. Get JWT tokens
        token_url = reverse('token_obtain_pair')
        response = self.client.post(token_url, {'username': 'teststudent1', 'password': 'password123'})
        self.token_student1 = response.data['access']

        response = self.client.post(token_url, {'username': 'teststudent2', 'password': 'password123'})
        self.token_student2 = response.data['access']

    def set_auth_student1(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token_student1)

    def set_auth_student2(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token_student2)

    def test_list_student_courses(self):
        self.set_auth_student1()
        url = reverse('course-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # student1 has 2 courses enrolled
        self.assertEqual(len(response.data), 2)
        
        # Verify first course details
        cs_course = [c for c in response.data if c['code'] == 'CS-101'][0]
        self.assertEqual(cs_course['classroom_assigned'], True)
        self.assertEqual(cs_course['classroom_name'], 'Classroom 1A')

        # Verify second course details (no classroom)
        phys_course = [c for c in response.data if c['code'] == 'PHYS-101'][0]
        self.assertEqual(phys_course['classroom_assigned'], False)
        self.assertEqual(phys_course['classroom_name'], 'Not Assigned')

    def test_course_detail_authorization_idor_protection(self):
        # student2 is NOT enrolled in PHYS-101 (course2)
        self.set_auth_student2()
        url = reverse('course-detail', args=[self.course2.id])
        response = self.client.get(url)
        
        # Should return 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # student1 IS enrolled, should load successfully
        self.set_auth_student1()
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_toggle_study_material_completion(self):
        self.set_auth_student1()
        url = reverse('study-material-toggle', args=[self.material1.id])
        
        # 1. Mark as complete
        response = self.client.post(url, {'completed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['completed'], True)
        self.assertTrue(StudyMaterialCompletion.objects.filter(student=self.student1, study_material=self.material1).exists())

        # 2. Mark as complete again (idempotent, shouldn't throw error or duplicate)
        response = self.client.post(url, {'completed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(StudyMaterialCompletion.objects.filter(student=self.student1, study_material=self.material1).count(), 1)

        # 3. Unmark complete
        response = self.client.post(url, {'completed': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['completed'], False)
        self.assertFalse(StudyMaterialCompletion.objects.filter(student=self.student1, study_material=self.material1).exists())

    def test_toggle_study_material_unauthorized(self):
        # material is in CS-101. Let's make a new material in PHYS-101
        # Student 2 is NOT enrolled in PHYS-101
        phys_module = Module.objects.create(course=self.course2, title='Phys Mod', order=1)
        phys_material = StudyMaterial.objects.create(
            module=phys_module, title='Physics Material', material_type='pdf', content_url='https://example.com/phys1'
        )

        self.set_auth_student2()
        url = reverse('study-material-toggle', args=[phys_material.id])
        
        # Should return 403 Forbidden
        response = self.client.post(url, {'completed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
