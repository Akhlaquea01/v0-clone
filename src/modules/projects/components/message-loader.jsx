/**
 * @fileoverview Message Loading Component
 *
 * This component displays a loading indicator while waiting for AI response.
 * It shows time-based progressive status messages that correspond to actual
 * workflow stages, providing meaningful feedback to users.
 *
 * Stages:
 * 1. Connecting to sandbox (0-5s)
 * 2. Loading context (5-10s)
 * 3. Analyzing request (10-20s)
 * 4. Generating code (20-40s)
 * 5. Finalizing (40-60s)
 * 6. Extended wait message (60s+)
 *
 * @module modules/projects/components/message-loader
 */

import Image from "next/image";
import React from "react";
import { useState, useEffect } from "react";

/**
 * Workflow stages with their corresponding time ranges and messages
 * These roughly map to actual Inngest workflow steps
 */
const WORKFLOW_STAGES = [
    { minTime: 0, maxTime: 5, message: "Connecting to sandbox...", icon: "🔌" },
    { minTime: 5, maxTime: 10, message: "Loading project context...", icon: "📂" },
    { minTime: 10, maxTime: 20, message: "Analyzing your request...", icon: "🔍" },
    { minTime: 20, maxTime: 40, message: "Generating code...", icon: "⚡" },
    { minTime: 40, maxTime: 60, message: "Building and testing...", icon: "🔨" },
    { minTime: 60, maxTime: 90, message: "Finalizing response...", icon: "✨" },
    { minTime: 90, maxTime: Infinity, message: "Still working on it...", icon: "⏳" },
];

/**
 * ProgressIndicator Component
 *
 * Shows the current elapsed time and a visual progress bar
 *
 * @param {Object} props
 * @param {number} props.elapsedSeconds - Seconds since loading started
 */
const ProgressIndicator = ({ elapsedSeconds }) => {
    // Progress fills up to 90 seconds (100%)
    const progress = Math.min((elapsedSeconds / 90) * 100, 95);

    return (
        <div className="w-full max-w-xs">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

/**
 * ShimmerMessages Component
 *
 * Displays time-based workflow status messages.
 * Messages progress through actual workflow stages based on elapsed time.
 */
const ShimmerMessages = () => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setElapsedSeconds(elapsed);

            // Show warning if taking too long (over 2 minutes)
            if (elapsed > 120 && !showWarning) {
                setShowWarning(true);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [showWarning]);

    // Find the current stage based on elapsed time
    const currentStage = WORKFLOW_STAGES.find(
        stage => elapsedSeconds >= stage.minTime && elapsedSeconds < stage.maxTime
    ) || WORKFLOW_STAGES[WORKFLOW_STAGES.length - 1];

    return (
        <div className="flex flex-col gap-2">
            {/* Main status message */}
            <div className="flex items-center gap-2">
                <span className="text-lg">{currentStage.icon}</span>
                <span className="text-base text-muted-foreground animate-pulse">
                    {currentStage.message}
                </span>
            </div>

            {/* Progress bar */}
            <ProgressIndicator elapsedSeconds={elapsedSeconds} />

            {/* Elapsed time indicator */}
            <span className="text-xs text-muted-foreground/60">
                {elapsedSeconds}s elapsed
            </span>

            {/* Warning message for extended wait times */}
            {showWarning && (
                <div className="mt-2 text-sm text-amber-500/80 bg-amber-500/10 px-3 py-2 rounded-md">
                    ⚠️ This is taking longer than expected.
                    The AI might be processing a complex request or there could be a temporary issue.
                </div>
            )}
        </div>
    );
};

/**
 * MessageLoading Component
 *
 * Main loading component that displays the AI avatar and status messages
 * while waiting for a response.
 *
 * @component
 * @returns {JSX.Element} The loading indicator UI
 */
const MessageLoading = () => {
    return (
        <div className="flex flex-col group px-2 pb-4">
            <div className="flex items-center gap-2 pl-2 mb-2">
                <Image
                    src={"/logo.svg"}
                    alt="Vibe"
                    width={28}
                    height={28}
                    className="shrink-0 invert-0 dark:invert"
                />
            </div>

            <div className="pl-8.5 flex flex-col gap-y-4">
                <ShimmerMessages />
            </div>
        </div>
    );
};

export default MessageLoading;
