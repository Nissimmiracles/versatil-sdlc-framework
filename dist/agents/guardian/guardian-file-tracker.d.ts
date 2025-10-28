/**
 * VERSATIL SDLC Framework - Guardian File Tracker
 * Tracks file edits for agent failure detection
 *
 * Called by post-file-edit.ts hook to monitor for:
 * - Agent activation failures
 * - Build failures after edits
 * - Test failures after edits
 */
export interface FileEditEvent {
    filePath: string;
    relativePath: string;
    toolName: string;
    workingDirectory: string;
    timestamp: string;
}
export interface FileEditTracking {
    filePath: string;
    timestamp: string;
    expected_agent?: string;
    activated: boolean;
    activation_timestamp?: string;
    activation_duration_ms?: number;
    activation_error?: string;
}
/**
 * Track file edit for Guardian monitoring
 */
export declare function trackFileEditForGuardian(event: FileEditEvent): Promise<void>;
/**
 * Mark agent as activated for a file
 */
export declare function markAgentActivated(filePath: string, agent: string, success: boolean, duration_ms: number, error?: string): Promise<void>;
/**
 * Check for agent activation failures (files edited but agents didn't activate)
 */
export declare function checkActivationFailures(): Promise<Array<{
    filePath: string;
    expected_agent: string;
    time_since_edit_ms: number;
}>>;
