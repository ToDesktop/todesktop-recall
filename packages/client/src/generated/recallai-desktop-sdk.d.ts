export type RecallAiSdkEvent = RecordingStartEvent | RecordingStopEvent | UploadProgressEvent | MeetingDetectedEvent | MeetingUpdatedEvent | MeetingClosedEvent | SdkStateChangeEvent | ErrorEvent | MediaCaptureStatusEvent | ParticipantCaptureStatusEvent | PermissionsGrantedEvent | RealtimeEvent | ShutdownEvent | LogEvent | NetworkStatusEvent;
export type EventTypeToPayloadMap = {
    'recording-started': RecordingStartEvent;
    'recording-ended': RecordingStopEvent;
    /**
     * @deprecated Recordings are uploaded in parallel to recording now, there is no progress.
     */
    'upload-progress': UploadProgressEvent;
    'meeting-detected': MeetingDetectedEvent;
    'meeting-updated': MeetingUpdatedEvent;
    'meeting-closed': MeetingClosedEvent;
    'sdk-state-change': SdkStateChangeEvent;
    'error': ErrorEvent;
    'media-capture-status': MediaCaptureStatusEvent;
    'participant-capture-status': ParticipantCaptureStatusEvent;
    'permissions-granted': PermissionsGrantedEvent;
    'permission-status': PermissionStatusEvent;
    'realtime-event': RealtimeEvent;
    'shutdown': ShutdownEvent;
    'log': LogEvent;
    'network-status': NetworkStatusEvent;
};
export type Permission = 'accessibility' | 'screen-capture' | 'microphone' | 'system-audio' | 'full-disk-access';
export interface RecallAiSdkWindow {
    id: string;
    title?: string;
    url?: string;
    platform?: string;
}
export interface RecallAiSdkConfig {
    api_url?: string;
    apiUrl?: string;
    acquirePermissionsOnStartup?: Permission[];
    restartOnError?: boolean;
    dev?: boolean;
}
export interface StartRecordingConfig {
    windowId: string;
    uploadToken: string;
}
export interface StopRecordingConfig {
    windowId: string;
}
export interface PauseRecordingConfig {
    windowId: string;
}
export interface ResumeRecordingConfig {
    windowId: string;
}
/**
 * @deprecated Recordings are automatically uploaded based on your rentention configuration. This is now a no-op.
 */
export interface UploadRecordingConfig {
    windowId: string;
}
export interface RecordingStartEvent {
    window: RecallAiSdkWindow;
}
export interface RecordingStopEvent {
    window: RecallAiSdkWindow;
}
export interface UploadProgressEvent {
    window: {
        id: string;
    };
    progress: number;
}
export interface MeetingDetectedEvent {
    window: RecallAiSdkWindow;
}
export interface MeetingUpdatedEvent {
    window: RecallAiSdkWindow;
}
export interface MeetingClosedEvent {
    window: RecallAiSdkWindow;
}
export interface SdkStateChangeEvent {
    sdk: {
        state: {
            code: 'recording' | 'idle' | 'paused';
        };
    };
}
export interface MediaCaptureStatusEvent {
    window: RecallAiSdkWindow;
    type: 'video' | 'audio';
    capturing: boolean;
}
export interface ParticipantCaptureStatusEvent {
    window: RecallAiSdkWindow;
    type: 'video' | 'audio' | 'screenshare';
    capturing: boolean;
}
export interface PermissionsGrantedEvent {
}
export interface PermissionStatusEvent {
    permission: Permission;
    status: string;
}
export interface ErrorEvent {
    window?: RecallAiSdkWindow;
    type: string;
    message: string;
}
export interface RealtimeEvent {
    window: RecallAiSdkWindow;
    event: string;
    data: any;
}
export interface ShutdownEvent {
    code: number;
    signal: string;
}
export interface NetworkStatusEvent {
    status: 'reconnected' | 'disconnected';
}
export interface LogEvent {
    level: 'debug' | 'info' | 'warning' | 'error';
    message: string;
    subsystem: string;
    category: string;
    window_id: string;
}
export declare function init(options: RecallAiSdkConfig): Promise<null>;
export declare function shutdown(): Promise<null>;
export declare function dumpAXTree(procName: string): Promise<any>;
export declare function dumpAllApplications(): Promise<any>;
export declare function startRecording(config: StartRecordingConfig): Promise<null>;
export declare function stopRecording({ windowId }: StopRecordingConfig): Promise<null>;
export declare function pauseRecording({ windowId }: PauseRecordingConfig): Promise<null>;
export declare function resumeRecording({ windowId }: ResumeRecordingConfig): Promise<null>;
/**
 * @deprecated Recordings are automatically uploaded based on your rentention configuration. This is now a no-op.
 */
export declare function uploadRecording({ windowId }: UploadRecordingConfig): Promise<null>;
export declare function prepareDesktopAudioRecording(): Promise<string>;
export declare function requestPermission(permission: Permission): Promise<null>;
export declare function addEventListener<T extends keyof EventTypeToPayloadMap>(type: T, callback: (event: EventTypeToPayloadMap[T]) => void): void;
export declare function removeEventListener<T extends keyof EventTypeToPayloadMap>(type: T, callback: (event: EventTypeToPayloadMap[T]) => void): void;
export declare function removeAllEventListeners(): void;
declare const RecallAiSdk: {
    init: typeof init;
    shutdown: typeof shutdown;
    startRecording: typeof startRecording;
    stopRecording: typeof stopRecording;
    pauseRecording: typeof pauseRecording;
    resumeRecording: typeof resumeRecording;
    uploadRecording: typeof uploadRecording;
    prepareDesktopAudioRecording: typeof prepareDesktopAudioRecording;
    requestPermission: typeof requestPermission;
    addEventListener: typeof addEventListener;
    removeEventListener: typeof removeEventListener;
    removeAllEventListeners: typeof removeAllEventListeners;
};
export default RecallAiSdk;
