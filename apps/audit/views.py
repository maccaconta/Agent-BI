from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.audit.models import ExecutionTrace
from rest_framework import serializers

class ExecutionTraceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExecutionTrace
        fields = "__all__"

class ExecutionTraceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExecutionTrace.objects.all()
    serializer_class = ExecutionTraceSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'], url_path='by-trace/(?P<trace_id>[^/.]+)')
    def by_trace(self, request, trace_id=None):
        """
        Retorna todos os passos de um trace_id específico.
        Implementa retry resiliente para lidar com locks temporários do SQLite.
        """
        import time
        from django.db import OperationalError
        import logging
        
        logger = logging.getLogger(__name__)
        max_retries = 3
        attempts = 0
        
        while attempts < max_retries:
            try:
                traces = self.queryset.filter(trace_id=trace_id).order_by('id')
                # Forçamos a avaliação do queryset para disparar o erro de banco se houver lock
                data = self.get_serializer(traces, many=True).data
                return Response(data)
            except OperationalError as e:
                attempts += 1
                if "database is locked" in str(e).lower() and attempts < max_retries:
                    logger.warning(f"[Audit] Banco ocupado. Tentativa {attempts}/{max_retries} em 1s...")
                    time.sleep(1)
                    continue
                logger.error(f"[Audit] Falha crítica de banco após {attempts} tentativas: {e}")
                return Response([], status=200) # Retorna vazio para não quebrar a UI
            except Exception as e:
                logger.error(f"[Audit] Erro inesperado na consulta de trace: {e}")
                return Response([], status=200)
