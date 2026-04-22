"""
apps.governance.views
─────────────────────
Views para gestão de políticas e diretrizes de IA por Administradores.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
import os
from django.conf import settings
# Remover import temporário do spectacular para evitar conflitos de introspecção
from apps.shared_models import PromptTemplate
from apps.governance.models import GlobalAIConfig, AgentSystemPrompt
from apps.governance.serializers import (
    PromptTemplateSerializer, GlobalAIConfigSerializer, AgentSystemPromptSerializer
)
from apps.ai_engine.services.prompt_service import PromptService
from django.db.models import Sum, Count, F, Q, Value
from django.db.models.functions import TruncDate, Coalesce
from apps.audit.models import ExecutionTrace
from apps.users.models import UsageQuota, User, TenantMember
from apps.projects.models import Project
from apps.governance.services.pricing_service import PricingService
from rest_framework.decorators import action


class GlobalAIConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet para as diretrizes mestres de IA (Global System Prompt).
    Centraliza Temperatura, Persona e Limites Técnicos.
    """
    queryset = GlobalAIConfig.objects.all()
    serializer_class = GlobalAIConfigSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    pagination_class = None

    def get_queryset(self):
        # Garante que sempre exista pelo menos uma configuração padrão se solicitado
        if not GlobalAIConfig.objects.exists():
            GlobalAIConfig.objects.create(
                persona_title="Analista Financeiro Sênior",
                is_active=True
            )
        return GlobalAIConfig.objects.all()


class PromptTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar a Biblioteca de Prompts Especialistas.
    Permite customizar as personas de Risco, Tesouraria, Compliance, etc.
    """
    serializer_class = PromptTemplateSerializer
    queryset = PromptTemplate.objects.all()
    pagination_class = None  # Desativa paginação para facilitar consumo no frontend corporativo
    permission_classes = [permissions.AllowAny] 
    authentication_classes = [] # Desativa autenticação para evitar erros de MockAuth em ambiente dev
    
    def get_queryset(self):
        # Retorna todos os templates públicos
        queryset = self.queryset.filter(is_public=True)
        category = self.request.query_params.get("category")
        
        # Log de debug para rastreamento (aparece no log do servidor Django)
        print(f"[DEBUG] PromptTemplate Query: category={category} | count={queryset.count()}")
        
        if category:
            # Filtro insensível a maiúsculas/minúsculas para maior resiliência
            queryset = queryset.filter(category__iexact=category)
            
        return queryset




class CostGovernanceViewSet(viewsets.ViewSet):
    """
    ViewSet administrativo para controle financeiro e governança de tokens.
    """
    permission_classes = [permissions.AllowAny] # Ambientes dev/mock
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Resumo consolidado por usuário e projeto."""
        # 1. Agregação por Usuário
        user_usage = ExecutionTrace.objects.values('user_id').annotate(
            total_in=Coalesce(Sum('input_tokens'), 0),
            total_out=Coalesce(Sum('output_tokens'), 0),
            steps=Count('id')
        ).filter(total_in__gt=0)
        
        users_map = {str(u.id): u.email for u in User.objects.all()}
        
        user_data = []
        for usage in user_usage:
            uid = str(usage['user_id'])
            cost = PricingService.calculate_cost(usage['total_in'], usage['total_out'])
            user_data.append({
                "user_id": uid,
                "email": users_map.get(uid, "Usuário Removido"),
                "total_tokens": usage['total_in'] + usage['total_out'],
                "total_cost_usd": cost
            })

        # 2. Agregação por Domínio de Dados (Data Mesh)
        project_usage = ExecutionTrace.objects.values('project_id').annotate(
            total_in=Coalesce(Sum('input_tokens'), 0),
            total_out=Coalesce(Sum('output_tokens'), 0)
        ).filter(Q(total_in__gt=0) | Q(total_out__gt=0))
        
        # Mapeamento de Projeto -> Nome do Domínio
        # Buscamos todos os projetos e seus domínios para criar o de/para
        projects = Project.objects.select_related('domain').all()
        proj_to_domain = {}
        for p in projects:
            proj_to_domain[str(p.id)] = p.domain.name if p.domain else "Transversal / Sem Domínio"

        # Consolidação por Nome de Domínio
        domain_costs = {}
        for usage in project_usage:
            pid = str(usage['project_id'])
            domain_name = proj_to_domain.get(pid, "Transversal / Sem Domínio")
            
            if domain_name not in domain_costs:
                domain_costs[domain_name] = {"total_tokens": 0, "total_cost_usd": 0}
            
            cost = PricingService.calculate_cost(usage['total_in'], usage['total_out'])
            domain_costs[domain_name]["total_tokens"] += (usage['total_in'] + usage['total_out'])
            domain_costs[domain_name]["total_cost_usd"] += cost

        project_data = []
        for name, data in domain_costs.items():
            project_data.append({
                "project_id": name,
                "name": name,
                "total_tokens": data["total_tokens"],
                "total_cost_usd": round(data["total_cost_usd"], 4)
            })

        return Response({
            "by_user": sorted(user_data, key=lambda x: x['total_cost_usd'], reverse=True),
            "by_project": sorted(project_data, key=lambda x: x['total_cost_usd'], reverse=True)
        })

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Dados temporais para gráficos de linha/área."""
        days = 30 # Default
        usage_history = ExecutionTrace.objects.annotate(
            date=TruncDate('timestamp')
        ).values('date').annotate(
            total_in=Coalesce(Sum('input_tokens'), 0),
            total_out=Coalesce(Sum('output_tokens'), 0)
        ).order_by('date')
        
        history_data = []
        for entry in usage_history:
            cost = PricingService.calculate_cost(entry['total_in'], entry['total_out'])
            history_data.append({
                "date": entry['date'].strftime('%Y-%m-%d'),
                "tokens": entry['total_in'] + entry['total_out'],
                "cost_usd": cost
            })
            
        return Response(history_data)

    @action(detail=False, methods=['get'])
    def users_quotas(self, request):
        """Lista usuários e seus limites atuais, garantindo que todos tenham quota."""
        active_users = User.objects.filter(is_active=True, is_deleted=False)
        
        # Garantir quota para todos (Lazy initialization)
        for user in active_users:
            UsageQuota.objects.get_or_create(user=user)
            
        quotas = UsageQuota.objects.filter(user__in=active_users).select_related('user').all()
        data = []
        for q in quotas:
            total_consumed = q.input_tokens_count + q.output_tokens_count
            cost = PricingService.calculate_cost(q.input_tokens_count, q.output_tokens_count)
            data.append({
                "user_id": str(q.user.id),
                "email": q.user.email,
                "role": q.user.get_tenant_role(request.tenant) if hasattr(request, 'tenant') else "VIEWER",
                "consumed_tokens": total_consumed,
                "max_limit": q.max_tokens_monthly_limit,
                "percent_used": round((total_consumed / q.max_tokens_monthly_limit * 100), 2) if q.max_tokens_monthly_limit > 0 else 0,
                "max_logins": q.max_logins_limit,
                "total_logins": q.total_logins_count,
                "cost_usd": cost
            })
        return Response(data)

    @action(detail=False, methods=['post'])
    def update_limit(self, request):
        """Atualiza o limite de tokens e logins de um usuário."""
        user_id = request.data.get("user_id")
        new_limit = request.data.get("limit")
        new_login_limit = request.data.get("login_limit")
        
        if not user_id:
            return Response({"error": "user_id é obrigatório"}, status=400)
            
        quota, _ = UsageQuota.objects.get_or_create(user_id=user_id)
        
        if new_limit is not None:
            quota.max_tokens_monthly_limit = new_limit
        if new_login_limit is not None:
            quota.max_logins_limit = new_login_limit
            
        quota.save()
            
        return Response({
            "status": "success", 
            "new_limit": quota.max_tokens_monthly_limit,
            "new_login_limit": quota.max_logins_limit
        })

    @action(detail=False, methods=['post'])
    def update_user_role(self, request):
        """Atualiza o papel (role) do usuário no tenant atual ou primário."""
        user_id = request.data.get("user_id")
        new_role = request.data.get("role")
        
        if not user_id or not new_role:
            return Response({"error": "user_id e role são obrigatórios"}, status=400)
            
        role_map = {
            "Administrador": "ADMIN",
            "Criador": "ANALYST",
            "Visualizador": "VIEWER"
        }
        
        backend_role = role_map.get(new_role, new_role)
        
        if backend_role not in ["ADMIN", "ANALYST", "APPROVER", "VIEWER"]:
            return Response({"error": "Role inválido"}, status=400)
            
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"error": "Usuário não encontrado"}, status=404)
            
        tenant = user.primary_tenant
        if not tenant:
            return Response({"error": "Usuário não possui tenant primário"}, status=400)
            
        membership, created = TenantMember.objects.get_or_create(
            user=user, 
            tenant=tenant,
            defaults={"role": backend_role}
        )
        if not created:
            membership.role = backend_role
            membership.save()
            
        # Também atualiza a flag is_super_admin se for Administrador
        if backend_role == "ADMIN":
            user.is_super_admin = True
            user.save(update_fields=["is_super_admin"])
        elif user.is_super_admin:
            user.is_super_admin = False
            user.save(update_fields=["is_super_admin"])
            
        return Response({
            "status": "success", 
            "new_role": new_role,
            "backend_role": backend_role
        })

    @action(detail=False, methods=['post'])
    def invite_user(self, request):
        """Convida um novo usuário (criação via convite)."""
        email = request.data.get("email")
        role = request.data.get("role", "Visualizador")
        
        if not email:
            return Response({"error": "E-mail é obrigatório"}, status=400)
            
        # Simulação de convite/registro simplificado para o ambiente local
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email.split("@")[0],
                "is_active": True
            }
        )
        
        # Garantir Quota
        UsageQuota.objects.get_or_create(user=user)
        
        # Definir Role
        self.update_user_role(request=request) # Reaproveita a lógica de role
        
        return Response({
            "status": "success",
            "message": "Usuário convidado e configurado com sucesso.",
            "user_id": str(user.id),
            "created": created
        })

    @action(detail=False, methods=['post'])
    def delete_user(self, request):
        """Remove (desativa) um usuário do sistema."""
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id é obrigatório"}, status=400)
            
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"error": "Usuário não encontrado"}, status=404)
            
        user.is_active = False
        user.save(update_fields=["is_active"])
        
        return Response({"status": "success", "message": "Usuário desativado com sucesso."})

    @action(detail=False, methods=['post'])
    def purge_analytical_cache(self, request):
        """
        LIMPEZA PROFUNDA (Higiene de Dados):
        Remove o banco analítico temporário e os logs de execução.
        NÃO afeta usuários, projetos ou templates.
        """
        results = {"database": "skipped", "traces": 0}
        
        # 1. Limpeza do Banco Analítico (SQLite de Datasets)
        db_path = getattr(settings, "LOCAL_ANALYTICS_SQLITE_PATH", None)
        if db_path and os.path.exists(db_path):
            try:
                # Fechamos conexões se houver (opcional, OS.remove resolve se não houver lock ativo)
                os.remove(db_path)
                results["database"] = "purged"
            except Exception as e:
                results["database"] = f"error: {str(e)}"

        # 2. Limpeza de Logs de Execução (Audit Traces)
        try:
            count = ExecutionTrace.objects.count()
            ExecutionTrace.objects.all().delete()
            results["traces"] = count
        except Exception as e:
            results["traces"] = f"error: {str(e)}"

        return Response({
            "status": "success",
            "message": "Higiene de dados concluída. O ambiente analítico foi resetado.",
            "details": results
        })


class AgentSystemPromptViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manutenção manual dos prompts de sistema dos agentes técnicos.
    Fase 2 da Governança Dinâmica.
    """
    queryset = AgentSystemPrompt.objects.all()
    serializer_class = AgentSystemPromptSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    pagination_class = None

    def get_queryset(self):
        return AgentSystemPrompt.objects.all().order_by('name')

    def perform_create(self, serializer):
        instance = serializer.save()
        PromptService.invalidate_cache(instance.agent_key)

    def perform_update(self, serializer):
        instance = serializer.save()
        PromptService.invalidate_cache(instance.agent_key)
