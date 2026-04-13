from django.contrib import admin
from apps.shared_models import PromptTemplate
from .models import AgentSystemPrompt, ReportPrompt, WidgetScriptBinding

@admin.register(AgentSystemPrompt)
class AgentSystemPromptAdmin(admin.ModelAdmin):
    list_display = ("name", "agent_key", "version", "is_active", "created_at")
    list_filter = ("is_active", "agent_key")
    search_fields = ("name", "agent_key", "content", "description")
    ordering = ("agent_key",)

@admin.register(ReportPrompt)
class ReportPromptAdmin(admin.ModelAdmin):
    list_display = ("project", "version", "is_active", "created_at")
    list_filter = ("is_active", "project")
    search_fields = ("content", "project__name")
    raw_id_fields = ("project", "created_by")

@admin.register(WidgetScriptBinding)
class WidgetScriptBindingAdmin(admin.ModelAdmin):
    list_display = ("widget_id", "dashboard", "script_type", "version", "created_at")
    list_filter = ("script_type", "version")
    search_fields = ("widget_id", "prompt", "script_content")
    raw_id_fields = ("dashboard",)

@admin.register(PromptTemplate)
class PromptTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "version", "is_public", "created_at")
    list_filter = ("category", "is_public")
    search_fields = ("name", "content", "description")
