from django.contrib import admin
from .models import AuditEvent, ExecutionTrace

@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "action", "user_email", "resource_type", "resource_id", "request_path")
    list_filter = ("action", "resource_type", "timestamp")
    search_fields = ("user_email", "resource_id", "request_path", "payload")
    readonly_fields = [f.name for f in AuditEvent._meta.fields]
    
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(ExecutionTrace)
class ExecutionTraceAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "job_type", "step_name", "status", "duration_ms")
    list_filter = ("job_type", "status", "timestamp")
    search_fields = ("step_name", "message", "trace_id")
    readonly_fields = ("timestamp",)
