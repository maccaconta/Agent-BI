from django.db.backends.signals import connection_created
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)

@receiver(connection_created)
def set_sqlite_pragma(sender, connection, **kwargs):
    """
    Ativa modo WAL e configurações de performance para SQLite.
    WAL (Write-Ahead Logging) é persistente no arquivo de banco, então 
    verificamos se já está ativo para evitar overhead e potenciais locks.
    """
    if connection.vendor == "sqlite":
        try:
            cursor = connection.cursor()
            # Verifica o modo atual antes de tentar mudar
            cursor.execute("PRAGMA journal_mode;")
            current_mode = cursor.fetchone()[0].lower()
            
            if current_mode != "wal":
                logger.debug(f"[Infra] Ativando WAL mode para SQLite (Atual: {current_mode})")
                cursor.execute("PRAGMA journal_mode=WAL;")
            
            # Estas configs são por conexão, mas leves
            cursor.execute("PRAGMA synchronous=NORMAL;")
            cursor.execute("PRAGMA cache_size=-64000;")  # 64MB cache
            cursor.execute("PRAGMA temp_store=MEMORY;")
        except Exception as e:
            logger.warning(f"[Infra] Erro ao configurar PRAGMAs do SQLite: {e}")
