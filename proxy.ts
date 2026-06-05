import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = ['/login', '/register', '/'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only check if already logged in (cookie based) for public routes
  const userId = request.cookies.get('user_id')?.value;

  // If already logged in and trying to access login/register, redirect to dashboard
  if ((pathname === '/login' || pathname === '/register') && userId) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Otherwise, let client-side handle authentication
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
