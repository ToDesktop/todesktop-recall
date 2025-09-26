/**
 * Recall Desktop SDK plugin state management and storage
 */

import type { PluginContext, RecallSdkConfig } from './shared';

let pluginContext: PluginContext | undefined;

class RecallSdkStore {
  private config: RecallSdkConfig = {
    enabled: true,
    apiUrl: 'https://us-east-1.recall.ai',
    requestPermissionsOnStartup: true,
  };

  private initialized = false;
  private sdkInitialized = false;

  /**
   * Initialize the plugin store
   */
  async initialize(): Promise<void> {
    // Load configuration from ToDesktop preferences
    try {
      // In a real implementation, this would load from ToDesktop's preference system
      // For now, we'll use the defaults
      this.initialized = true;
      console.log('RecallSdkStore: Initialized successfully');
    } catch (error) {
      console.error('RecallSdkStore: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Get current plugin configuration
   */
  getConfig(): RecallSdkConfig {
    return { ...this.config };
  }

  /**
   * Update plugin configuration
   */
  setConfig(updates: Partial<RecallSdkConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('RecallSdkStore: Configuration updated:', this.config);
  }

  /**
   * Load configuration from ToDesktop preferences
   */
  loadFromPreferences(preferences: Partial<RecallSdkConfig>): void {
    if (preferences.enabled !== undefined) {
      this.config.enabled = preferences.enabled;
    }
    if (preferences.apiUrl !== undefined) {
      this.config.apiUrl = preferences.apiUrl;
    }
    // autoRecord removed by design
    if (preferences.requestPermissionsOnStartup !== undefined) {
      this.config.requestPermissionsOnStartup = preferences.requestPermissionsOnStartup;
    }
    console.log('RecallSdkStore: Loaded configuration from preferences:', this.config);
  }

  /**
   * Check if plugin is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Set SDK initialization status
   */
  setSdkInitialized(initialized: boolean): void {
    this.sdkInitialized = initialized;
  }

  /**
   * Check if SDK is initialized
   */
  isSdkInitialized(): boolean {
    return this.sdkInitialized;
  }

  /**
   * Clear all state (useful for shutdown/reset)
   */
  clearState(): void {
    this.setSdkInitialized(false);
    console.log('RecallSdkStore: Cleared all state');
  }
}

export const recallSdkStore = new RecallSdkStore();

/**
 * Persist the ToDesktop plugin context and hydrate the store configuration.
 */
export const setPluginContext = (input: PluginContext): void => {
  pluginContext = input;

  const [enabledPref, apiUrlPref, requestPref] =
    input.plugin?.todesktop?.preferences ?? [];

  const preferences: Partial<RecallSdkConfig> = {
    enabled:
      typeof enabledPref?.spec?.value === 'boolean'
        ? enabledPref.spec.value
        : undefined,
    apiUrl:
      typeof apiUrlPref?.spec?.value === 'string' && apiUrlPref.spec.value.trim()
        ? apiUrlPref.spec.value
        : undefined,
    requestPermissionsOnStartup:
      typeof requestPref?.spec?.value === 'boolean'
        ? requestPref.spec.value
        : undefined,
  };

  recallSdkStore.loadFromPreferences(preferences);
};

/**
 * Accessor for the stored plugin context.
 */
export const getPluginContext = (): PluginContext => {
  if (!pluginContext) {
    throw new Error('Plugin context has not been set');
  }
  return pluginContext;
};
