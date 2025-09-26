/**
 * ToDesktop Recall Desktop SDK Plugin - Client Library
 * 
 * This library provides a clean API for web applications to interact
 * with the ToDesktop Recall Desktop SDK plugin through the exposed window APIs.
 */

// Import generated types from the plugin preload script
import type { RecallDesktopApi } from './generated/preload';
import type {
  EventTypeToPayloadMap,
  Permission as RecallPermission,
  RecallAiSdkWindow,
} from './generated/recallai-desktop-sdk';

// Extend window interface for ToDesktop runtime
declare global {
  interface Window {
    todesktop?: { recallDesktop?: RecallDesktopApi };
  }
}

export type MeetingWindow = RecallAiSdkWindow;

/**
 * Plugin configuration options
 */
export interface RecallSdkConfig {
  enabled: boolean;
  apiUrl: string;
  requestPermissionsOnStartup: boolean;
}

/**
 * Plugin status information
 */
export interface PluginStatus {
  initialized: boolean;
  sdkInitialized: boolean;
  version: string;
  config: RecallSdkConfig;
  sdkState?: 'recording' | 'idle' | 'paused';
  permissions?: {
    accessibility: boolean;
    screenCapture: boolean;
    microphone: boolean;
    systemAudio: boolean;
  };
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export type PermissionType = RecallPermission;

export type RecallSdkEventType = keyof EventTypeToPayloadMap;

export type RecallSdkEventPayload<T extends RecallSdkEventType> = EventTypeToPayloadMap[T];

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * Recall Desktop SDK Client API
 * Provides a safe wrapper around the window.todesktop.recallDesktop API
 */
export class RecallDesktopClient {
  private api: RecallDesktopApi | null = null;
  private eventUnsubscribers = new Map<string, () => void>();

  constructor() {
    // Check if running in ToDesktop environment
    if (
      typeof window !== 'undefined' &&
      (window as any).todesktop &&
      (window as any).todesktop.recallDesktop
    ) {
      this.api = (window as any).todesktop.recallDesktop as RecallDesktopApi;
    }
  }

  /**
   * Check if the plugin is available
   * @returns true if plugin is available, false otherwise
   */
  isAvailable(): boolean {
    return this.api !== null;
  }

  /**
   * Initialize the Recall SDK
   * @returns Promise resolving to initialization result
   * @throws Error if plugin is not available
   */
  async initSdk(): Promise<ApiResponse> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.initSdk();
  }

  /**
   * Shutdown the Recall SDK
   * @returns Promise resolving to shutdown result
   * @throws Error if plugin is not available
   */
  async shutdownSdk(): Promise<ApiResponse> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    
    // Clean up event listeners
    this.removeAllEventListeners();
    
    return this.api.shutdownSdk();
  }

  /**
   * Get current plugin and SDK status
   * @returns Promise resolving to plugin status
   * @throws Error if plugin is not available
   */
  async getStatus(): Promise<PluginStatus> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.getStatus();
  }

  /**
   * Start recording a meeting
   * @param windowId The meeting window ID
   * @param uploadToken Upload token from your backend
   * @returns Promise resolving to recording start result
   * @throws Error if plugin is not available
   */
  async startRecording(windowId: string, uploadToken: string): Promise<ApiResponse> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.startRecording(windowId, uploadToken);
  }

  /**
   * Stop recording a meeting
   * @param windowId The meeting window ID
   * @returns Promise resolving to recording stop result
   * @throws Error if plugin is not available
   */
  async stopRecording(windowId: string): Promise<ApiResponse> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.stopRecording(windowId);
  }

  /**
   * Pause recording a meeting
   * @param windowId The meeting window ID
   * @returns Promise resolving to recording pause result
   * @throws Error if plugin is not available
   */
  async pauseRecording(windowId: string): Promise<ApiResponse> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.pauseRecording(windowId);
  }

  /**
   * Resume recording a meeting
   * @param windowId The meeting window ID
   * @returns Promise resolving to recording resume result
   * @throws Error if plugin is not available
   */
  async resumeRecording(windowId: string): Promise<ApiResponse> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.resumeRecording(windowId);
  }

  /**
   * Upload a completed recording
   * @param windowId The meeting window ID
   * @returns Promise resolving to upload start result
   * @throws Error if plugin is not available
   */
  async uploadRecording(windowId: string): Promise<ApiResponse> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.uploadRecording(windowId);
  }

  /**
   * Prepare desktop audio recording for non-meeting audio capture
   * @returns Promise resolving to desktop audio preparation result with windowId
   * @throws Error if plugin is not available
   */
  async prepareDesktopAudioRecording(): Promise<ApiResponse<{ windowId: string }>> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.prepareDesktopAudioRecording();
  }

  /**
   * Request a specific permission from the user
   * @param permission The permission to request
   * @returns Promise resolving to permission request result
   * @throws Error if plugin is not available
   */
  async requestPermission(permission: PermissionType): Promise<ApiResponse> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.requestPermission(permission);
  }

  /**
   * Update plugin configuration
   * @param config Configuration updates
   * @returns Promise resolving to update result
   * @throws Error if plugin is not available
   */
  async setConfig(config: Partial<RecallSdkConfig>): Promise<ApiResponse> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.setConfig(config);
  }

  /**
   * Get current plugin configuration
   * @returns Promise resolving to current configuration
   * @throws Error if plugin is not available
   */
  async getConfig(): Promise<ApiResponse<RecallSdkConfig>> {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.getConfig();
  }

  /**
   * Subscribe to SDK events
   * @param eventType The type of event to listen for
   * @param callback Function to call when event occurs
   * @returns Function to unsubscribe from the event
   * @throws Error if plugin is not available
   */
  addEventListener<K extends RecallSdkEventType>(
    eventType: K,
    callback: EventHandler<RecallSdkEventPayload<K>>
  ): () => void {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }

    const unsubscribe = this.api.addEventListener(eventType, callback as (data: any) => void);
    const key = `${eventType}-${Date.now()}-${Math.random()}`;
    this.eventUnsubscribers.set(key, unsubscribe);

    // Return enhanced unsubscribe function that also cleans up our tracking
    return () => {
      unsubscribe();
      this.eventUnsubscribers.delete(key);
    };
  }

  /**
   * Remove all event listeners managed by this client instance
   */
  removeAllEventListeners(): void {
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers.clear();
  }

  /**
   * Get plugin version
   * @returns Plugin version string
   * @throws Error if plugin is not available
   */
  getVersion(): string {
    if (!this.api) {
      throw new Error('Recall Desktop SDK plugin is not available. Make sure you are running in ToDesktop.');
    }
    return this.api.getVersion();
  }

}

// Create and export a default instance
export const recallDesktop = new RecallDesktopClient();

// Export the client class for custom instantiation
export default RecallDesktopClient;

// Re-export types for convenience
export type { RecallDesktopApi } from './generated/preload';
export type {
  EventTypeToPayloadMap,
  MeetingDetectedEvent,
  MeetingUpdatedEvent,
  MeetingClosedEvent,
  RecordingStartEvent,
  RecordingStopEvent,
  UploadProgressEvent,
  SdkStateChangeEvent,
  MediaCaptureStatusEvent,
  ParticipantCaptureStatusEvent,
  PermissionsGrantedEvent,
  PermissionStatusEvent,
  ErrorEvent as SdkErrorEvent,
  RealtimeEvent,
  ShutdownEvent,
} from './generated/recallai-desktop-sdk';
