export declare function startLiveTranscript(agentName: string, orgAlias: string): string;
export declare function logScenarioStart(name: string): void;
export declare function logUserMessage(message: string): void;
export declare function logAgentResponse(response: string): void;
export declare function logScenarioResult(result: 'pass' | 'fail' | 'error', note: string): void;
export declare function logError(error: string): void;
export declare function endLiveTranscript(summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
}): void;
export declare function getLiveTranscriptPath(): string | null;
//# sourceMappingURL=live-transcript.d.ts.map