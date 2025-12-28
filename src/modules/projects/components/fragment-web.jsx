"use client";

/**
 * @fileoverview Fragment Web Component
 *
 * This component displays the preview iframe for a code fragment.
 * It includes controls for refreshing, copying the URL, opening in a new tab,
 * and restoring expired sandboxes.
 *
 * Features:
 * - Live preview iframe
 * - Refresh button
 * - Copy URL button
 * - Open in new tab button
 * - Restore button for expired sandboxes
 *
 * @module modules/projects/components/fragment-web
 */

import React, { useState, useTransition } from "react";
import { ExternalLink, RefreshCcw, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { restoreFragment } from "@/modules/messages/actions";
import { toast } from "sonner";

/**
 * FragmentWeb Component
 *
 * Displays an iframe preview of a code fragment's sandbox.
 * Provides controls for interacting with the preview.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.data - Fragment data
 * @param {string} props.data.id - Fragment ID
 * @param {string} props.data.sandboxUrl - Current sandbox URL
 * @param {Object} props.data.files - Files in the fragment
 * @returns {JSX.Element} The fragment preview
 */
const FragmentWeb = ({ data }) => {
    const [fragmentKey, setFragmentKey] = useState(0);
    const [copied, setCopied] = useState(false);
    const [currentUrl, setCurrentUrl] = useState(data.sandboxUrl);
    const [isPending, startTransition] = useTransition();

    /**
     * Refresh the iframe to reload the preview
     */
    const onRefresh = () => {
        setFragmentKey((prev) => prev + 1);
    };

    /**
     * Copy the sandbox URL to clipboard
     */
    const onCopy = () => {
        navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    /**
     * Restore the fragment to a new sandbox
     * Creates a new sandbox with the fragment's files
     */
    const onRestore = () => {
        if (!data.id) {
            toast.error("Cannot restore: no fragment ID");
            return;
        }

        startTransition(async () => {
            try {
                toast.info("Restoring sandbox...", { duration: 5000 });
                const result = await restoreFragment(data.id);

                if (result.success && result.sandboxUrl) {
                    setCurrentUrl(result.sandboxUrl);
                    setFragmentKey((prev) => prev + 1);
                    toast.success("Sandbox restored successfully!");
                } else {
                    toast.error("Failed to restore sandbox");
                }
            } catch (error) {
                toast.error(error.message || "Failed to restore sandbox");
            }
        });
    };

    return (
        <div className="flex flex-col w-full h-full">
            <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
                {/* Refresh button */}
                <Hint text={"Refresh"} side={"bottom"} align={"start"}>
                    <Button size={"sm"} variant={"outline"} onClick={onRefresh}>
                        <RefreshCcw />
                    </Button>
                </Hint>

                {/* Restore sandbox button */}
                <Hint
                    text={"Restore this version (creates new sandbox)"}
                    side="bottom"
                    align="start"
                >
                    <Button
                        size={"sm"}
                        variant={"outline"}
                        onClick={onRestore}
                        disabled={isPending || !data.id}
                        className="gap-1"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RotateCcw className="h-4 w-4" />
                        )}
                        {isPending ? "Restoring..." : "Restore"}
                    </Button>
                </Hint>

                {/* URL display and copy button */}
                <Hint
                    text={copied ? "Copied" : "Click to Copy"}
                    side="bottom"
                    align="start"
                >
                    <Button
                        size={"sm"}
                        variant={"outline"}
                        onClick={onCopy}
                        disabled={!currentUrl || copied}
                        className={"flex-1 justify-start text-start font-normal"}
                    >
                        <span className="truncate">{currentUrl}</span>
                    </Button>
                </Hint>

                {/* Open in new tab button */}
                <Hint text={"Open in New Tab"} side="bottom" align="start">
                    <Button
                        size={"sm"}
                        variant={"outline"}
                        onClick={() => {
                            if (!currentUrl) return;
                            window.open(currentUrl, "_blank");
                        }}
                    >
                        <ExternalLink />
                    </Button>
                </Hint>
            </div>

            {/* Preview iframe */}
            <iframe
                key={fragmentKey}
                className="h-full w-full"
                sandbox="allow-scripts allow-same-origin "
                loading="lazy"
                src={currentUrl}
            />
        </div>
    );
};

export default FragmentWeb;
