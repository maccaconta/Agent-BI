"""
apps.governance.models
──────────────────────
Modelos para controle de diretrizes globais da IA (System Prompts).
"""
import uuid
from django.db import models
from apps.users.models import TimeStampedModel, Tenant, User
from apps.projects.models import Project





class AgentSystemPrompt(TimeStampedModel):
    """
    Prompts de sistema específicos para cada agente técnico (Supervisor, Pandas, NL2SQL, etc).
    Permite governança granular sobre o comportamento de cada componente da IA.
    """
    agent_key = models.CharField(
        max_length=100, 
        unique=True, 
        verbose_name="Chave do Agente",
        help_text="Ex: supervisor_agent, pandas_agent, nl2sql_agent"
    )
    name = models.CharField(max_length=255, verbose_name="Nome do Agente")
    description = models.TextField(blank=True, verbose_name="Descrição/Objetivo")
    content = models.TextField(verbose_name="System Prompt")
    
    is_active = models.BooleanField(default=True, verbose_name="Ativo")
    version = models.CharField(max_length=20, default="1.0.0", verbose_name="Versão")

    class Meta:
        db_table = "governance_agent_prompts"
        verbose_name = "System Prompt de Agente"
        verbose_name_plural = "System Prompts de Agentes"
        ordering = ["agent_key"]

    def __str__(self):
        return f"{self.name} ({self.agent_key})"


class ReportPrompt(TimeStampedModel):
    """
    Prompt de Relatório: O "Contrato" que define o dashboard.
    Substitui a instrução genérica por um documento estruturado e versionado.
    """
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="report_prompts",
        verbose_name="Projeto"
    )
    content = models.TextField(
        verbose_name="Conteúdo do Prompt",
        help_text="Descrição estruturada dos objetivos, KPIs e widgets do dashboard."
    )
    version = models.PositiveIntegerField(default=1, verbose_name="Versão")
    is_active = models.BooleanField(default=True, verbose_name="Ativo")
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="report_prompts_created"
    )

    class Meta:
        db_table = "governance_report_prompts"
        verbose_name = "Prompt de Relatório"
        verbose_name_plural = "Prompts de Relatório"
        ordering = ["-version", "-created_at"]

    def __str__(self):
        return f"Prompt V{self.version} - {self.project.name}"


class WidgetScriptBinding(TimeStampedModel):
    """
    Binding de Script por Widget: Rastreabilidade total do "DNA" do componente.
    Vincula o prompt individual do widget ao código (SQL/Python) gerado.
    """
    class ScriptType(models.TextChoices):
        SQL = "SQL", "SQL Query"
        PYTHON = "PYTHON", "Python/Pandas Script"

    dashboard = models.ForeignKey(
        "dashboards.Dashboard",
        on_delete=models.CASCADE,
        related_name="script_bindings",
        verbose_name="Dashboard"
    )
    widget_id = models.CharField(
        max_length=100,
        verbose_name="ID do Widget",
        help_text="ID único do widget no JSON de configuração do dashboard."
    )
    
    # Prompt individual do widget
    prompt = models.TextField(
        verbose_name="Prompt do Widget",
        help_text="Instrução específica para este componente."
    )
    
    # Resultado técnico
    script_type = models.CharField(
        max_length=20,
        choices=ScriptType.choices,
        default=ScriptType.SQL
    )
    script_content = models.TextField(
        verbose_name="Conteúdo do Script",
        help_text="SQL ou código Python que gera os dados deste widget."
    )
    
    version = models.PositiveIntegerField(default=1, verbose_name="Versão")

    class Meta:
        db_table = "governance_widget_scripts"
        verbose_name = "Binding de Script de Widget"
        verbose_name_plural = "Bindings de Scripts de Widgets"
        unique_together = [("dashboard", "widget_id", "version")]
        ordering = ["-version", "widget_id"]

    def __str__(self):
        return f"{self.widget_id} ({self.script_type}) - V{self.version}"


class GlobalAIConfig(TimeStampedModel):
    """
    Configurações Mestres de IA para o Tenant.
    Define parâmetros globais de inferência e identidade.
    """
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name="ai_configs",
        null=True, blank=True
    )
    
    # Identidade Global
    persona_title = models.CharField(
        max_length=255, 
        default="Analista Financeiro Sênior",
        verbose_name="Título da Persona"
    )
    persona_description = models.TextField(
        default="Você é um analista financeiro sênior especializado em identificar relações ocultas em dados e gerar insights estratégicos.",
        verbose_name="Descrição da Persona"
    )
    
    # Parâmetros Técnicos de Inferência
    temperature = models.FloatField(default=0.3, verbose_name="Temperatura")
    top_p = models.FloatField(default=0.9, verbose_name="Top P")
    top_k = models.IntegerField(default=250, verbose_name="Top K")
    max_tokens_limit = models.IntegerField(default=32000, verbose_name="Limite de Tokens")
    
    # Governança de Dados
    ingestion_row_limit = models.IntegerField(default=5000, verbose_name="Limite de Ingestão (Linhas)")
    compliance_rules = models.TextField(blank=True, verbose_name="Diretrizes de Compliance")
    
    language = models.CharField(max_length=10, default="pt-BR", verbose_name="Idioma")
    is_active = models.BooleanField(default=True, verbose_name="Ativo")

    class Meta:
        db_table = "governance_global_config"
        verbose_name = "Configuração Global de IA"
        verbose_name_plural = "Configurações Globais de IA"

    def __str__(self):
        return f"Master Config - {self.persona_title}"
