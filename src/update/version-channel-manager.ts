/**
 * VERSATIL SDLC Framework - Version Channel Manager
 * Manage update channels (stable, beta, alpha, custom)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { GitHubReleaseChecker, ReleaseInfo } from './github-release-checker';

export type UpdateChannel = 'stable' | 'beta' | 'alpha' | 'nightly' | 'custom';

export interface ChannelConfig {
  name: UpdateChannel | string;
  description: string;
  includePrereleases: boolean;
  customUrl?: string;
  updateFrequency?: number; // milliseconds
}

export interface ChannelInfo {
  current: UpdateChannel | string;
  available: ChannelConfig[];
  lastCheck?: string;
  subscribedChannels: string[];
}

export class VersionChannelManager {
  private releaseChecker: GitHubReleaseChecker;
  private versatilHome: string;
  private configFile: string;
  private currentChannel: UpdateChannel | string;

  // Predefined channels
  private readonly channels: Map<string, ChannelConfig> = new Map([
    ['stable', {
      name: 'stable',
      description: 'Production-ready releases only (recommended)',
      includePrereleases: false,
      updateFrequency: 24 * 60 * 60 * 1000 // 24 hours
    }],
    ['beta', {
      name: 'beta',
      description: 'Early access to new features (some bugs expected)',
      includePrereleases: true,
      updateFrequency: 12 * 60 * 60 * 1000 // 12 hours
    }],
    ['alpha', {
      name: 'alpha',
      description: 'Bleeding edge, help us test (unstable)',
      includePrereleases: true,
      updateFrequency: 6 * 60 * 60 * 1000 // 6 hours
    }],
    ['nightly', {
      name: 'nightly',
      description: 'Daily development builds (very unstable)',
      includePrereleases: true,
      updateFrequency: 60 * 60 * 1000 // 1 hour
    }]
  ]);

  constructor() {
    this.releaseChecker = new GitHubReleaseChecker();
    this.versatilHome = path.join(os.homedir(), '.versatil');
    this.configFile = path.join(this.versatilHome, 'channel-config.json');
    this.currentChannel = 'stable'; // default
  }

  /**
   * Initialize channel manager and load saved channel
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.versatilHome, { recursive: true });

    try {
      const config = await fs.readFile(this.configFile, 'utf-8');
      const data = JSON.parse(config);
      this.currentChannel = data.currentChannel || 'stable';
    } catch {
      // No saved channel, use default
      await this.saveChannelConfig();
    }
  }

  /**
   * Get current channel
   */
  getCurrentChannel(): UpdateChannel | string {
    return this.currentChannel;
  }

  /**
   * Switch to different channel
   */
  async switchChannel(channel: UpdateChannel | string): Promise<void> {
    if (!this.channels.has(channel) && !channel.startsWith('custom:')) {
      throw new Error(`Unknown channel: ${channel}. Available: ${Array.from(this.channels.keys()).join(', ')}`);
    }

    this.currentChannel = channel;
    await this.saveChannelConfig();

    console.log(`✅ Switched to ${channel} channel`);

    if (channel === 'beta' || channel === 'alpha') {
      console.log(`⚠️  Warning: ${channel} channel may contain unstable features`);
    }
  }

  /**
   * Get available channels
   */
  getAvailableChannels(): ChannelConfig[] {
    return Array.from(this.channels.values());
  }

  /**
   * Get channel configuration
   */
  getChannelConfig(channel: UpdateChannel | string): ChannelConfig | undefined {
    return this.channels.get(channel);
  }

  /**
   * Get channel information
   */
  async getChannelInfo(): Promise<ChannelInfo> {
    await this.initialize();

    return {
      current: this.currentChannel,
      available: this.getAvailableChannels(),
      lastCheck: await this.getLastCheckTime(),
      subscribedChannels: [this.currentChannel]
    };
  }

  /**
   * Get versions available for current channel
   */
  async getVersionsForChannel(channel?: UpdateChannel | string): Promise<string[]> {
    const targetChannel = channel || this.currentChannel;
    const channelConfig = this.channels.get(targetChannel);

    if (!channelConfig) {
      throw new Error(`Unknown channel: ${targetChannel}`);
    }

    try {
      const releases = await this.releaseChecker.getAllReleases(20);

      // Filter based on channel
      const filtered = releases.filter(release => {
        if (targetChannel === 'stable') {
          return !release.prerelease && !release.draft;
        } else if (targetChannel === 'beta') {
          return !release.draft && (release.prerelease && release.tagName.includes('beta') || !release.prerelease);
        } else if (targetChannel === 'alpha') {
          return !release.draft && (release.prerelease && release.tagName.includes('alpha') || !release.prerelease);
        } else if (targetChannel === 'nightly') {
          return !release.draft; // All releases including prereleases
        }
        return false;
      });

      return filtered.map(r => r.version);

    } catch (error) {
      console.warn(`Failed to fetch versions for ${targetChannel}:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Get latest version for current channel
   */
  async getLatestVersionForChannel(channel?: UpdateChannel | string): Promise<ReleaseInfo | null> {
    const targetChannel = channel || this.currentChannel;
    const channelConfig = this.channels.get(targetChannel);

    if (!channelConfig) {
      throw new Error(`Unknown channel: ${targetChannel}`);
    }

    try {
      return await this.releaseChecker.getLatestRelease(channelConfig.includePrereleases);
    } catch (error) {
      console.warn(`Failed to fetch latest for ${targetChannel}:`, (error as Error).message);
      return null;
    }
  }

  /**
   * Add custom channel
   */
  async addCustomChannel(name: string, url: string, description?: string): Promise<void> {
    const customName = `custom:${name}`;

    this.channels.set(customName, {
      name: customName,
      description: description || `Custom channel: ${name}`,
      includePrereleases: true,
      customUrl: url,
      updateFrequency: 24 * 60 * 60 * 1000
    });

    console.log(`✅ Added custom channel: ${name}`);
    console.log(`   URL: ${url}`);
  }

  /**
   * Remove custom channel
   */
  async removeCustomChannel(name: string): Promise<void> {
    const customName = `custom:${name}`;

    if (this.channels.has(customName)) {
      this.channels.delete(customName);
      console.log(`✅ Removed custom channel: ${name}`);

      // If currently on this channel, switch to stable
      if (this.currentChannel === customName) {
        await this.switchChannel('stable');
      }
    } else {
      throw new Error(`Custom channel not found: ${name}`);
    }
  }

  /**
   * Check if channel is custom
   */
  isCustomChannel(channel: string): boolean {
    return channel.startsWith('custom:');
  }

  /**
   * Get update frequency for current channel
   */
  getUpdateFrequency(channel?: UpdateChannel | string): number {
    const targetChannel = channel || this.currentChannel;
    const channelConfig = this.channels.get(targetChannel);
    return channelConfig?.updateFrequency || 24 * 60 * 60 * 1000; // Default 24h
  }

  /**
   * Save channel configuration
   */
  private async saveChannelConfig(): Promise<void> {
    const config = {
      currentChannel: this.currentChannel,
      lastUpdated: new Date().toISOString(),
      customChannels: Array.from(this.channels.entries())
        .filter(([name]) => this.isCustomChannel(name))
        .map(([_, config]) => config)
    };

    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
  }

  /**
   * Get last check time
   */
  private async getLastCheckTime(): Promise<string | undefined> {
    try {
      const config = await fs.readFile(this.configFile, 'utf-8');
      const data = JSON.parse(config);
      return data.lastUpdated;
    } catch {
      return undefined;
    }
  }

  /**
   * Subscribe to channel notifications
   */
  async subscribeToChannel(channel: UpdateChannel | string): Promise<void> {
    // Future: Implement notification subscription
    console.log(`✅ Subscribed to ${channel} channel updates`);
  }

  /**
   * Unsubscribe from channel
   */
  async unsubscribeFromChannel(channel: UpdateChannel | string): Promise<void> {
    // Future: Implement notification unsubscription
    console.log(`✅ Unsubscribed from ${channel} channel updates`);
  }
}

/**
 * Default channel manager instance
 */
export const defaultChannelManager = new VersionChannelManager();
