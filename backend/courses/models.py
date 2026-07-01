from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Faculty(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    avatar = models.URLField(max_length=300, blank=True, null=True)
    bio = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Faculty"

    def __str__(self):
        return self.name

class Course(models.Model):
    title = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.title}"

class Classroom(models.Model):
    name = models.CharField(max_length=100)  # e.g., "Section A", "Python Class 2026"
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="classrooms")
    faculty = models.ManyToManyField(Faculty, related_name="classrooms")

    def __str__(self):
        return f"{self.course.code} ({self.name})"

class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    classroom = models.ForeignKey(Classroom, on_delete=models.SET_NULL, null=True, blank=True, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        classroom_str = self.classroom.name if self.classroom else "No Classroom Assigned"
        return f"{self.student.username} enrolled in {self.course.code} ({classroom_str})"

class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']
        unique_together = ('course', 'order')

    def __str__(self):
        return f"{self.course.code} - {self.title}"

class LiveSession(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="live_sessions")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    meeting_link = models.URLField(max_length=300)

    class Meta:
        ordering = ['start_time']

    @property
    def status(self):
        now = timezone.now()
        if now < self.start_time:
            return "upcoming"
        elif self.start_time <= now <= self.end_time:
            return "ongoing"
        else:
            return "completed"

    def __str__(self):
        return f"{self.title} ({self.status})"

class StudyMaterial(models.Model):
    MATERIAL_TYPES = [
        ('video', 'Video'),
        ('pdf', 'PDF Document'),
        ('link', 'Web Link'),
    ]
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="study_materials")
    title = models.CharField(max_length=200)
    material_type = models.CharField(max_length=10, choices=MATERIAL_TYPES)
    content_url = models.URLField(max_length=300)

    def __str__(self):
        return f"[{self.get_material_type_display()}] {self.title}"

class StudyMaterialCompletion(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="completions")
    study_material = models.ForeignKey(StudyMaterial, on_delete=models.CASCADE, related_name="completions")
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'study_material')

    def __str__(self):
        return f"{self.student.username} completed {self.study_material.title}"

class Assignment(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="assignments")
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()
    max_marks = models.PositiveIntegerField(default=100)

    def __str__(self):
        return self.title

class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="submissions")
    submission_text = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    marks_obtained = models.PositiveIntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)

    class Meta:
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"{self.student.username}'s submission for {self.assignment.title}"
