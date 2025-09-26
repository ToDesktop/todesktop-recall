/**
 * Shared types and constants for Recall Desktop SDK integration
 */

// IPC channel names - use unique namespace to avoid conflicts
export const IPC_CHANNELS = {
  // SDK lifecycle
  INIT_SDK: "recall-desktop:init-sdk",
  SHUTDOWN_SDK: "recall-desktop:shutdown-sdk",
  GET_STATUS: "recall-desktop:get-status",

  // Recording management
  START_RECORDING: "recall-desktop:start-recording",
  STOP_RECORDING: "recall-desktop:stop-recording",
  PAUSE_RECORDING: "recall-desktop:pause-recording",
  RESUME_RECORDING: "recall-desktop:resume-recording",
  UPLOAD_RECORDING: "recall-desktop:upload-recording",

  // Desktop audio recording
  PREPARE_DESKTOP_AUDIO: "recall-desktop:prepare-desktop-audio",

  // Permission management
  REQUEST_PERMISSION: "recall-desktop:request-permission",

  // Configuration
  SET_CONFIG: "recall-desktop:set-config",
  GET_CONFIG: "recall-desktop:get-config",

  // Event subscription
  SUBSCRIBE_EVENTS: "recall-desktop:subscribe-events",
  UNSUBSCRIBE_EVENTS: "recall-desktop:unsubscribe-events",
} as const;

// Recall SDK Configuration (mirrors RecallAiSdkConfig where applicable)
export interface RecallSdkConfig {
  enabled: boolean;
  apiUrl: string;
  requestPermissionsOnStartup: boolean;
}

// ToDesktop plugin context (subset relevant to this plugin)
export interface PluginContext {
  plugin: {
    todesktop: {
      preferences: [
        {
          id: "enabled";
          name: string;
          description: string;
          type: "checkbox";
          spec: { value?: boolean };
        },
        {
          id: "apiUrl";
          name: string;
          description: string;
          type: "text";
          spec: { value?: string };
        },
        {
          id: "requestPermissionsOnStartup";
          name: string;
          description: string;
          type: "checkbox";
          spec: { value?: boolean };
        }
      ];
    };
  };
}

// Meeting window information from SDK
export interface MeetingWindow {
  id: string;
  title?: string;
  url?: string;
  platform: string;
}

// Recording request/response types
export interface StartRecordingRequest {
  windowId: string;
  uploadToken: string;
}

export interface StopRecordingRequest {
  windowId: string;
}

export interface PauseRecordingRequest {
  windowId: string;
}

export interface ResumeRecordingRequest {
  windowId: string;
}

export interface UploadRecordingRequest {
  windowId: string;
}

// SDK Events from Recall SDK (mirror upstream)
export type RecallSdkEventType =
  | "recording-started"
  | "recording-ended"
  | "upload-progress"
  | "meeting-detected"
  | "meeting-updated"
  | "meeting-closed"
  | "sdk-state-change"
  | "error"
  | "media-capture-status"
  | "participant-capture-status"
  | "permissions-granted"
  | "permission-status"
  | "realtime-event"
  | "shutdown";

export interface RecallSdkEvent {
  type: RecallSdkEventType;
  data: any;
}

// SDK Event payloads
export interface MeetingDetectedEvent {
  window: MeetingWindow;
}

export interface SdkStateChangeEvent {
  sdk: {
    state: {
      code: "recording" | "idle" | "paused";
    };
  };
}

export interface RecordingStartedEvent {
  window: MeetingWindow;
}

export interface RecordingEndedEvent {
  window: MeetingWindow;
}

export interface MeetingClosedEvent {
  window: MeetingWindow;
}

export interface UploadProgressEvent {
  window: { id: string };
  progress: number; // 0-100
}

export interface MeetingUpdatedEvent {
  window: MeetingWindow;
}

export interface MediaCaptureStatusEvent {
  window: MeetingWindow;
  type: "video" | "audio";
  capturing: boolean;
}

export interface ParticipantCaptureStatusEvent {
  window: MeetingWindow;
  type: "video" | "audio" | "screenshare";
  capturing: boolean;
}

export interface RealtimeEvent {
  window: MeetingWindow;
  event: string;
  data: any;
}

export interface SdkErrorEvent {
  window?: MeetingWindow;
  type: string;
  message: string;
}

export interface PermissionStatusEvent {
  permission: PermissionType;
  status: string;
}

export interface ShutdownEvent {
  code: number;
  signal: string;
}

// Permission types (mirror upstream)
export type PermissionType =
  | "accessibility"
  | "screen-capture"
  | "microphone"
  | "system-audio";

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Plugin status
export interface PluginStatus {
  initialized: boolean;
  sdkInitialized: boolean;
  version: string;
  config: RecallSdkConfig;
  sdkState?: "recording" | "idle" | "paused";
  permissions?: {
    accessibility: boolean;
    screenCapture: boolean;
    microphone: boolean;
    systemAudio: boolean;
  };
}

// Error types
export class RecallSdkError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "RecallSdkError";
  }
}

// SDK Initialization options
export interface SdkInitOptions {
  apiUrl: string;
  acquirePermissionsOnStartup?: PermissionType[];
  restartOnError?: boolean;
}

// Desktop audio recording response
export interface PrepareDesktopAudioResponse {
  windowId: string;
}
