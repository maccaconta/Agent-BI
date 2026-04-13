from django.contrib import admin
from .models import Dataset, DatasetVersion

@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ("name", "project", "source_type", "status", "row_count", "created_at")
    list_filter = ("source_type", "status", "project")
    search_fields = ("name", "description", "glue_table", "glue_database")
    raw_id_fields = ("project", "created_by", "updated_by")
    readonly_fields = ("created_at", "updated_at", "processing_started_at", "processing_finished_at")

@admin.register(DatasetVersion)
class DatasetVersionAdmin(admin.ModelAdmin):
    list_display = ("dataset", "version_number", "is_current", "row_count", "created_at")
    list_filter = ("is_current", "dataset")
    search_fields = ("dataset__name", "notes")
    raw_id_fields = ("dataset", "created_by")
    readonly_fields = ("created_at", "updated_at")
