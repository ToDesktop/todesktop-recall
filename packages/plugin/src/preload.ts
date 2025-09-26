/**
 * ToDesktop Recall Desktop SDK Plugin - Preload Script
 * 
 * This file runs in the renderer process with Node.js access.
 *
 * ToDesktop plugins should export functions; the ToDesktop runtime will
 * attach them under `window.todesktop.recallDesktop` automatically.
*/

import { ipcRenderer } from 'electron';
import { 
  IPC_CHANNELS, 
  ApiResponse, 
  PluginStatus, 
  StartRecordingRequest,
  StopRecordingRequest,
  PauseRecordingRequest,
  ResumeRecordingRequest,
  UploadRecordingRequest,
  PermissionType,
  RecallSdkConfig,
  PrepareDesktopAudioResponse,
  RecallSdkEventType
} from './shared';

/**
 * Initialize the Recall SDK
 * @returns Promise resolving to initialization result
 */
export async function initSdk(): Promise<ApiResponse> {
  return ipcRenderer.invoke(IPC_CHANNELS.INIT_SDK);
}

/**
 * Shutdown the Recall SDK
 * @returns Promise resolving to shutdown result
 */
export async function shutdownSdk(): Promise<ApiResponse> {
  return ipcRenderer.invoke(IPC_CHANNELS.SHUTDOWN_SDK);
}

/**
 * Get current plugin and SDK status
 * @returns Promise resolving to plugin status
 */
export async function getStatus(): Promise<PluginStatus> {
  return ipcRenderer.invoke(IPC_CHANNELS.GET_STATUS);
}

/**
 * Start recording a meeting
 * @param windowId The meeting window ID
 * @param uploadToken Upload token from your backend
 * @returns Promise resolving to recording start result
 */
export async function startRecording(windowId: string, uploadToken: string): Promise<ApiResponse> {
  const request: StartRecordingRequest = { windowId, uploadToken };
  return ipcRenderer.invoke(IPC_CHANNELS.START_RECORDING, request);
}

/**
 * Stop recording a meeting
 * @param windowId The meeting window ID
 * @returns Promise resolving to recording stop result
 */
export async function stopRecording(windowId: string): Promise<ApiResponse> {
  const request: StopRecordingRequest = { windowId };
  return ipcRenderer.invoke(IPC_CHANNELS.STOP_RECORDING, request);
}

/**
 * Pause recording a meeting
 * @param windowId The meeting window ID
 * @returns Promise resolving to recording pause result
 */
export async function pauseRecording(windowId: string): Promise<ApiResponse> {
  const request: PauseRecordingRequest = { windowId };
  return ipcRenderer.invoke(IPC_CHANNELS.PAUSE_RECORDING, request);
}

/**
 * Resume recording a meeting
 * @param windowId The meeting window ID
 * @returns Promise resolving to recording resume result
 */
export async function resumeRecording(windowId: string): Promise<ApiResponse> {
  const request: ResumeRecordingRequest = { windowId };
  return ipcRenderer.invoke(IPC_CHANNELS.RESUME_RECORDING, request);
}

/**
 * Upload a completed recording
 * @param windowId The meeting window ID
 * @returns Promise resolving to upload start result
 */
export async function uploadRecording(windowId: string): Promise<ApiResponse> {
  const request: UploadRecordingRequest = { windowId };
  return ipcRenderer.invoke(IPC_CHANNELS.UPLOAD_RECORDING, request);
}

/**
 * Prepare desktop audio recording for non-meeting audio capture
 * @returns Promise resolving to desktop audio preparation result
 */
export async function prepareDesktopAudioRecording(): Promise<ApiResponse<PrepareDesktopAudioResponse>> {
  return ipcRenderer.invoke(IPC_CHANNELS.PREPARE_DESKTOP_AUDIO);
}

/**
 * Request a specific permission from the user
 * @param permission The permission to request
 * @returns Promise resolving to permission request result
 */
export async function requestPermission(permission: PermissionType): Promise<ApiResponse> {
  return ipcRenderer.invoke(IPC_CHANNELS.REQUEST_PERMISSION, permission);
}

/**
 * Update plugin configuration
 * @param config Configuration updates
 * @returns Promise resolving to update result
 */
export async function setConfig(config: Partial<RecallSdkConfig>): Promise<ApiResponse> {
  return ipcRenderer.invoke(IPC_CHANNELS.SET_CONFIG, config);
}

/**
 * Get current plugin configuration
 * @returns Promise resolving to current configuration
 */
export async function getConfig(): Promise<ApiResponse<RecallSdkConfig>> {
  return ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG);
}

/**
 * Subscribe to SDK events
 * @param eventType The type of event to listen for
 * @param callback Function to call when event occurs
 * @returns Function to unsubscribe from the event
 */
export function addEventListener(eventType: RecallSdkEventType, callback: (data: any) => void): () => void {
  const channel = `recall-desktop:event:${eventType}`;

  // Fire-and-forget subscribe to main
  ipcRenderer.invoke(IPC_CHANNELS.SUBSCRIBE_EVENTS, eventType).catch(console.error);

  const listener = (_event: any, data: any) => {
    callback(data);
  };
  ipcRenderer.on(channel, listener);

  // Return unsubscribe function
  return () => {
    ipcRenderer.removeListener(channel, listener);
    ipcRenderer.invoke(IPC_CHANNELS.UNSUBSCRIBE_EVENTS, eventType).catch(console.error);
  };
}

/**
 * Get plugin version
 * @returns Plugin version string
 */
export function getVersion(): string {
  return '1.0.0';
}

/**
 * Convenience method for handling meeting detection events
 * @param callback Function to call when a meeting is detected
 * @returns Function to unsubscribe from the event
 */
export function onMeetingDetected(callback: (meetingData: any) => void): () => void {
  return addEventListener('meeting-detected', callback);
}

/**
 * Convenience method for handling recording state changes
 * @param callback Function to call when recording state changes
 * @returns Function to unsubscribe from the event
 */
export function onRecordingStateChange(callback: (stateData: any) => void): () => void {
  return addEventListener('sdk-state-change', callback);
}

/**
 * Convenience method for handling upload progress updates
 * @param callback Function to call when upload progress updates
 * @returns Function to unsubscribe from the event
 */
export function onUploadProgress(callback: (progressData: any) => void): () => void {
  return addEventListener('upload-progress', callback);
}

/**
 * Convenience method for handling permission status updates
 * @param callback Function to call when permission status changes
 * @returns Function to unsubscribe from the event
 */
export function onPermissionStatusChange(callback: (permissionData: any) => void): () => void {
  return addEventListener('permission-status', callback);
}

/**
 * Convenience method for handling SDK errors
 * @param callback Function to call when SDK errors occur
 * @returns Function to unsubscribe from the event
 */
export function onError(callback: (errorData: any) => void): () => void {
  return addEventListener('error', callback);
}

/**
 * Convenience method for handling real-time events (transcription, participants, etc.)
 * @param callback Function to call when real-time events occur
 * @returns Function to unsubscribe from the event
 */
export function onRealtimeEvent(callback: (realtimeData: any) => void): () => void {
  return addEventListener('realtime-event', callback);
}

// Export the API type for TypeScript support (shape of the exported functions)
type ExportedApi = {
  initSdk: typeof initSdk;
  shutdownSdk: typeof shutdownSdk;
  getStatus: typeof getStatus;
  startRecording: typeof startRecording;
  stopRecording: typeof stopRecording;
  pauseRecording: typeof pauseRecording;
  resumeRecording: typeof resumeRecording;
  uploadRecording: typeof uploadRecording;
  prepareDesktopAudioRecording: typeof prepareDesktopAudioRecording;
  requestPermission: typeof requestPermission;
  setConfig: typeof setConfig;
  getConfig: typeof getConfig;
  addEventListener: typeof addEventListener;
  getVersion: typeof getVersion;
  onMeetingDetected: typeof onMeetingDetected;
  onRecordingStateChange: typeof onRecordingStateChange;
  onUploadProgress: typeof onUploadProgress;
  onPermissionStatusChange: typeof onPermissionStatusChange;
  onError: typeof onError;
  onRealtimeEvent: typeof onRealtimeEvent;
};
export type RecallDesktopApi = ExportedApi;

console.log('RecallDesktop: Preload script loaded successfully');
