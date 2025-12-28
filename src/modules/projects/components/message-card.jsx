/**
 * @fileoverview Message Card Component
 *
 * This component renders individual messages in the conversation view.
 * It handles both user messages (right-aligned) and assistant messages
 * (left-aligned with avatar and fragment cards).
 *
 * Features:
 * - Different layouts for user vs assistant messages
 * - Fragment card for viewing generated code
 * - Error styling for failed messages
 * - Timestamp display on hover
 * - Markdown rendering for AI responses
 *
 * @module modules/projects/components/message-card
 */

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MessageRole, MessageType } from '@prisma/client';
import { format } from 'date-fns';
import { ChevronRightIcon, Code2Icon } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { Response } from "@/components/ai-elements/response";

/**
 * FragmentCard Component
 *
 * Displays a clickable card for code fragments (generated code results).
 * Shows the fragment title and provides visual feedback for the active state.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.fragment - The fragment data (title, files, sandboxUrl)
 * @param {boolean} props.isActiveFragment - Whether this fragment is currently selected
 * @param {Function} props.onFragmentClick - Callback when fragment is clicked
 * @returns {JSX.Element} The rendered fragment card
 */
const FragmentCard = ({ fragment, isActiveFragment, onFragmentClick }) => {
    return (
        <button
            className={cn(
                "flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-2 hover:bg-secondary transition-colors",
                isActiveFragment && "bg-primary text-primary-foreground border-primary hover:bg-primary"
            )}
            onClick={() => onFragmentClick(fragment)}
        >
            {/* Code icon */}
            <Code2Icon className='size-4 mt-0.5' />

            {/* Fragment info */}
            <div className='flex flex-col flex-1'>
                <span className='text-sm font-medium line-clamp-1'>
                    {fragment.title}
                </span>
                <span className='text-sm'>Preview</span>
            </div>

            {/* Chevron indicator */}
            <div className='flex items-center justify-center mt-0.5'>
                <span className='text-sm'>
                    <ChevronRightIcon className='size-4' />
                </span>
            </div>
        </button>
    );
};

/**
 * UserMessage Component
 *
 * Renders a user's message in a right-aligned chat bubble style.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.content - The message content
 * @returns {JSX.Element} The rendered user message
 */
const UserMessage = ({ content }) => {
    return (
        <div className='flex justify-end pb-4 pr-2 pl-10'>
            <Card className={"rounded-lg bg-muted p-2 shadow-none border-none max-w-[80%] break-words"}>
                {content}
            </Card>
        </div>
    );
};

/**
 * AssistantMessage Component
 *
 * Renders an assistant's message with:
 * - Logo avatar
 * - Timestamp (visible on hover)
 * - Markdown-rendered content
 * - Fragment card (if available and not an error)
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.content - The message content (markdown supported)
 * @param {Object|null} props.fragment - Associated code fragment
 * @param {Date} props.createdAt - Message creation timestamp
 * @param {boolean} props.isActiveFragment - Whether the fragment is selected
 * @param {Function} props.onFragmentClick - Callback for fragment selection
 * @param {MessageType} props.type - Message type (RESULT or ERROR)
 * @returns {JSX.Element} The rendered assistant message
 */
const AssistantMessage = ({
    content,
    fragment,
    createdAt,
    isActiveFragment,
    onFragmentClick,
    type,
}) => {
    return (
        <div
            className={cn(
                "flex flex-col group px-2 pb-4",
                type === MessageType.ERROR && "text-red-700 dark:text-red-500"
            )}
        >
            {/* Header with avatar and timestamp */}
            <div className="flex items-center gap-2 pl-2 mb-2">
                {/* App logo as avatar */}
                <Image
                    alt="img"
                    src={"/logo.svg"}
                    height={30}
                    width={30}
                    className='invert-0 dark:invert'
                />
                {/* Timestamp - shows on hover */}
                <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {format(new Date(createdAt), "HH:mm 'on' MMM dd, yyyy")}
                </span>
            </div>

            {/* Message content and fragment */}
            <div className='pl-8.5 flex flex-col gap-y-4'>
                {/* Markdown-rendered response */}
                <Response>{content}</Response>

                {/* Fragment card - only shown for successful results */}
                {fragment && type === MessageType.RESULT && (
                    <FragmentCard
                        fragment={fragment}
                        isActiveFragment={isActiveFragment}
                        onFragmentClick={onFragmentClick}
                    />
                )}
            </div>
        </div>
    );
};

/**
 * MessageCard Component
 *
 * Main export that delegates to UserMessage or AssistantMessage
 * based on the message role.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.content - The message content
 * @param {MessageRole} props.role - USER or ASSISTANT
 * @param {Object|null} props.fragment - Associated code fragment
 * @param {Date} props.createdAt - Message creation timestamp
 * @param {boolean} props.isActiveFragment - Whether the fragment is selected
 * @param {Function} props.onFragmentClick - Callback for fragment selection
 * @param {MessageType} props.type - Message type (RESULT or ERROR)
 * @returns {JSX.Element} The rendered message card
 *
 * @example
 * <MessageCard
 *   content="Build a todo app"
 *   role={MessageRole.USER}
 *   fragment={null}
 *   createdAt={new Date()}
 *   isActiveFragment={false}
 *   onFragmentClick={() => {}}
 *   type={MessageType.RESULT}
 * />
 */
const MessageCard = ({
    content,
    role,
    fragment,
    createdAt,
    isActiveFragment,
    onFragmentClick,
    type,
}) => {
    // Render assistant message with full features
    if (role === MessageRole.ASSISTANT) {
        return (
            <AssistantMessage
                content={content}
                fragment={fragment}
                createdAt={createdAt}
                isActiveFragment={isActiveFragment}
                onFragmentClick={onFragmentClick}
                type={type}
            />
        );
    }

    // Render simple user message
    return (
        <div className='mt-5'>
            <UserMessage content={content} />
        </div>
    );
};

export default MessageCard;
