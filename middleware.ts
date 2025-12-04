import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/api/auth"];
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => 
    pathname === route || pathname.startsWith(route + "/")
  );

  // Protected routes
  const protectedRoutes = ["/dashboard", "/notebook", "/protocols", "/replications"];
  const isProtectedRoute = protectedRoutes.some((route) => 
    pathname.startsWith(route)
  );

  // Allow access to public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, check for session token in cookies
  if (isProtectedRoute) {
    const sessionToken = request.cookies.get("next-auth.session-token") || 
                        request.cookies.get("__Secure-next-auth.session-token");
    
    if (!sessionToken) {
      // Redirect to login if not authenticated
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/notebook/:path*",
    "/protocols/:path*",
    "/replications/:path*",
  ],
};

