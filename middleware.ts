import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Add security and CORS headers to the outgoing response.
 */
function addSecurityHeaders(request: NextRequest, response: NextResponse) {
  console.log("🔒 Adding security headers...");

  // Headers required for embedding resources like videos
  response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");

  // Allow CORS for external requests (adjust '*' in production as needed)
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // General web security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
}

// 🔐 Main middleware export
export default clerkMiddleware((req) => {
  // Create a response now so we can modify headers
  const res = NextResponse.next();
  
  // Add security headers
  addSecurityHeaders(req as unknown as NextRequest, res);
  
  return res;
});

// Set session expiration in Clerk Dashboard settings rather than here
// (Settings > Sessions > Inactivity Timeout)

// 🧭 Middleware matcher: tells Next.js where this middleware should run
export const config = {
  matcher: [
    // Skip Next.js internals and most static files (HTML, CSS, images, etc.)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

    // Always include API routes
    "/(api|trpc)(.*)",

    // Custom video/audio/transcript API routes you want secured
    "/video/:path*",
    "/api/video/:path*",
    "/api/audio/:path*",
    "/api/transcript/:path*",
    "/api/media-proxy/:path*",
    
    // Allow access to profile-settings with catch-all paths
    "/((?!profile-settings/.*).*)",
  ],
};
