from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.datasets.views import DatasetViewSet

class OptionalSlashRouter(DefaultRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = r'(?:/)?'

router = OptionalSlashRouter()
router.register(r"", DatasetViewSet, basename="dataset")

urlpatterns = [
    path("", include(router.urls)),
]
