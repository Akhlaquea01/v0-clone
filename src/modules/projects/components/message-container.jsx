/**
 * @fileoverview Message Container Component
 *
 * This component manages the message display area within a project view.
 * It handles fetching messages, rendering the conversation, and managing
 * the active fragment selection for the preview panel.
 *
 * Features:
 * - Automatic message fetching and caching
 * - Auto-scroll to latest message
 * - Fragment selection for preview
 * - Loading indicator for AI responses
 * - Error handling and empty states
 *
 * @module modules/projects/components/message-container
 */

import {
    useGetMessages,
    prefetchMessages,
} from "@/modules/messages/hooks/message";
import React, { useEffect, useRef } from "react";
import { MessageRole } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";

import { Spinner } from "@/components/ui/spinner";
import MessageCard from "./message-card";
import MessageForm from "./message-form";
import MessageLoading from "./message-loader";

/**
 * MessageContainer Component
 *
 * Container component that manages the message list and input form.
 * Handles automatic scrolling, fragment selection, and loading states.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.projectId - The ID of the current project
 * @param {Object|null} props.activeFragment - Currently selected fragment for preview
 * @param {Function} props.setActiveFragment - Callback to update the active fragment
 * @returns {JSX.Element} The rendered message container
 *
 * @example
 * <MessageContainer
 *   projectId="cuid123456"
 *   activeFragment={fragment}
 *   setActiveFragment={setFragment}
 * />
 */
const MessageContainer = ({ projectId, activeFragment, setActiveFragment }) => {
    // =========================================================================
    // HOOKS & REFS
    // =========================================================================

    /**
     * Query client for cache management and prefetching
     */
    const queryClient = useQueryClient();

    /**
     * Ref for auto-scrolling to the bottom of the message list
     */
    const bottomRef = useRef(null);

    /**
     * Tracks the last assistant message ID to prevent duplicate fragment updates
     */
    const lastAssistantMessageIdRef = useRef(null);

    /**
     * Fetch messages for the current project
     * Includes auto-polling for new AI responses
     */
    const {
        data: messages,
        isPending,
        isError,
        error,
    } = useGetMessages(projectId);

    // =========================================================================
    // EFFECTS
    // =========================================================================

    /**
     * Prefetch messages when project ID changes
     * Improves perceived performance by caching data early
     */
    useEffect(() => {
        if (projectId) {
            prefetchMessages(queryClient, projectId);
        }
    }, [projectId, queryClient]);

    /**
     * Auto-select the latest assistant fragment for preview
     * Only updates when a new assistant message appears
     */
    useEffect(() => {
        // Find the most recent assistant message
        const lastAssistantMessage = messages?.findLast(
            (message) => message.role === MessageRole.ASSISTANT
        );

        // Update fragment if it's new (prevents re-renders)
        if (lastAssistantMessage?.fragments &&
            lastAssistantMessage.id !== lastAssistantMessageIdRef.current) {
            setActiveFragment(lastAssistantMessage?.fragments);
            lastAssistantMessageIdRef.current = lastAssistantMessage.id;
        }
    }, [messages, setActiveFragment]);

    /**
     * Auto-scroll to the bottom when new messages arrive
     * Provides smooth scrolling for better UX
     */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages?.length]);

    // =========================================================================
    // LOADING STATE
    // =========================================================================

    if (isPending) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner className={"text-emerald-400"} />
            </div>
        );
    }

    // =========================================================================
    // ERROR STATE
    // =========================================================================

    if (isError) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                Error: {error?.message || "Failed to load messages"}
            </div>
        );
    }

    // =========================================================================
    // EMPTY STATE
    // =========================================================================

    if (!messages || messages.length === 0) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    No Messages yet. Start a conversation!
                </div>
                {/* Message form with gradient overlay */}
                <div className="relative p-3 pt-1">
                    <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background pointer-events-none" />
                    <MessageForm projectId={projectId} />
                </div>
            </div>
        );
    }

    // =========================================================================
    // MESSAGE LIST RENDER
    // =========================================================================

    // Determine if we should show the loading indicator
    const lastMessage = messages[messages.length - 1];
    const isLastMessageUser = lastMessage.role === MessageRole.USER;

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Scrollable message list */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {messages.map((message) => (
                    <MessageCard
                        key={message.id}
                        content={message.content}
                        role={message.role}
                        fragment={message.fragments}
                        createdAt={message.createdAt}
                        isActiveFragment={activeFragment?.id === message.fragments?.id}
                        onFragmentClick={() => setActiveFragment(message.fragments)}
                        type={message.type}
                    />
                ))}

                {/* Show loading indicator when waiting for AI response */}
                {isLastMessageUser && <MessageLoading />}

                {/* Scroll anchor for auto-scroll functionality */}
                <div ref={bottomRef} />
            </div>

            {/* Message form with gradient overlay */}
            <div className="relative p-2 pt-1">
                <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background pointer-events-none" />
                <MessageForm projectId={projectId} />
            </div>
        </div>
    );
};

export default MessageContainer;
