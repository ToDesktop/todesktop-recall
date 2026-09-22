/**
 * Payload emitted by any Desktop Recording SDK event.
 *
 * Prefer {@link EventTypeToPayloadMap} when writing event-specific handlers because it preserves
 * the relationship between an event name and its payload type.
 *
 * @see https://docs.recall.ai/docs/desktop-recording-sdk-event-types
 */
export type RecallAiSdkEvent = RecordingStartEvent | RecordingStopEvent | UploadProgressEvent | MeetingDetectedEvent | MeetingUpdatedEvent | MeetingClosedEvent | SdkStateChangeEvent | ErrorEvent | MediaCaptureStatusEvent | ParticipantCaptureStatusEvent | ComplianceMessageStatusEvent | PermissionsGrantedEvent | PermissionStatusEvent | RealtimeEvent | ShutdownEvent | LogEvent | NetworkStatusEvent | ZoomComputerAudioEvent;
/** Maps every supported event name to the payload received by its listener. */
export type EventTypeToPayloadMap = {
    /** Emitted after media capture has started. */
    'recording-started': RecordingStartEvent;
    /** Emitted after media capture has ended. Upload processing may still be in progress. */
    'recording-ended': RecordingStopEvent;
    /**
     * @deprecated Recordings are uploaded in parallel to recording now, there is no progress.
     */
    'upload-progress': UploadProgressEvent;
    /** Emitted when the SDK detects a supported meeting. */
    'meeting-detected': MeetingDetectedEvent;
    /** Emitted when information about a detected meeting changes. */
    'meeting-updated': MeetingUpdatedEvent;
    /** Emitted when a previously detected meeting is no longer active. */
    'meeting-closed': MeetingClosedEvent;
    /**
     * @deprecated Use recording-started/recording-ended instead.
     */
    'sdk-state-change': SdkStateChangeEvent;
    /** Emitted when the SDK encounters an asynchronous error. */
    'error': ErrorEvent;
    /** Emitted when recording-level audio or video capture starts or stops. */
    'media-capture-status': MediaCaptureStatusEvent;
    /** Emitted when capture of an individual participant's media starts or stops. */
    'participant-capture-status': ParticipantCaptureStatusEvent;
    /** Emitted when delivery of the configured compliance chat message changes state. */
    'compliance-message-status': ComplianceMessageStatusEvent;
    /** Emitted when all permissions requested during initialization have been granted. */
    'permissions-granted': PermissionsGrantedEvent;
    /** Emitted for the current state of each relevant permission. */
    'permission-status': PermissionStatusEvent;
    /** Emitted for data subscribed to through a `desktop_sdk_callback` realtime endpoint. */
    'realtime-event': RealtimeEvent;
    /** Emitted when the native SDK process exits. */
    'shutdown': ShutdownEvent;
    /** Emitted for structured native SDK logs. */
    'log': LogEvent;
    /** Emitted after a sustained network disconnection or reconnection. */
    'network-status': NetworkStatusEvent;
    /** Emitted when Zoom's computer audio is disconnected or reconnected. macOS only. */
    'zoom-computer-audio': ZoomComputerAudioEvent;
};
/**
 * A permission understood by {@link requestPermission}.
 *
 * These permissions are only required on macOS. Windows reports permission requests as granted
 * because it does not require the corresponding macOS consent flows.
 *
 * `teams-automation` and `browser-automation` enable Raw Media and must be requested from an
 * explicit user action before a meeting. They cannot be included in
 * {@link RecallAiSdkConfig.acquirePermissionsOnStartup}.
 *
 * @see https://docs.recall.ai/docs/macos-permissions
 * @see https://docs.recall.ai/docs/desktop-recording-sdk-raw-media
 */
export type Permission =
/** Detect and interact with supported meeting application windows on macOS. */
'accessibility'
/** Capture a meeting window's video and system audio on macOS. */
 | 'screen-capture'
/** Capture the local microphone on macOS. */
 | 'microphone'
/** Capture system audio without screen video; unnecessary when `screen-capture` is granted. */
 | 'system-audio'
/** Read local meeting metadata used by supported legacy detection paths. */
 | 'full-disk-access'
/** Prepare Microsoft Teams Desktop for Raw Media capture. macOS only. */
 | 'teams-automation'
/** Prepare the supported default Chromium browser for Google Meet Raw Media. macOS only. */
 | 'browser-automation';
/** Identifies a meeting or prepared desktop-audio source known to the SDK. */
export interface RecallAiSdkWindow {
    /**
     * Stable identifier for this detected meeting or prepared audio source.
     * Pass this value unchanged to recording methods such as {@link startRecording}.
     */
    id: string;
    /** Meeting title, when the platform makes it available. */
    title?: string;
    /** Canonical meeting URL, when the platform makes it available. */
    url?: string;
    /** Recall.ai meeting-platform identifier, when known. */
    platform?: string;
}
/** Options used to initialize the Desktop Recording SDK. */
export interface RecallAiSdkConfig {
    /**
     * Backwards-compatible alias for {@link apiUrl}. When both are supplied, `api_url` wins.
     */
    api_url?: string;
    /**
     * Base URL for the Recall.ai region containing your workspace, for example
     * `https://us-west-2.recall.ai`. Production URLs must use HTTPS.
     *
     * @see https://docs.recall.ai/docs/regions
     */
    apiUrl?: string;
    /**
     * macOS permissions to request while initializing. Do not use this option for Raw Media
     * automation permissions; request those separately from an explicit user interaction.
     * Ignored on Windows, where these permission flows are unnecessary.
     */
    acquirePermissionsOnStartup?: Exclude<Permission, 'teams-automation' | 'browser-automation'>[];
    [key: string]: any;
}
/** Options used to start recording a detected meeting or prepared desktop-audio source. */
export interface StartRecordingConfig {
    /** ID from a meeting event or from {@link prepareDesktopAudioRecording}. */
    windowId: string;
    /** Short-lived upload token returned by the Create Desktop SDK Upload endpoint. */
    uploadToken: string;
    /**
     * Disables Raw Media when it is enabled and available in your Recall.ai workspace.
     * Defaults to false.
     *
     * @see https://docs.recall.ai/docs/desktop-recording-sdk-raw-media
     */
    disableRawMedia?: boolean;
}
/** Identifies the active recording to stop. */
export interface StopRecordingConfig {
    /** ID originally passed to {@link startRecording}. */
    windowId: string;
}
/** Identifies the active recording to pause. */
export interface PauseRecordingConfig {
    /** ID originally passed to {@link startRecording}. */
    windowId: string;
}
/** Identifies the paused recording to resume. */
export interface ResumeRecordingConfig {
    /** ID originally passed to {@link startRecording}. */
    windowId: string;
}
/** Options for sending a chat message through an active Raw Media recording. */
export interface SendChatMessageConfig {
    /** ID of the active Raw Media recording. */
    windowId: string;
    /** Message body. Must contain between 1 and 4,096 characters. */
    message: string;
    /** The participant ID, or "everyone". Defaults to "everyone". */
    to?: string;
    /** Whether to pin the message. Defaults to false. */
    pin?: boolean;
}
/**
 * @deprecated Recordings are automatically uploaded based on your retention configuration. This is now a no-op.
 */
export interface UploadRecordingConfig {
    /** ID originally passed to {@link startRecording}. */
    windowId: string;
}
interface PrepareDesktopAudioRecordingConfig {
    [key: string]: any;
}
/** Audio endpoint direction used by Windows desktop-audio recordings. */
export type AudioDeviceDirection = 'input' | 'output';
/** An audio endpoint available to Windows desktop-audio recordings. */
export interface AudioDevice {
    /** Platform-specific device identifier accepted by {@link setDesktopAudioDevice}. */
    id: string;
    /** Human-readable device name. */
    name: string;
    /** Whether this endpoint captures microphone input or renders system output. */
    direction: AudioDeviceDirection;
}
/** Payload for the `recording-started` event. */
export interface RecordingStartEvent {
    /** Meeting or prepared audio source being recorded. */
    window: RecallAiSdkWindow;
    /**
     * Whether this recording is using Desktop SDK Raw Media. Use this as the source of truth for
     * the active recording; `false` includes recordings that fell back to local capture.
     */
    rawMedia: boolean;
}
/** Payload for the `recording-ended` event. */
export interface RecordingStopEvent {
    /** Meeting or prepared audio source whose capture ended. */
    window: RecallAiSdkWindow;
}
/**
 * Payload for the deprecated `upload-progress` event.
 * @deprecated Recordings upload while capture is in progress and no longer report progress.
 */
export interface UploadProgressEvent {
    /** Identifier of the recording source. */
    window: {
        id: string;
    };
    /** Legacy upload progress value. */
    progress: number;
}
/** Payload for the `meeting-detected` event. */
export interface MeetingDetectedEvent {
    /** Newly detected meeting. */
    window: RecallAiSdkWindow;
}
/** Payload for the `meeting-updated` event. */
export interface MeetingUpdatedEvent {
    /** Current meeting data, including any newly resolved title or URL. */
    window: RecallAiSdkWindow;
}
/** Payload for the `meeting-closed` event. */
export interface MeetingClosedEvent {
    /** Meeting that is no longer detected. */
    window: RecallAiSdkWindow;
}
/**
 * @deprecated Use recording-started/recording-ended instead.
 */
export interface SdkStateChangeEvent {
    /** Legacy global SDK state. */
    sdk: {
        state: {
            /** Current legacy recording state. */
            code: 'recording' | 'idle' | 'paused';
        };
    };
}
/** Payload describing recording-level media capture availability. */
export interface MediaCaptureStatusEvent {
    /** Recording affected by the change. */
    window: RecallAiSdkWindow;
    /** Media kind whose capture state changed. */
    type: 'video' | 'audio';
    /** `true` when the SDK is currently capturing this media kind. */
    capturing: boolean;
}
/** Payload describing capture availability for an individual participant's media. */
export interface ParticipantCaptureStatusEvent {
    /** Recording affected by the change. */
    window: RecallAiSdkWindow;
    /** Numeric identifier of the participant whose capture state changed. */
    participantId: number;
    /** Participant media kind whose capture state changed. */
    type: 'video' | 'audio' | 'screenshare';
    /** `true` when the SDK is currently capturing this participant media kind. */
    capturing: boolean;
}
/** Payload for delivery of the compliance message configured on the Desktop SDK Upload. */
export interface ComplianceMessageStatusEvent {
    /** Recording for which the compliance message was configured. */
    window: RecallAiSdkWindow;
    /** Final or current delivery result. */
    status: 'sent' | 'timeout' | 'cancelled';
}
/**
 * Payload for the legacy aggregate `permissions-granted` event.
 * Use `permission-status` when your UI needs the state of an individual permission.
 */
export interface PermissionsGrantedEvent {
}
/** Payload reporting the state of a Desktop Recording SDK permission. */
export interface PermissionStatusEvent {
    /** Permission whose state was checked or changed. */
    permission: Permission;
    /** Convenience boolean equivalent to `status === "granted"`. */
    granted: boolean;
    /**
     * Current state. Values are `granted`, `not_requested`, `denied`, `not_installed`, and
     * `error`. Automation permissions use `not_installed` when the required application or
     * supported default browser is unavailable.
     */
    status: 'granted' | 'not_requested' | 'denied' | 'not_installed' | 'error';
}
/** Payload for an asynchronous SDK error. */
export interface ErrorEvent {
    /** Meeting associated with the error, when applicable. */
    window?: RecallAiSdkWindow;
    /** Machine-readable error category. */
    type: string;
    /** Human-readable diagnostic message. */
    message: string;
}
/** Payload delivered for a configured `desktop_sdk_callback` realtime event. */
export interface RealtimeEvent {
    /** Recording that produced the realtime event. */
    window: RecallAiSdkWindow;
    /** Configured event name, such as `transcript.data` or `participant_events.join`. */
    event: string;
    /** Event-specific payload matching the realtime event schema. */
    data: any;
}
/** Payload emitted when the native Desktop Recording SDK process exits. */
export interface ShutdownEvent {
    /** Native process exit code, or `0` when no exit code is available. */
    code: number;
    /** Signal that terminated the process, or an empty string when it exited normally. */
    signal: string;
}
/** Payload emitted after a sustained network state change. */
export interface NetworkStatusEvent {
    /** Whether the network disconnected or recovered after a disconnection. */
    status: 'reconnected' | 'disconnected';
}
/**
 * Payload emitted after a sustained change to Zoom's computer-audio connection.
 *
 * `disconnected` means the local user is in the meeting without computer audio (for example
 * dialled in by phone, or handed off to a Zoom Room). They remain audible to their own
 * microphone, so the SDK keeps capturing it; an explicit mute is reported by neither status.
 */
export interface ZoomComputerAudioEvent {
    /** Recording affected by the change. */
    window: RecallAiSdkWindow;
    /** Whether Zoom's computer audio is currently connected. */
    status: 'connected' | 'disconnected';
}
/** Structured diagnostic log emitted by the native SDK. */
export interface LogEvent {
    /** Log severity. */
    level: 'debug' | 'info' | 'warning' | 'error';
    /** Formatted log message. */
    message: string;
    /** Native logging subsystem. */
    subsystem: string;
    /** Native logging category. */
    category: string;
    /** Associated meeting ID, or an empty string for SDK-wide messages. */
    window_id: string;
}
/**
 * Starts the native Desktop Recording SDK process and begins meeting detection.
 *
 * Call this once during application startup, after registering any listeners that must observe
 * initial permission and meeting-detection events. Supported on macOS and Windows; Linux is not
 * supported. The returned promise resolves after the native process accepts its configuration.
 *
 * @param options SDK initialization and region configuration.
 * @returns `null` after initialization succeeds.
 * @throws If the platform is unsupported, the API URL is invalid, or the native SDK cannot start.
 * @see https://docs.recall.ai/docs/desktop-sdk
 * @see https://docs.recall.ai/docs/dsdk-supported-platforms
 */
export declare function init(options: RecallAiSdkConfig): Promise<null>;
/**
 * Gracefully stops active SDK work and terminates the native Desktop Recording SDK process.
 *
 * Supported on macOS and Windows. Call {@link init} again before issuing more SDK commands. This
 * method waits for the process to exit and force-terminates it after five seconds if necessary.
 *
 * @returns `null` after shutdown has been acknowledged.
 * @throws If the SDK is not running or the shutdown command fails.
 */
export declare function shutdown(): Promise<null>;
/**
 * Produces a diagnostic macOS accessibility-tree dump for a running application.
 *
 * This is an internal troubleshooting API, is unsupported on Windows, and should not be used by
 * production integrations.
 *
 * @param procName Name of the process to inspect.
 * @returns The native diagnostic command result.
 */
export declare function dumpAXTree(procName: string): Promise<any>;
/**
 * Produces diagnostic information about applications visible to macOS accessibility APIs.
 *
 * This is an internal troubleshooting API, is unsupported on Windows, and should not be used by
 * production integrations.
 *
 * @returns The native diagnostic command result.
 */
export declare function dumpAllApplications(): Promise<any>;
/**
 * Starts recording a detected meeting or a source returned by
 * {@link prepareDesktopAudioRecording}.
 *
 * Supported on macOS and Windows. `windowId` must come from the SDK and `uploadToken` must come
 * from a newly created Desktop SDK Upload. On supported macOS meeting platforms, the SDK uses Raw
 * Media when it is enabled and available; otherwise it records locally. Resolve capture mode from
 * `recording-started.rawMedia` rather than predicting it from configuration.
 *
 * The returned promise only confirms that the start command was accepted. Listen for
 * `recording-started` to confirm that media capture began and `error` for asynchronous failures.
 * Starting a different recording stops the currently active recording.
 *
 * @param config Meeting/source ID, upload token, and optional Raw Media override.
 * @returns `null` after the start command is accepted.
 * @throws If the source is unknown, already recorded, permissions are insufficient, or startup fails.
 * @see https://docs.recall.ai/docs/desktop-sdk
 * @see https://docs.recall.ai/docs/desktop-recording-sdk-raw-media
 */
export declare function startRecording(config: StartRecordingConfig): Promise<null>;
/**
 * Stops the active recording for a meeting or prepared desktop-audio source.
 *
 * Supported for local recordings on macOS and Windows and for Raw Media recordings on macOS. The
 * returned promise confirms command handling, not completion of cloud artifact processing. Listen
 * for `recording-ended` for capture completion and use Desktop SDK Upload webhooks for final upload
 * status.
 *
 * @param config ID originally passed to {@link startRecording}.
 * @returns `null` after the stop command is handled.
 * @throws If the SDK is not running or the command cannot be delivered.
 */
export declare function stopRecording({ windowId }: StopRecordingConfig): Promise<null>;
/**
 * Pauses media capture for an active recording without ending the recording.
 *
 * Supported for local recordings on macOS and Windows and for Raw Media recordings on macOS. Use
 * the same `windowId` that was passed to {@link startRecording}. Call {@link resumeRecording} to
 * continue the recording.
 *
 * @param config Active recording ID.
 * @returns `null` after the pause command is handled.
 * @throws If the SDK is not running or the command cannot be delivered.
 */
export declare function pauseRecording({ windowId }: PauseRecordingConfig): Promise<null>;
/**
 * Resumes media capture for a paused recording.
 *
 * Supported for local recordings on macOS and Windows and for Raw Media recordings on macOS. Use
 * the same `windowId` that was passed to {@link startRecording}.
 *
 * @param config Paused recording ID.
 * @returns `null` after the resume command is handled.
 * @throws If the SDK is not running or the command cannot be delivered.
 */
export declare function resumeRecording({ windowId }: ResumeRecordingConfig): Promise<null>;
/**
 * Sends a chat message through an active Desktop SDK Raw Media recording.
 *
 * Supported for Microsoft Teams Desktop and supported Chromium-based Google Meet browsers on
 * macOS when `recording-started.rawMedia` is `true`. This method is not available for local
 * recordings or on Windows. The returned promise confirms that the message was accepted and queued
 * for the Raw Media connection; it does not confirm that the meeting platform displayed it.
 *
 * @param config Active Raw Media recording ID, message, recipient, and pin behavior.
 * @returns `null` after the message is queued.
 * @throws If the message is empty or exceeds 4,096 characters, the recipient is empty, or no Raw
 * Media recording is active for `windowId`.
 * @see https://docs.recall.ai/docs/desktop-recording-sdk-raw-media
 */
export declare function sendChatMessage({ windowId, message, to, pin, }: SendChatMessageConfig): Promise<null>;
/**
 * Legacy no-op retained for backwards compatibility.
 *
 * Recordings upload automatically according to their retention configuration. Observe Desktop SDK
 * Upload webhooks instead of calling this method.
 *
 * @deprecated Recordings upload automatically; this method does nothing.
 * @param config Legacy recording identifier. The value is ignored.
 * @returns `null` after the no-op command is handled.
 */
export declare function uploadRecording({ windowId }: UploadRecordingConfig): Promise<null>;
/**
 * Prepares an audio-only source for an in-person or whole-desktop recording.
 *
 * Supported on macOS and Windows. This does not start recording: pass the returned ID to
 * {@link startRecording} with a Desktop SDK Upload token. On Windows, audio devices selected with
 * {@link setDesktopAudioDevice} apply to this source. Device selection does not affect detected
 * meeting recordings.
 *
 * @param config Optional internal compatibility settings. Most integrations should omit this.
 * @returns A generated source ID to pass as `windowId` to {@link startRecording}.
 * @throws If the SDK cannot prepare desktop audio capture.
 * @see https://docs.recall.ai/docs/adhoc-meetings-in-person-meetings
 */
export declare function prepareDesktopAudioRecording(config?: PrepareDesktopAudioRecordingConfig): Promise<string>;
/**
 * Lists the audio devices that can be selected for recordings created with
 * {@link prepareDesktopAudioRecording}. This API is only for
 * `prepareDesktopAudioRecording` recordings, does not affect detected meeting recordings, and
 * is only available on Windows.
 *
 * @returns The active Windows audio input and output devices.
 * @throws On macOS, or when Windows audio endpoints cannot be enumerated.
 */
export declare function listDevices(): Promise<AudioDevice[]>;
/**
 * Selects an audio device for recordings created with {@link prepareDesktopAudioRecording}.
 * This API is only for `prepareDesktopAudioRecording` recordings and does not affect detected
 * meeting recordings. It is only available on Windows. Pass `null` to restore automatic device
 * selection for the direction.
 *
 * A selection applies to subsequently prepared desktop-audio recordings and, when supported, the
 * currently prepared desktop-audio source.
 *
 * @param id Device ID from {@link listDevices}, or `null` to use automatic selection.
 * @param dir Whether to select the input or output endpoint.
 * @returns `null` after the selection is applied.
 * @throws On macOS, for an invalid device ID, or when the selection cannot be applied.
 */
export declare function setDesktopAudioDevice(id: string | null, dir: AudioDeviceDirection): Promise<null>;
/**
 * Requests or checks a Desktop Recording SDK permission.
 *
 * macOS may display a system prompt or open the relevant System Settings pane. Observe
 * `permission-status` for the resulting state; promise resolution does not by itself mean the user
 * granted access. Windows does not require these macOS permissions and reports requests as granted.
 *
 * Request `teams-automation` and `browser-automation` only from an explicit user interaction and
 * before a meeting starts. Automation setup may restart Teams or the supported default browser and
 * must not be requested through `acquirePermissionsOnStartup`.
 *
 * @param permission Permission to request.
 * @returns `null` after the request is accepted.
 * @throws If the SDK is not running or the request cannot be delivered.
 * @see https://docs.recall.ai/docs/macos-permissions
 * @see https://docs.recall.ai/docs/desktop-recording-sdk-raw-media
 */
export declare function requestPermission(permission: Permission): Promise<null>;
/**
 * Registers an in-process listener for a Desktop Recording SDK event.
 *
 * Register important listeners before calling {@link init} so they receive initial permission and
 * already-active meeting events. A listener remains registered across automatic native-process
 * restarts until explicitly removed.
 *
 * @param type Event name.
 * @param callback Function invoked synchronously for each matching event payload.
 * @see https://docs.recall.ai/docs/desktop-recording-sdk-event-types
 */
export declare function addEventListener<T extends keyof EventTypeToPayloadMap>(type: T, callback: (event: EventTypeToPayloadMap[T]) => void): void;
/**
 * Removes one event listener previously registered with {@link addEventListener}.
 *
 * The callback must be the same function reference used during registration. If the listener is
 * not registered, this method has no effect.
 *
 * @param type Event name used during registration.
 * @param callback Original callback function reference.
 */
export declare function removeEventListener<T extends keyof EventTypeToPayloadMap>(type: T, callback: (event: EventTypeToPayloadMap[T]) => void): void;
/**
 * Removes every event listener registered through this module.
 *
 * This affects all event types and does not stop or shut down the SDK.
 */
export declare function removeAllEventListeners(): void;
/**
 * Desktop Recording SDK API.
 *
 * The same functions are also available as named exports.
 */
declare const RecallAiSdk: {
    init: typeof init;
    shutdown: typeof shutdown;
    startRecording: typeof startRecording;
    stopRecording: typeof stopRecording;
    pauseRecording: typeof pauseRecording;
    resumeRecording: typeof resumeRecording;
    sendChatMessage: typeof sendChatMessage;
    uploadRecording: typeof uploadRecording;
    prepareDesktopAudioRecording: typeof prepareDesktopAudioRecording;
    listDevices: typeof listDevices;
    setDesktopAudioDevice: typeof setDesktopAudioDevice;
    requestPermission: typeof requestPermission;
    addEventListener: typeof addEventListener;
    removeEventListener: typeof removeEventListener;
    removeAllEventListeners: typeof removeAllEventListeners;
};
export default RecallAiSdk;
