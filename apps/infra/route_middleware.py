import logging
from django.urls import resolve, Resolver404
from django.http import HttpResponsePermanentRedirect

logger = logging.getLogger("apps.core")

class RobustRouteMiddleware:
    """
    Middleware que garante que as rotas de API funcionem com ou sem barra final (trailing slash),
    evitando erros 404 causados por inconsistências entre frontend e backend.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        
        # Só processa rotas de API, exceto materialização (que é sensível a socket)
        if not path.startswith("/api/") or "materialize" in path:
            return self.get_response(request)

        try:
            # Tenta resolver o path atual
            resolve(path)
        except Resolver404:
            # Se falhar, tenta com ou sem a barra final
            if path.endswith("/"):
                new_path = path[:-1]
            else:
                new_path = f"{path}/"
            
            try:
                # Tenta resolver o path normalizado
                resolve(new_path)
                
                # Se for um GET, podemos redirecionar com segurança
                if request.method == "GET":
                    logger.debug(f"[RobustRoute] Redirecionando {path} -> {new_path}")
                    return HttpResponsePermanentRedirect(new_path)
                
                # Para POST/PUT/DELETE, não podemos redirecionar (perde dados),
                # então "mascaramos" o path interno para que o Django o encontre.
                request.path_info = new_path
                logger.info(f"[RobustRoute] Normalizando internamente: {path} -> {new_path}")
            except Resolver404:
                # Se ainda assim não resolver, deixa o fluxo normal seguir (vai dar 404 depois)
                pass

        return self.get_response(request)
