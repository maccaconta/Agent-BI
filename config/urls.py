"""
Agent-BI — URL Configuration principal.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

# ─── API v1 URL Patterns ──────────────────────────────────────────────────────
api_v1_patterns = [
    # Auth
    re_path(r"^auth/?", include("apps.users.urls")),
    # Core resources
    re_path(r"^projects/?", include("apps.projects.urls")),
    re_path(r"^datasets/?", include("apps.datasets.urls")),
    re_path(r"^dashboards/?", include("apps.dashboards.urls")),
    re_path(r"^versions/?", include("apps.versions.urls")),
    re_path(r"^approvals/?", include("apps.approvals.urls")),
    # Knowledge (Governança & Policies)
    re_path(r"^governance/?", include("apps.governance.urls")),
    re_path(r"^templates/?", include("apps.templates_lib.urls")),
    re_path(r"^instructions/?", include("apps.instructions.urls")),
    # AI & Infra
    re_path(r"^copilot/?", include("apps.ai_engine.urls")),
    re_path(r"^ai/?", include("apps.ai_engine.urls")),
    re_path(r"^infra/?", include("apps.infra.urls")),
    # Audit & Compliance
    re_path(r"^audit/?", include("apps.audit.urls")),
]

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/", include(api_v1_patterns)),
    # API Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]
