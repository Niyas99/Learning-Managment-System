from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from courses.models import Faculty, Course, Classroom, Enrollment, Module, LiveSession, StudyMaterial, StudyMaterialCompletion, Assignment, AssignmentSubmission

class Command(BaseCommand):
    help = 'Seeds the LMS database with realistic sample data and edge cases'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing existing data...')
        AssignmentSubmission.objects.all().delete()
        StudyMaterialCompletion.objects.all().delete()
        Assignment.objects.all().delete()
        StudyMaterial.objects.all().delete()
        LiveSession.objects.all().delete()
        Enrollment.objects.all().delete()
        Classroom.objects.all().delete()
        Module.objects.all().delete()
        Course.objects.all().delete()
        Faculty.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write('Creating users...')
        # Create 3 students
        s1 = User.objects.create_user(username='student1', email='student1@example.com', password='student123')
        s2 = User.objects.create_user(username='student2', email='student2@example.com', password='student123')
        s3 = User.objects.create_user(username='student3', email='student3@example.com', password='student123')
        
        # Create an admin user for Django admin panel
        admin_user = User.objects.create_superuser(username='admin', email='admin@example.com', password='adminpassword')

        self.stdout.write('Creating faculty...')
        f1 = Faculty.objects.create(
            name='Dr. Ada Lovelace',
            email='ada@lms.com',
            bio='Pioneer in computer science. Expert in early computing algorithms.',
            avatar='https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop'
        )
        f2 = Faculty.objects.create(
            name='Prof. Richard Feynman',
            email='feynman@lms.com',
            bio='Nobel laureate physicist and pioneering quantum educator.',
            avatar='https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop'
        )
        f3 = Faculty.objects.create(
            name='Dr. Katherine Johnson',
            email='katherine@lms.com',
            bio='Pioneering NASA mathematician who calculated critical spaceflight trajectories.',
            avatar='https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop'
        )

        self.stdout.write('Creating courses...')
        
        # --- COURSE 1: Python Programming ---
        c1 = Course.objects.create(
            title='Python Programming: Zero to Hero',
            code='CS-101',
            description='Learn Python from syntax basics to object-oriented programming, data structures, and APIs.'
        )
        
        # Modules for Course 1
        c1_m1 = Module.objects.create(course=c1, title='Introduction to Python & Variables', order=1)
        c1_m2 = Module.objects.create(course=c1, title='Control Flow, Loops, and Functions', order=2)
        c1_m3 = Module.objects.create(course=c1, title='Data Structures (Lists, Dicts, Tuples)', order=3)
        
        # Materials for Module 1
        m1_vid1 = StudyMaterial.objects.create(
            module=c1_m1, title='Installing Python and IDE Setup', material_type='video',
            content_url='https://example.com/videos/python_setup.mp4'
        )
        m1_pdf1 = StudyMaterial.objects.create(
            module=c1_m1, title='Variables and Core Operators Cheat Sheet', material_type='pdf',
            content_url='https://example.com/docs/python_variables_operators.pdf'
        )
        # Materials for Module 2
        m2_pdf1 = StudyMaterial.objects.create(
            module=c1_m2, title='If statements and while/for loops reference', material_type='pdf',
            content_url='https://example.com/docs/loops_conditionals.pdf'
        )
        # Materials for Module 3
        m3_link1 = StudyMaterial.objects.create(
            module=c1_m3, title='Interactive Python Tutor Visualization Tool', material_type='link',
            content_url='https://pythontutor.com'
        )

        # Assignments for Course 1
        a1_1 = Assignment.objects.create(
            module=c1_m1, title='Assignment 1.1: Hello World & Base Operators',
            description='Write a script that takes user input and performs math equations. Upload your .py script.',
            due_date=timezone.now() + timedelta(days=3), max_marks=100
        )
        a1_2 = Assignment.objects.create(
            module=c1_m2, title='Assignment 1.2: Loop iteration and FizzBuzz',
            description='Build a custom fizzbuzz iterator with a while loop and dynamic bounds. Submit text/code.',
            due_date=timezone.now() + timedelta(days=7), max_marks=100
        )
        a1_3 = Assignment.objects.create(
            module=c1_m3, title='Assignment 1.3: Contact Directory Dictionary',
            description='Design a console app that stores, updates, and deletes contacts from a nested dictionary.',
            due_date=timezone.now() + timedelta(days=12), max_marks=100
        )

        # Classroom for Course 1
        class1 = Classroom.objects.create(name='Python Section A - Spring 2026', course=c1)
        class1.faculty.add(f1, f2)  # Ada Lovelace and Feynman teach it

        # Live Sessions for Course 1
        # Completed session (yesterday)
        LiveSession.objects.create(
            classroom=class1, title='Welcome & Syllabus Review',
            description='Introduction to LMS, grading criteria, and Python IDE setup instructions.',
            start_time=timezone.now() - timedelta(days=1, hours=2),
            end_time=timezone.now() - timedelta(days=1, hours=1),
            meeting_link='https://zoom.us/j/111111111'
        )
        # Ongoing / Today Session
        LiveSession.objects.create(
            classroom=class1, title='Variables, Types, and Shell Basics',
            description='Live coding exercises with integers, strings, floats, and Boolean algebra.',
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=2.5),
            meeting_link='https://zoom.us/j/222222222'
        )
        # Upcoming Session (next week)
        LiveSession.objects.create(
            classroom=class1, title='Control flow and writing functions',
            description='Conditional execution logic, parameter passing, and return statements.',
            start_time=timezone.now() + timedelta(days=5, hours=3),
            end_time=timezone.now() + timedelta(days=5, hours=4),
            meeting_link='https://zoom.us/j/333333333'
        )


        # --- COURSE 2: Web Development ---
        c2 = Course.objects.create(
            title='Modern Web Development with React',
            code='WD-201',
            description='Build interactive, beautiful user interfaces using HTML5, CSS3, Tailwind, and React.'
        )
        
        # Modules for Course 2
        c2_m1 = Module.objects.create(course=c2, title='HTML, CSS, and Layouts', order=1)
        c2_m2 = Module.objects.create(course=c2, title='Introduction to React & Hooks', order=2)
        
        # Materials for Course 2
        m2_vid1 = StudyMaterial.objects.create(
            module=c2_m1, title='Responsive layouts using CSS Grid and Flexbox', material_type='video',
            content_url='https://example.com/videos/flexbox_grid_web.mp4'
        )
        m2_pdf1 = StudyMaterial.objects.create(
            module=c2_m1, title='HTML Semantic Elements Guide', material_type='pdf',
            content_url='https://example.com/docs/html_semantics.pdf'
        )
        m2_vid2 = StudyMaterial.objects.create(
            module=c2_m2, title='React useState and useEffect lifecycle', material_type='video',
            content_url='https://example.com/videos/react_hooks.mp4'
        )

        # Assignment for Course 2
        a2_1 = Assignment.objects.create(
            module=c2_m1, title='Assignment 2.1: Single Page Responsive Portfolio',
            description='Create a single page resume/portfolio using semantic HTML and Flexbox layout styling.',
            due_date=timezone.now() + timedelta(days=5), max_marks=100
        )
        a2_2 = Assignment.objects.create(
            module=c2_m2, title='Assignment 2.2: Dynamic Todo List App',
            description='Implement a React todo application with local state, edits, filters, and localstorage.',
            due_date=timezone.now() + timedelta(days=10), max_marks=100
        )

        # Classroom for Course 2
        class2 = Classroom.objects.create(name='React Lab Section B', course=c2)
        class2.faculty.add(f3)  # Katherine Johnson teaches web dev

        # Live session for Course 2
        LiveSession.objects.create(
            classroom=class2, title='React State Management & Forms',
            description='Interactive session explaining hooks, controlled inputs, and validation libraries.',
            start_time=timezone.now() + timedelta(days=2, hours=1),
            end_time=timezone.now() + timedelta(days=2, hours=3),
            meeting_link='https://zoom.us/j/444444444'
        )


        # --- COURSE 3: Quantum Computing (EDGE CASE: Enrolled, but NO Classroom Assigned yet) ---
        c3 = Course.objects.create(
            title='Introduction to Quantum Computing',
            code='QC-301',
            description='A rigorous theoretical introduction to quantum bits (qubits), superposition, and quantum gates.'
        )
        # Module for Course 3
        c3_m1 = Module.objects.create(course=c3, title='Quantum States and Qubits', order=1)
        # Material
        m3_pdf1 = StudyMaterial.objects.create(
            module=c3_m1, title='Dirac Notation and Hilbert Spaces Summary', material_type='pdf',
            content_url='https://example.com/docs/dirac_notation.pdf'
        )
        # Assignment
        a3_1 = Assignment.objects.create(
            module=c3_m1, title='Assignment 3.1: Bloch Sphere calculations',
            description='Perform state rotations and calculate overlap probability vectors using standard notation.',
            due_date=timezone.now() + timedelta(days=14), max_marks=100
        )
        # Note: We do NOT create any classroom for Course 3, meaning no live sessions can be scheduled.


        # --- COURSE 4: Database Systems (EDGE CASE: A Course with NO Study Materials / Modules) ---
        c4 = Course.objects.create(
            title='Relational Database Management Systems',
            code='DB-401',
            description='Design, query, and optimize relational schemas using standard SQL queries and transaction logs.'
        )
        # No modules, no materials, no assignments created for DB-401!
        
        # Classroom for Course 4
        class4 = Classroom.objects.create(name='SQL Database Lab 1', course=c4)
        class4.faculty.add(f2)  # Feynman teaches DBs too
        
        LiveSession.objects.create(
            classroom=class4, title='SQL Joins & Grouping Live Demo',
            description='Live query sessions running inner, outer, self joins and aggregate clauses.',
            start_time=timezone.now() + timedelta(days=1, hours=4),
            end_time=timezone.now() + timedelta(days=1, hours=5.5),
            meeting_link='https://zoom.us/j/555555555'
        )


        self.stdout.write('Creating enrollments...')
        # Student 1 is enrolled in: Python, Web Dev, Quantum (no classroom), Database Systems
        Enrollment.objects.create(student=s1, course=c1, classroom=class1)
        Enrollment.objects.create(student=s1, course=c2, classroom=class2)
        Enrollment.objects.create(student=s1, course=c3, classroom=None)  # Enrolled but no classroom assigned yet
        Enrollment.objects.create(student=s1, course=c4, classroom=class4)

        # Student 2 is enrolled in: Python Basics only
        Enrollment.objects.create(student=s2, course=c1, classroom=class1)

        # Student 3 is enrolled in: Web Development only
        Enrollment.objects.create(student=s3, course=c2, classroom=class2)

        self.stdout.write('Seeding student progress and submissions (Student 1)...')
        # Student 1 completed some materials for Python Programming (Course 1)
        # Completed Module 1 material
        StudyMaterialCompletion.objects.create(student=s1, study_material=m1_vid1)
        StudyMaterialCompletion.objects.create(student=s1, study_material=m1_pdf1)
        # Completed Module 2 material
        StudyMaterialCompletion.objects.create(student=s1, study_material=m2_pdf1)
        # Module 3 material is NOT completed (m3_link1)

        # Student 1 has submissions
        # Submissions for Python Basics (Course 1)
        # Completed and Evaluated submission
        AssignmentSubmission.objects.create(
            assignment=a1_1, student=s1,
            submission_text='print("Hello World")\n# Variables assignment\nx = 5\ny = 10\nprint(x + y)',
            marks_obtained=95, feedback='Excellent script structure, clean code and comments.'
        )
        # Submitted, but NOT graded yet
        AssignmentSubmission.objects.create(
            assignment=a1_2, student=s1,
            submission_text='i = 1\nwhile i <= 100:\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)\n    i += 1',
            marks_obtained=None, feedback=''
        )
        # Assignment 1.3 is not submitted (PENDING / PUBLISHED)

        # Submissions for Web Dev (Course 2)
        # Submitted, graded 88
        AssignmentSubmission.objects.create(
            assignment=a2_1, student=s1,
            submission_text='<!DOCTYPE html><html><head><title>Portfolio</title></head><body><h1>My Resume</h1></body></html>',
            marks_obtained=88, feedback='Good structure, add more visual styling next time.'
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded LMS data!'))
        self.stdout.write(f'Credentials created:\n  - student1 / student123\n  - student2 / student123\n  - student3 / student123\n  - admin / adminpassword')
