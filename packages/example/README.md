# Recall Transcript Web Example

A minimal webpage demonstrating how to consume realtime transcript updates from the ToDesktop Recall client SDK, automatically start recordings, and render transcript text in the browser. The page emits verbose console logs (prefixed with `[RecallExample]`) to aid debugging when something goes wrong.

## Backend prerequisite

The page expects a local backend running at `http://localhost:4000/api/create-sdk-upload` that returns an `upload_token`. The request body matches the Recall sample configuration for streaming transcripts.

```
POST /api/create-sdk-upload
Content-Type: application/json
{
  "recording_config": {
    "transcript": { "provider": { "assembly_ai_v3_streaming": {} } },
    "realtime_endpoints": [
      { "type": "desktop-sdk-callback", "events": ["transcript.data", "participant_events.join"] }
    ]
  }
}
```

The response must include `{ "upload_token": "..." }`.

## Build once

Bundle the TypeScript entry point and copy the HTML shell:

```bash
npm run build --workspace=@todesktop/recall-example
```

This generates static assets in `packages/example/dist/` (`index.html`, `index.js`, and sourcemaps).

## Live development server

Serve the page on `http://localhost:5173` with automatic rebuilds:

```bash
npm run dev --workspace=@todesktop/recall-example
```

The script:
- Runs esbuild in watch mode to bundle `src/index.ts` into `dist/`.
- Watches `src/index.html` and recopies it when it changes.
- Hosts the compiled files on a local HTTP server.

## Use inside ToDesktop

1. Load the served page inside a ToDesktop renderer window (or package the `dist/` output).
2. When a meeting is detected, the page fetches an upload token, starts recording automatically, and begins streaming transcript lines.
3. Transcript lines appear as `Speaker · platform` followed by the spoken text.

Open the developer console to follow the `[RecallExample]` logs when diagnosing issues. If the SDK is unavailable, initialisation fails, or recording cannot start, an error message is shown in the status banner.
