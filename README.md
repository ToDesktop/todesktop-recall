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

    // Upload the recording
    await recallDesktop.uploadRecording(window.id);
  }
);

// Later, remove listeners when no longer needed
stopMeetingListener();
stopStateListener();
stopUploadListener();
stopRecordingListener();
```

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
await recallDesktop.uploadRecording(windowId);
```

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
- `startRecording(windowId, uploadToken)` - Start recording a meeting
- `stopRecording(windowId)` - Stop recording
- `pauseRecording(windowId)` - Pause recording
- `resumeRecording(windowId)` - Resume recording
- `uploadRecording(windowId)` - Upload completed recording
- `prepareDesktopAudioRecording()` - Prepare desktop audio capture

### Event Listeners

Use `recallDesktop.addEventListener(eventType, callback)` to subscribe. Available event types include:

- `meeting-detected`, `meeting-updated`, `meeting-closed`
- `recording-started`, `recording-ended`, `sdk-state-change`
- `upload-progress`, `realtime-event`, `error`
- `permissions-granted`, `permission-status`
- `media-capture-status`, `participant-capture-status`, `shutdown`

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
  - 1.3.2
    - Updated `@recallai/desktop-sdk` to v2.0.4
  - 1.3.1
    - Updated `@recallai/desktop-sdk` to v2.0.3
  - 1.3.0
    - Updated `@recallai/desktop-sdk` to v2.0.0
  - 1.2.0
    - Updated `@recallai/desktop-sdk` to v1.3.5
