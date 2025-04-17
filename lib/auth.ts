import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user information
 * @returns Object containing user information or null if not authenticated
 */
export function getCurrentUser() {
  const { userId } = auth();
  
  if (!userId) {
    return null;
  }
  
  return {
    id: userId,
  };
}

/**
 * Function to check if the user is authenticated, redirect if not
 * @param redirectUrl - URL to redirect to if user is not authenticated
 */
export function requireAuth(redirectUrl: string = "/auth/login") {
  if (!getCurrentUser()) {
    redirect(redirectUrl);
  }
}

/**
 * Function to check if the user is authenticated, redirect if so
 * This is useful for pages like login/signup where authenticated users shouldn't see them
 * @param redirectUrl - URL to redirect to if user is authenticated
 */
export function requireUnauth(redirectUrl: string = "/dashboard") {
  if (getCurrentUser()) {
    redirect(redirectUrl);
  }
}

/**
 * Get the session expiration information
 * Returns time remaining in seconds if session is active, or null if no session
 */
export function getSessionExpiration() {
  const { sessionId } = auth();
  
  if (!sessionId) {
    return null;
  }
  
  // This is a placeholder - in a real implementation you would get the expiration
  // from Clerk's API. For now, we'll just return the middleware expiration setting.
  return 7200; // 2 hours in seconds
} 