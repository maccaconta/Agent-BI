import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('agent_bi_access_token')?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isPublicFile = request.nextUrl.pathname.includes('.') || request.nextUrl.pathname.startsWith('/api');

  // Se não houver token e não for a página de login ou um arquivo público/API, redireciona para o login
  if (!token && !isLoginPage && !isPublicFile) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário já estiver logado e tentar acessar o login, manda para o projects
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/projects', request.url));
  }

  return NextResponse.next();
}

// Configura em quais rotas o proxy deve rodar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logos (pasta de logos públicos)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logos).*)',
  ],
};
