"use client";

/**
 * @fileoverview React Query Provider Component
 *
 * This component provides the React Query (TanStack Query) context to the
 * entire application. React Query handles data fetching, caching, and
 * state management for server data.
 *
 * Features:
 * - Query caching and invalidation
 * - Automatic background refetching
 * - Optimistic updates
 * - Loading and error states
 *
 * @see https://tanstack.com/query/latest
 * @module components/query-provider
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * QueryProvider Component
 *
 * Wraps the application with React Query's context provider.
 * Creates a stable QueryClient instance that persists across renders.
 *
 * The QueryClient is created inside a useState hook to ensure:
 * - Only one instance is created per component lifecycle
 * - The instance persists across re-renders
 * - Each user session gets a fresh client
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} The provider wrapping children
 *
 * @example
 * // Used in the root layout
 * <QueryProvider>
 *   {children}
 * </QueryProvider>
 */
export function QueryProvider({ children }) {
    /**
     * Create QueryClient inside useState to ensure stable instance
     * This prevents creating a new client on every render
     */
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
