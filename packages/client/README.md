# ToDesktop Recall Desktop SDK Plugin

A ToDesktop plugin that integrates with [Recall.ai's Desktop Recording SDK](https://docs.recall.ai/docs/desktop-sdk) to enable automatic meeting recording for Zoom, Google Meet, and Microsoft Teams.

## Overview

This plugin provides a complete integration between ToDesktop and the Recall.ai Desktop Recording SDK, offering:

- **Automatic meeting detection** for Zoom, Google Meet, Microsoft Teams, and Slack
- **Recording management** with start, stop, pause, and resume functionality
- **Desktop audio recording** for non-meeting scenarios
- **Real-time events** including transcription and participant data
- **Permission management** for accessibility, screen capture, and microphone access
- **Upload progress tracking** and webhook integration
- **Type-safe client library** for web applications

## Want a tutorial?

Check out the [tutorial](https://todesktop.com/docs/tutorials/recall-transcripts) for a step-by-step guide on how to use the Recall desktop plugin and client SDK.

## Installation & Setup

### Prerequisites

1. **Recall.ai Account**: Sign up at [recall.ai](https://recall.ai) and get your API key
2. **ToDesktop Builder App**: Create a ToDesktop application
3. **Backend Integration**: Set up webhook endpoints and upload token generation

### 1. Install Dependencies

```bash
npm install @todesktop/client-recall
```

### 3. Add Plugin to ToDesktop Builder

1. Open ToDesktop Builder
2. Install the recall desktop sdk plugin

### 4. Configure Plugin Preferences

In ToDesktop Builder, configure the following preferences:

- **API URL**: Your Recall.ai region URL (e.g., `https://us-east-1.recall.ai`)
- **Enable Plugin**: Toggle to enable/disable recording functionality
- **Request permissions on startup**: Automatically request required permissions

## Usage

### Basic Recording Workflow

```typescript
import { recallDesktop } from "@todesktop/client-recall";

// Initialize the SDK
await recallDesktop.initSdk();

// Listen for meeting detection
const stopMeetingListener = recallDesktop.addEventListener(
  "meeting-detected",
  async ({ window }) => {
    console.log("Meeting detected:", window);

    // Get upload token from your backend
    const uploadToken = await getUploadTokenFromBackend();

    // Start recording
    const result = await recallDesktop.startRecording(window.id, uploadToken);
    if (result.success) {
      console.log("Recording started successfully");
    }
  }
);

// Listen for recording events
const stopStateListener = recallDesktop.addEventListener(
  "sdk-state-change",
  ({ sdk }) => {
    console.log("Recording state:", sdk.state.code);
  }
);

const stopUploadListener = recallDesktop.addEventListener(
  "upload-progress",
  ({ progress }) => {
    console.log(`Upload progress: ${progress}%`);
  }
);

// Handle recording completion
const stopRecordingListener = recallDesktop.addEventListener(
  "recording-ended",
  async ({ window }) => {
    console.log("Recording ended for window:", window.id);
  }
);

// Later, remove listeners when no longer needed
stopMeetingListener();
stopStateListener();
stopUploadListener();
stopRecordingListener();
```

### Raw Media and Chat Messages

Existing two-argument recording calls keep the SDK's default capture behavior. To disable Raw Media for a particular recording, pass an optional third argument:

```typescript
await recallDesktop.startRecording(windowId, uploadToken, {
  disableRawMedia: true,
});
```

Omitting `disableRawMedia`, or setting it to `false`, leaves Raw Media available when the workspace, platform, and permissions support it. It does not force Raw Media to activate. Read `rawMedia` on the `recording-started` event to determine which capture mode actually started.

Chat messages require an active Raw Media recording on a supported macOS Google Meet or Microsoft Teams setup:

```typescript
const result = await recallDesktop.sendChatMessage({
  windowId,
  message: "The meeting notes are ready.",
  to: "everyone",
  pin: false,
});
if (!result.success) {
  console.error(result.message);
}
```

Messages must contain 1–4,096 characters. `to` accepts a participant ID or `"everyone"` (the default); `pin` defaults to `false`. Success means the SDK accepted the message for queuing, not that the meeting platform displayed it. See the [Recall Raw Media documentation](https://docs.recall.ai/docs/desktop-recording-sdk-raw-media) for platform and permission requirements.

### Desktop Audio Recording

For capturing audio from applications other than supported meeting platforms:

```typescript
// Prepare desktop audio recording
const { data } = await recallDesktop.prepareDesktopAudioRecording();
const { windowId } = data;

// Get upload token and start recording
const uploadToken = await getUploadTokenFromBackend();
await recallDesktop.startRecording(windowId, uploadToken);

// Stop when done
await recallDesktop.stopRecording(windowId);
```

On Windows, you can list and select the input and output devices before preparing desktop audio capture:

```typescript
const devices = await recallDesktop.listDevices();
if (devices.success && devices.data) {
  const microphone = devices.data.find(device => device.direction === "input");
  if (microphone) {
    const selection = await recallDesktop.setDesktopAudioDevice(microphone.id, "input");
    if (!selection.success) console.error(selection.message);
  }
}

// Restore automatic output-device selection.
await recallDesktop.setDesktopAudioDevice(null, "output");
```

These APIs apply only to sources created with `prepareDesktopAudioRecording()`. They do not change device selection for detected meetings and are unavailable on macOS. Initialize the SDK before calling them. Device enumeration returns `ApiResponse<AudioDevice[]>`, where each device has `id`, `name`, and `direction` (`"input"` or `"output"`).

### Compatibility with Older Desktop Apps

The new methods and recording option require an updated installed plugin. A newer web client can check bridge support before displaying the corresponding controls:

```typescript
const capabilities = recallDesktop.getCapabilities();
// disableRawMedia, sendChatMessage, listDevices, setDesktopAudioDevice
console.log(capabilities);
```

These flags describe the installed bridge only; they do not indicate OS support, granted permissions, or an active Raw Media recording. Missing capabilities are `false` on older plugins or outside ToDesktop.

Existing calls such as `startRecording(windowId, uploadToken)` retain their arguments and behavior. When connected to an older plugin, new methods and an explicit `disableRawMedia` option return `{ success: false, message: ... }` asking for a plugin update. The client does not silently ignore the option. If no plugin is installed, recording and device methods continue to throw the existing plugin-unavailable error.

### Permission Management

```typescript
// Check permission status
const status = await recallDesktop.getStatus();
console.log("Permissions:", status.permissions);

// Request specific permission
await recallDesktop.requestPermission("screen-capture");

// Listen for permission changes
const removePermissionListener = recallDesktop.addEventListener(
  "permission-status",
  ({ permission, status }) => {
    console.log(`Permission ${permission}: ${status}`);
  }
);

// Remove the listener when you no longer need updates
removePermissionListener();
```

You can also request `teams-automation` and `browser-automation` through `requestPermission()`. These permissions cannot be requested through the SDK's `acquirePermissionsOnStartup` option and are not included in the plugin's startup permission requests.

## Backend Integration

### Demo Backend Service

A minimal Express backend lives in `packages/backend` for demos. It exposes:

- `POST /api/create-sdk-upload` – calls the Recall API and returns `{ id, upload_token, recording_id }`
- `POST /webhooks/recall` – logs Recall webhook payloads for inspection
- `GET /health` – health check

Run it with your Recall token (replace the example value with the token for your workspace):

```bash
RECALL_API_TOKEN="c5a6aaff378e5dc5a7e28b3e2853eff832ce4bde" \
npm start --workspace=packages/backend
```

The server defaults to `https://us-west-2.recall.ai`; override via `RECALL_API_BASE` if you use another region. Set `CORS_ORIGIN` to restrict cross-origin access (defaults to `*`).

### Creating Upload Tokens

Your backend needs to create upload tokens using the Recall.ai API:

```javascript
// Example backend endpoint
app.post("/api/create-upload-token", async (req, res) => {
  const response = await fetch(`${RECALL_API_URL}/api/v1/sdk-upload/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${RECALL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transcript: {
        provider: {
          assembly_ai_streaming: {},
        },
      },
    }),
  });

  const data = await response.json();
  res.json({ uploadToken: data.upload_token });
});
```

### Webhook Handling

Set up webhooks to handle recording completion:

```javascript
app.post("/webhooks/recall", (req, res) => {
  const { event, data } = req.body;

  switch (event) {
    case "sdk_upload.complete":
      console.log("Recording completed:", data.recording.id);
      // Process completed recording
      break;

    case "sdk_upload.failed":
      console.log("Recording failed:", data);
      // Handle failure
      break;

    case "sdk_upload.uploading":
      console.log("Recording uploading:", data);
      // Track upload progress
      break;
  }

  res.status(200).send("OK");
});
```

## API Reference

### Main Methods

- `initSdk()` - Initialize the Recall SDK
- `shutdownSdk()` - Shutdown the SDK and cleanup
- `getStatus()` - Get plugin and SDK status
- `getCapabilities()` - Get synchronous feature flags for the installed bridge
- `startRecording(windowId, uploadToken, options?)` - Start recording; optionally pass `{ disableRawMedia: true }`
- `sendChatMessage({ windowId, message, to?, pin? })` - Send a message through an active macOS Raw Media recording
- `stopRecording(windowId)` - Stop recording
- `pauseRecording(windowId)` - Pause recording
- `resumeRecording(windowId)` - Resume recording
- `uploadRecording(windowId)` - Compatibility no-op; recordings now stream during capture
- `prepareDesktopAudioRecording()` - Prepare desktop audio capture
- `listDevices()` - List Windows desktop-audio input and output devices
- `setDesktopAudioDevice(id, direction)` - Select a Windows desktop-audio device, or pass `null` to restore automatic selection

### Event Listeners

Use `recallDesktop.addEventListener(eventType, callback)` to subscribe. Available event types include:

- `meeting-detected`, `meeting-updated`, `meeting-closed`
- `recording-started`, `recording-ended`, `sdk-state-change` (deprecated)
- `upload-progress` (deprecated), `realtime-event`, `error`
- `permissions-granted`, `permission-status`
- `media-capture-status`, `participant-capture-status`, `compliance-message-status`, `shutdown`
- `log`, `network-status`
- `zoom-computer-audio` (macOS, SDK 2.0.34+)

The `zoom-computer-audio` event reports sustained changes to Zoom's computer-audio connection:

```typescript
const stopAudioListener = recallDesktop.addEventListener(
  "zoom-computer-audio",
  ({ window, status }) => {
    console.log(window.id, status); // "connected" or "disconnected"
  }
);
```

This is a connection status, not a mute indicator. When computer audio is disconnected (for example, when joining audio by phone), the SDK continues capturing the local microphone. Delivery requires an installed plugin using SDK 2.0.34 or later; older SDKs do not emit this event.

### Configuration

- `setConfig(config)` - Update plugin configuration
- `getConfig()` - Get current configuration
- `requestPermission(permission)` - Request specific permission

## Development

### Available Scripts

- `npm run build` - Build all packages
- `npm run dev` - Development mode with watch
- `npm run test` - Run tests
- `npm run typecheck` - TypeScript type checking
- `npm run clean` - Clean build artifacts

### Plugin Development

- The Electron plugin uses `@recallai/desktop-sdk` directly; no mock setup is required.
- Before building or type-checking the client package, the `sync-sdk-types` script copies the SDK's TypeScript declarations into `packages/client/src/generated`. This runs automatically via `npm run build --workspace=@todesktop/client-recall` and `npm run typecheck --workspace=@todesktop/client-recall`, but you can invoke it manually with:

  ```bash
  npm run sync-sdk-types --workspace=@todesktop/client-recall
  ```

  ## Changelog
  - 1.3.15
    - Updated `@recallai/desktop-sdk` from v2.0.32 to v2.0.34 in the plugin and client
    - Added typed `zoom-computer-audio` event support for macOS connection changes
    - Pulled in upstream Raw Media stabilization, macOS capture performance, Google Meet compliance messaging, Zoom Web and Slack meeting handling, microphone teardown, and AssemblyAI retry improvements
    - Pulled in upstream Raw Media concurrency, waiting-room, and Teams permission fixes; Windows audio initialization and Teams compliance messaging improvements; and Google Meet, Zoom, and Slack capture and detection fixes
    - Exposed `sendChatMessage`, `listDevices`, and `setDesktopAudioDevice` through the plugin and typed client
    - Added optional `startRecording(windowId, uploadToken, { disableRawMedia })` settings while preserving existing two-argument calls
    - Added bridge capability checks and clear unsupported-feature responses when a newer client runs with an older plugin
    - Refreshed SDK declarations and aligned event types with upstream `rawMedia`, `participantId`, and permission status fields
  - 1.3.14
    - Updated `@recallai/desktop-sdk` to v2.0.32
    - Pulled in upstream Chromium meeting detection without Full Disk Access on macOS 27, Google Meet and Zoom detection and meeting metadata fixes, and recording-start and transcription finalization reliability improvements
  - 1.3.13
    - Updated `@recallai/desktop-sdk` to v2.0.31
    - Pulled in upstream Zoom Web and webinar support on macOS, Japanese Zoom detection on Windows, Google Meet compliance messaging on Safari, and meeting detection, capture, memory, crash, and network reliability fixes
    - Added permission typing for `teams-automation` and `browser-automation`, excluding both from SDK startup permission options
    - Aligned the versions reported by the main process and preload with the package version
  - 1.3.12
    - Updated `@recallai/desktop-sdk` to v2.0.26
    - Pulled in upstream microphone tracking, meeting detection, recording finalization, and Zoom, Google Meet, Teams, and Safari capture fixes
    - No wrapper API changes were required; the upstream TypeScript declarations are unchanged
  - 1.3.11
    - Updated `@recallai/desktop-sdk` to v2.0.24
    - Pulled in upstream realtime transcription latency, Teams Web screenshare, Zoom/Google Meet PIP capture, encoding, heartbeat, status request, participant labeling, and desktop audio recording permission fixes
  - 1.3.10
    - Updated `@recallai/desktop-sdk` to v2.0.22
    - Pulled in upstream Teams Web support on macOS, transcript partial-data fixes, capture reliability and performance improvements, and compliance messaging fixes
    - Added pass-through typing for the new `compliance-message-status` SDK event
  - 1.3.9
    - Updated `@recallai/desktop-sdk` to v2.0.19
    - Pulled in upstream Google Meet, Zoom, and Teams detection fixes, video/audio capture reliability fixes, encoding performance improvements, and presigned URL retry handling
    - Added pass-through support for the optional `prepareDesktopAudioRecording` SDK config argument
  - 1.3.8
    - Updated `@recallai/desktop-sdk` to v2.0.14
    - Pulled in upstream Google Meet detection fixes, macOS memory leak fixes, audio-pipeline fixes, Teams Gallery fallback capture fixes, and Teams Windows app-hang fixes
  - 1.3.7
    - Updated `@recallai/desktop-sdk` to v2.0.13
    - Pulled in upstream app-hang fixes, performance improvements, Google Meet PIP black-recording fixes, Arc window capture support, audio-pipeline fixes, and Google Meet detection fixes
  - 1.3.6
    - Updated `@recallai/desktop-sdk` to v2.0.12
    - Pulled in upstream crash fixes, TLS handling fixes, audio-pipeline telemetry, Teams/Chromium/Safari capture fixes, Zoom multiwindow sharing, and Chrome vertical-tab meeting detection
    - Reflected upstream deprecation of `sdk-state-change`; use `recording-started` and `recording-ended` for recording state transitions
  - 1.3.5
    - Updated `@recallai/desktop-sdk` to v2.0.11
    - Pulled in upstream meeting-detection, mic-stream, and audio-pipeline reliability fixes
  - 1.3.4
    - Updated `@recallai/desktop-sdk` to v2.0.10
    - Aligned wrapper types with new Recall events and permissions
    - Documented the streamed upload model and deprecated `uploadRecording`
  - 1.3.3
    - Updated `@recallai/desktop-sdk` to v2.0.8
  - 1.3.2
    - Updated `@recallai/desktop-sdk` to v2.0.4
  - 1.3.1
    - Updated `@recallai/desktop-sdk` to v2.0.3
  - 1.3.0
    - Updated `@recallai/desktop-sdk` to v2.0.0
  - 1.2.0
    - Updated `@recallai/desktop-sdk` to v1.3.5
