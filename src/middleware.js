/**
 * @fileoverview Next.js Middleware Configuration
 *
 * This middleware integrates Clerk authentication with Next.js to protect
 * routes that require authentication. It runs on every request and determines
 * whether to allow access based on the route and authentication status.
 *
 * Public Routes (no auth required):
 * - / (home page)
 * - /sign-in (authentication)
 * - /sign-up (registration)
 * - /api (API routes - handled separately)
 *
 * Protected Routes (auth required):
 * - /projects/* (project views)
 * - /pricing (pricing page)
 * - Any other routes not in the public list
 *
 * @see https://clerk.com/docs/references/nextjs/clerk-middleware
 * @module middleware
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Route matcher for public routes
 *
 * Defines which routes should be accessible without authentication.
 * Uses regex-like patterns to match route paths.
 *
 * @constant {Function}
 */
const isPublicRoute = createRouteMatcher([
    "/",              // Home page - accessible to all
    "/sign-in(.*)",   // Sign in page and sub-routes
    "/sign-up(.*)",   // Sign up page and sub-routes
    "/api(.*)"        // API routes - auth handled within each route
]);

/**
 * Clerk middleware handler
 *
 * Intercepts all requests and enforces authentication on protected routes.
 * For public routes, allows the request to proceed without authentication.
 * For protected routes, calls auth.protect() which will:
 * - Redirect unauthenticated users to sign-in
 * - Allow authenticated users to proceed
 *
 * @param {Object} auth - Clerk auth object with methods for authentication
 * @param {Request} req - The incoming request
 */
export default clerkMiddleware(async (auth, req) => {
    // Only protect routes that are not in the public list
    if (!isPublicRoute(req)) {
        await auth.protect();  // Redirects to sign-in if not authenticated
    }
});

/**
 * Middleware matcher configuration
 *
 * Defines which routes this middleware should run on.
 * Excludes static files and Next.js internals for performance.
 *
 * Pattern explanation:
 * - Excludes /_next (Next.js internals)
 * - Excludes static files (html, css, js, images, fonts, etc.)
 * - Always runs for /api and /trpc routes
 */
export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
