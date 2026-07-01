from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, StudyMaterialToggleView

router = DefaultRouter()
router.register('courses', CourseViewSet, basename='course')

urlpatterns = [
    path('', include(router.urls)),
    path('study-materials/<int:pk>/toggle-complete/', StudyMaterialToggleView.as_view(), name='study-material-toggle'),
]
