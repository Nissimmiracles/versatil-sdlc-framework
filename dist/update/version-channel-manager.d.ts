/**
 * VERSATIL SDLC Framework - Version Channel Manager
 * Manage update channels (stable, beta, alpha, custom)
 */
import { ReleaseInfo } from './github-release-checker.js';
export type UpdateChannel = 'stable' | 'beta' | 'alpha' | 'nightly' | 'custom';
export interface ChannelConfig {
    name: UpdateChannel | string;
    description: string;
    includePrereleases: boolean;
    customUrl?: string;
    updateFrequency?: number;
}
export interface ChannelInfo {
    current: UpdateChannel | string;
    available: ChannelConfig[];
    lastCheck?: string;
    subscribedChannels: string[];
}
export declare class VersionChannelManager {
    private releaseChecker;
    private versatilHome;
    private configFile;
    private currentChannel;
    private readonly channels;
    constructor();
    /**
     * Initialize channel manager and load saved channel
     */
    initialize(): Promise<void>;
    /**
     * Get current channel
     */
    getCurrentChannel(): UpdateChannel | string;
    /**
     * Switch to different channel
     */
    switchChannel(channel: UpdateChannel | string): Promise<void>;
    /**
     * Get available channels
     */
    getAvailableChannels(): ChannelConfig[];
    /**
     * Get channel configuration
     */
    getChannelConfig(channel: UpdateChannel | string): ChannelConfig | undefined;
    /**
     * Get channel information
     */
    getChannelInfo(): Promise<ChannelInfo>;
    /**
     * Get versions available for current channel
     */
    getVersionsForChannel(channel?: UpdateChannel | string): Promise<string[]>;
    /**
     * Get latest version for current channel
     */
    getLatestVersionForChannel(channel?: UpdateChannel | string): Promise<ReleaseInfo | null>;
    /**
     * Add custom channel
     */
    addCustomChannel(name: string, url: string, description?: string): Promise<void>;
    /**
     * Remove custom channel
     */
    removeCustomChannel(name: string): Promise<void>;
    /**
     * Check if channel is custom
     */
    isCustomChannel(channel: string): boolean;
    /**
     * Get update frequency for current channel
     */
    getUpdateFrequency(channel?: UpdateChannel | string): number;
    /**
     * Save channel configuration
     */
    private saveChannelConfig;
    /**
     * Get last check time
     */
    private getLastCheckTime;
    /**
     * Subscribe to channel notifications
     */
    subscribeToChannel(channel: UpdateChannel | string): Promise<void>;
    /**
     * Unsubscribe from channel
     */
    unsubscribeFromChannel(channel: UpdateChannel | string): Promise<void>;
}
/**
 * Default channel manager instance
 */
export declare const defaultChannelManager: VersionChannelManager;
