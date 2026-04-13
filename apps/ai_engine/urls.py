from django.urls import path

from apps.ai_engine.views import (
    CopilotGenerateAPIView, 
    CopilotSQLPreviewAPIView,
    ReportPromptPlanAPIView,
    ReportPromptMaterializeAPIView
)

urlpatterns = [
    path("generate", CopilotGenerateAPIView.as_view(), name="copilot-generate"),
    path("sql-preview", CopilotSQLPreviewAPIView.as_view(), name="copilot-sql-preview"),
    path("report-prompt/plan", ReportPromptPlanAPIView.as_view(), name="report-prompt-plan"),
    path("report-prompt/materialize", ReportPromptMaterializeAPIView.as_view(), name="report-prompt-materialize"),
]
