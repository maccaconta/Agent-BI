from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from .views import DataDomainViewSet, DataSubDomainViewSet, ProjectViewSet

class OptionalSlashRouter(DefaultRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = r'(?:/)?'

router = OptionalSlashRouter()
router.register(r'domains', DataDomainViewSet, basename='domains')
router.register(r'subdomains', DataSubDomainViewSet, basename='subdomains')
router.register(r'', ProjectViewSet, basename='projects')

urlpatterns = [
    path('', include(router.urls)),
]
