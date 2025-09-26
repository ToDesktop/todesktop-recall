export type RecallAiSdkEvent = RecordingStartEvent | RecordingStopEvent | UploadProgressEvent | MeetingDetectedEvent | MeetingUpdatedEvent | MeetingClosedEvent | SdkStateChangeEvent | ErrorEvent | MediaCaptureStatusEvent | ParticipantCaptureStatusEvent | PermissionsGrantedEvent | RealtimeEvent | ShutdownEvent;
export type EventTypeToPayloadMap = {
    'recording-started': RecordingStartEvent;
    'recording-ended': RecordingStopEvent;
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
};
export type Permission = 'accessibility' | 'screen-capture' | 'microphone' | 'system-audio';
export interface RecallAiSdkWindow {
    id: string;
    title?: string;
    url?: string;
    platform: string;
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
export declare function init(options: RecallAiSdkConfig): Promise<null>;
export declare function shutdown(): Promise<null>;
export declare function startRecording(config: StartRecordingConfig): Promise<null>;
export declare function stopRecording({ windowId }: StopRecordingConfig): Promise<null>;
export declare function pauseRecording({ windowId }: PauseRecordingConfig): Promise<null>;
export declare function resumeRecording({ windowId }: ResumeRecordingConfig): Promise<null>;
export declare function uploadRecording({ windowId }: UploadRecordingConfig): Promise<null>;
export declare function prepareDesktopAudioRecording(): Promise<string>;
export declare function requestPermission(permission: Permission): Promise<null>;
export declare function addEventListener<T extends keyof EventTypeToPayloadMap>(type: T, callback: (event: EventTypeToPayloadMap[T]) => void): void;
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
};
export default RecallAiSdk;
