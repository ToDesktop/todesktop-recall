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
  StartRecordingOptions,
  SendChatMessageConfig,
  AudioDevice,
  AudioDeviceDirection,
  SetDesktopAudioDeviceRequest,
  RecallDesktopCapabilities,
  StopRecordingRequest,
  PauseRecordingRequest,
  ResumeRecordingRequest,
  UploadRecordingRequest,
  PermissionType,
  RecallSdkConfig,
  PrepareDesktopAudioRecordingConfig,
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
 * @param options Optional per-recording capture settings
 * @returns Promise resolving to recording start result
 */
export async function startRecording(
  windowId: string,
  uploadToken: string,
  options?: StartRecordingOptions
): Promise<ApiResponse> {
  const request: StartRecordingRequest = { windowId, uploadToken };
  if (options?.disableRawMedia !== undefined) {
    request.disableRawMedia = options.disableRawMedia;
  }
  return ipcRenderer.invoke(IPC_CHANNELS.START_RECORDING, request);
}

/**
 * Send a chat message during a supported Raw Media recording
 * @param config Recording ID, message, and optional recipient and pin settings
 * @returns Promise resolving when the SDK accepts the message
 */
export async function sendChatMessage(config: SendChatMessageConfig): Promise<ApiResponse> {
  return ipcRenderer.invoke(IPC_CHANNELS.SEND_CHAT_MESSAGE, config);
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
 * @param config Optional SDK desktop audio preparation config
 * @returns Promise resolving to desktop audio preparation result
 */
export async function prepareDesktopAudioRecording(
  config?: PrepareDesktopAudioRecordingConfig
): Promise<ApiResponse<PrepareDesktopAudioResponse>> {
  return ipcRenderer.invoke(IPC_CHANNELS.PREPARE_DESKTOP_AUDIO, config);
}

/**
 * List Windows input and output devices for desktop audio recordings
 * @returns Promise resolving to the available audio devices
 */
export async function listDevices(): Promise<ApiResponse<AudioDevice[]>> {
  return ipcRenderer.invoke(IPC_CHANNELS.LIST_DEVICES);
}

/**
 * Select a Windows device for desktop audio recordings
 * @param id Device ID, or null to restore automatic selection
 * @param direction Input or output endpoint
 * @returns Promise resolving to the selection result
 */
export async function setDesktopAudioDevice(
  id: string | null,
  direction: AudioDeviceDirection
): Promise<ApiResponse> {
  const request: SetDesktopAudioDeviceRequest = { id, direction };
  return ipcRenderer.invoke(IPC_CHANNELS.SET_DESKTOP_AUDIO_DEVICE, request);
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
  return '1.3.16';
}

/**
 * Get features exposed by this bridge, regardless of platform or permissions
 * @returns Bridge capability flags
 */
export function getCapabilities(): RecallDesktopCapabilities {
  return {
    disableRawMedia: true,
    sendChatMessage: true,
    listDevices: true,
    setDesktopAudioDevice: true,
  };
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
 * @deprecated Use recording-started and recording-ended events instead.
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
  sendChatMessage: typeof sendChatMessage;
  stopRecording: typeof stopRecording;
  pauseRecording: typeof pauseRecording;
  resumeRecording: typeof resumeRecording;
  uploadRecording: typeof uploadRecording;
  prepareDesktopAudioRecording: typeof prepareDesktopAudioRecording;
  listDevices: typeof listDevices;
  setDesktopAudioDevice: typeof setDesktopAudioDevice;
  requestPermission: typeof requestPermission;
  setConfig: typeof setConfig;
  getConfig: typeof getConfig;
  addEventListener: typeof addEventListener;
  getVersion: typeof getVersion;
  getCapabilities: typeof getCapabilities;
  onMeetingDetected: typeof onMeetingDetected;
  onRecordingStateChange: typeof onRecordingStateChange;
  onUploadProgress: typeof onUploadProgress;
  onPermissionStatusChange: typeof onPermissionStatusChange;
  onError: typeof onError;
  onRealtimeEvent: typeof onRealtimeEvent;
};
export type RecallDesktopApi = ExportedApi;

console.log('RecallDesktop: Preload script loaded successfully');
