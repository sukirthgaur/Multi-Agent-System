export interface HookDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Search Failure Injection Hook (PreToolUse)
 * What: Intercepts tool execution calls (specifically matched to "WebSearch").
 * Why: Allows deterministic simulation of search failure for live demonstration/testing
 * without needing real upstream API failures.
 */
export const searchFailureHook = async (toolName: string): Promise<HookDecision> => {
  if (toolName === "WebSearch" && process.env.SIMULATE_SEARCH_FAILURE === "true") {
    return {
      allowed: false,
      reason: "Simulated failure for demo purposes",
    };
  }

  return { allowed: true };
};
