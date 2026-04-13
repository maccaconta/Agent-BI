from django.contrib import admin
from .models import Dashboard, GenerationJob

@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ("name", "project", "status", "is_public", "created_at")
    list_filter = ("status", "is_public", "project")
    search_fields = ("name", "description", "cloudfront_url")
    raw_id_fields = ("project", "report_prompt", "template", "current_version", "published_by", "created_by", "updated_by")
    readonly_fields = ("created_at", "updated_at")

@admin.register(GenerationJob)
class GenerationJobAdmin(admin.ModelAdmin):
    list_display = ("id", "dashboard", "status", "final_score", "started_at", "finished_at")
    list_filter = ("status",)
    search_fields = ("dashboard__name", "error_details")
    raw_id_fields = ("dashboard", "requested_by")
    readonly_fields = ("created_at", "updated_at", "started_at", "finished_at")
