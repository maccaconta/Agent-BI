from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.dashboards.views import DashboardViewSet

class OptionalSlashRouter(DefaultRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = r'(?:/)?'

router = OptionalSlashRouter()
router.register(r"", DashboardViewSet, basename="dashboard")

urlpatterns = [
    path("", include(router.urls)),
]
