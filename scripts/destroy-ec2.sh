#!/bin/bash

echo "=========================================================="
echo "🧹 LIMPANDO AMBIENTE - AGENT-BI (AWS EC2)"
echo "=========================================================="

# 1. Parar e remover contêineres e volumes
echo "--- (1/2) Parando contêineres e removendo volumes ---"
sudo docker-compose down -v

# 2. Limpeza adicional de imagens
echo "--- (2/2) Removendo imagens órfãs para liberar espaço ---"
sudo docker image prune -a -f

echo "=========================================================="
echo "✅ LIMPEZA CONCLUÍDA!"
echo "Os dados foram removidos dos volumes Docker."
echo "⚠️ LEMBRETE: Não esqueça de dar 'Terminate' na instância no console AWS para parar a cobrança!"
echo "=========================================================="
