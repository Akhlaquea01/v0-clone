/**
 * @fileoverview Prisma Database Client
 *
 * This module provides a singleton Prisma client instance for database access.
 * It implements the recommended pattern for Next.js development to prevent
 * multiple client instances during hot reloading.
 *
 * In development mode, the client is cached on globalThis to persist across
 * hot reloads. In production, a new client is created for each cold start.
 *
 * @see https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 * @module lib/db
 */

import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client instance
 *
 * Configured with logging for development debugging:
 * - query: Log all database queries
 * - error: Log database errors
 * - warn: Log warnings
 * - info: Log informational messages
 *
 * In development, reuses the existing client to prevent connection exhaustion.
 *
 * @type {PrismaClient}
 */
const db = globalThis.prisma || new PrismaClient({
    log: ["query", "error", "warn", "info"],
});

/**
 * Cache the client in development to prevent multiple instances
 * during Next.js hot reloading. This prevents connection pool exhaustion.
 */
if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = db;
}

export default db;
