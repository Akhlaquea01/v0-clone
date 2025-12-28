/**
 * @fileoverview Message React Query Hooks
 *
 * This module provides React Query hooks for message-related operations.
 * Messages are the core communication mechanism between users and the AI agent
 * within a project context.
 *
 * Features:
 * - Automatic polling for new messages (5-second interval)
 * - Cache prefetching for better UX
 * - Optimistic cache invalidation on message creation
 *
 * @module modules/messages/hooks/message
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createMessages, getMessages } from "../actions";

/**
 * Prefetch messages for a project
 *
 * Used for server-side or early client-side data fetching to improve
 * perceived performance. The prefetched data is cached and immediately
 * available when the component using useGetMessages mounts.
 *
 * @async
 * @param {QueryClient} queryClient - The React Query client instance
 * @param {string} projectId - The project ID to prefetch messages for
 * @returns {Promise<void>}
 *
 * @example
 * // In a server component or effect
 * await prefetchMessages(queryClient, projectId);
 */
export const prefetchMessages = async (queryClient, projectId) => {
    await queryClient.prefetchQuery({
        queryKey: ["messages", projectId],
        queryFn: () => getMessages(projectId),
        staleTime: 10000 // Consider data fresh for 10 seconds
    })
}

/**
 * Hook to fetch messages for a project
 *
 * Retrieves all messages in a project's conversation, including
 * user messages and AI responses with their associated fragments.
 *
 * Features:
 * - 10-second stale time to reduce unnecessary refetches
 * - Auto-polling every 5 seconds when messages exist
 *   (to catch new AI responses)
 *
 * @param {string} projectId - The project ID to fetch messages for
 * @returns {UseQueryResult} React Query result object containing:
 *   - data: Array of message objects with fragments
 *   - isPending: Boolean indicating initial loading state
 *   - isError: Boolean indicating error state
 *   - error: Error object if request failed
 *
 * @example
 * const { data: messages, isPending, isError } = useGetMessages(projectId);
 */
export const useGetMessages = (projectId) => {
    return useQuery({
        queryKey: ["messages", projectId],
        queryFn: () => getMessages(projectId),
        staleTime: 10000, // Data considered fresh for 10 seconds

        /**
         * Auto-refetch interval configuration
         * Only polls when there are existing messages (conversation active)
         * This catches new AI-generated responses
         *
         * @param {Object} query - The query object
         * @returns {number|false} Polling interval in ms, or false to disable
         */
        refetchInterval: (query) => {
            // Poll every 5 seconds if we have messages (active conversation)
            // This helps catch AI responses as they complete
            return query.state.data?.length ? 5000 : false;
        }
    })
}

/**
 * Hook to create a new message in a project
 *
 * Sends a new message to the AI agent within a project context.
 * The message triggers the Inngest workflow to process the request
 * and generate code changes.
 *
 * On success, invalidates:
 * - Messages cache: To show the new user message immediately
 * - Status cache: To update remaining credits
 *
 * @param {string} projectId - The project ID to create message in
 * @returns {UseMutationResult} React Query mutation result containing:
 *   - mutateAsync: Async function to create message
 *   - isPending: Boolean indicating mutation in progress
 *   - isError: Boolean indicating mutation failed
 *   - error: Error object if mutation failed
 *
 * @example
 * const { mutateAsync, isPending } = useCreateMessages(projectId);
 * await mutateAsync("Add a dark mode toggle");
 */
export const useCreateMessages = (projectId) => {
    const queryClient = useQueryClient();

    return useMutation({
        /**
         * Mutation function that calls the createMessages server action
         * @param {string} value - The message content
         */
        mutationFn: (value) => createMessages(value, projectId),

        /**
         * On successful message creation:
         * 1. Invalidate messages to show new message and trigger refetch
         * 2. Invalidate status to update remaining credits
         */
        onSuccess: () => {
            // Invalidate messages to refetch and show new message
            queryClient.invalidateQueries({
                queryKey: ["messages", projectId]
            })

            // Invalidate usage status since sending a message consumes credits
            queryClient.invalidateQueries({
                queryKey: ["status"]
            })
        }
    })
}
