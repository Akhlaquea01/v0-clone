/**
 * @fileoverview Usage Display Component
 *
 * This component displays the user's current credit/usage status.
 * It shows remaining credits, time until reset, and an upgrade button
 * for users who don't have a pro subscription.
 *
 * The component appears above the message input form in the project view
 * to keep users informed of their remaining credits.
 *
 * @module modules/usage/components/usage
 */

import Link from "next/link";
import { CrownIcon } from "lucide-react";
import { formatDuration, intervalToDuration } from "date-fns";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useStatus } from "../hooks/usage";
import { useAuth } from "@clerk/nextjs";

/**
 * Usage Component
 *
 * Displays the user's credit status including:
 * - Number of remaining credits
 * - Time until credits reset (formatted as duration)
 * - Upgrade button for non-pro users
 *
 * Shows loading state while fetching data and error state if fetch fails.
 *
 * @component
 * @returns {JSX.Element} The rendered usage display
 *
 * @example
 * // Used in MessageForm component
 * {showUsage && <Usage />}
 */
export const Usage = () => {
    // =========================================================================
    // STATE & HOOKS
    // =========================================================================

    /**
     * Fetch user's current usage status
     * Includes remaining points, reset time, and consumption data
     */
    const { data, isPending, error } = useStatus();

    /**
     * Auth hook to check user's subscription status
     */
    const { has } = useAuth();

    /**
     * Check if user has pro plan access
     * Pro users don't see the upgrade button
     */
    const hasProAccess = has?.({ plan: "pro" });

    // =========================================================================
    // LOADING STATE
    // =========================================================================

    if (isPending) {
        return (
            <div className="rounded-t-xl bg-background border border-b-0 p-2.5">
                <Spinner className={"text-emerald-400"} />
            </div>
        );
    }

    // =========================================================================
    // ERROR STATE
    // =========================================================================

    if (error) {
        return (
            <div className="rounded-t-xl bg-background border border-b-0 p-2.5">
                <p className="text-sm text-destructive">Error loading usage</p>
            </div>
        );
    }

    // =========================================================================
    // DATA EXTRACTION
    // =========================================================================

    // Extract usage data with fallback defaults
    const points = data?.remainingPoints ?? 0;
    const msBeforeNext = data?.msBeforeNext ?? 0;

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <div className="rounded-t-xl bg-background border border-b-0 p-2.5">
            <div className="flex items-center gap-x-2">
                {/* Credits information */}
                <div>
                    {/* Remaining credits count */}
                    <p className="text-sm">{points} credits remaining</p>

                    {/* Time until reset, formatted as human-readable duration */}
                    <p className="text-xs text-muted-foreground">
                        Resets in{" "}
                        {formatDuration(
                            intervalToDuration({
                                start: new Date(),
                                end: new Date(Date.now() + msBeforeNext),
                            }),
                            { format: ["months", "days", "hours"] }
                        )}
                    </p>
                </div>

                {/*
                  Upgrade button for non-pro users
                  Links to pricing page where they can subscribe
                */}
                {!hasProAccess && (
                    <Button asChild size={"sm"} variant={"default"} className={"ml-auto"}>
                        <Link href={"/pricing"}>
                            <CrownIcon />
                            Upgrade
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
};
