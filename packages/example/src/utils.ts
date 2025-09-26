import type { MeetingWindow } from "@todesktop/client-recall";

const LOG_PREFIX = "[RecallExample]";

export const log = (...args: unknown[]) => {
  console.log(LOG_PREFIX, ...args);
};

export const warn = (...args: unknown[]) => {
  console.warn(LOG_PREFIX, ...args);
};

export const errorLog = (...args: unknown[]) => {
  console.error(LOG_PREFIX, ...args);
};

export const describeError = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
};

export interface TimestampedWord {
  text?: string | null;
}

export interface TranscriptParticipant {
  name?: string | null;
}

export interface TranscriptPayload {
  words?: TimestampedWord[];
  participant?: TranscriptParticipant;
}

export interface TranscriptRealtimeEnvelope {
  event: string;
  data?: {
    data?: TranscriptPayload;
  };
  window: MeetingWindow;
}

export const isTranscriptEvent = (
  payload: TranscriptRealtimeEnvelope
): payload is TranscriptRealtimeEnvelope & { event: "transcript.data" } =>
  payload.event === "transcript.data";

export const getUploadTokenFromBackend = async (): Promise<string> => {
  log("Fetching upload token from backend…");

  const response = await fetch("http://localhost:4000/api/create-sdk-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recording_config: {
        transcript: {
          provider: { assembly_ai_v3_streaming: {} },
        },
        realtime_endpoints: [
          {
            type: "desktop-sdk-callback",
            events: ["transcript.data", "participant_events.join"],
          },
        ],
      },
    }),
  });

  log("Backend responded with status", response.status, response.statusText);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch upload token: ${response.status} ${response.statusText}`
    );
  }

  const payload = (await response.json()) as { upload_token?: string };
  log("Backend payload:", payload);

  if (!payload.upload_token) {
    throw new Error("Upload token not found in backend response");
  }

  return payload.upload_token;
};

export type StatusSetter = (text: string) => void;

export const createStatusSetter = (
  element: HTMLElement | null
): StatusSetter => {
  if (!element) {
    warn("Status element not found; status updates will only log.");
  }

  return (text: string) => {
    if (element) {
      element.textContent = text;
    }
    log("Status:", text);
  };
};

export type EmptyStateToggle = (visible: boolean) => void;

export const createEmptyStateToggle = (
  element: HTMLElement | null
): EmptyStateToggle => {
  if (!element) {
    warn("Empty state element not found; nothing to toggle.");
    return () => {};
  }

  return (visible: boolean) => {
    element.style.display = visible ? "block" : "none";
  };
};

export type TranscriptRenderer = (
  speaker: string,
  text: string,
  meeting: MeetingWindow
) => void;

export const createTranscriptRenderer = (
  listElement: HTMLElement | null,
  toggleEmptyState: EmptyStateToggle
): TranscriptRenderer => {
  if (!listElement) {
    warn(
      "Transcript list element not found; transcript lines will not render."
    );
    return () => {};
  }

  return (speaker: string, text: string, meeting: MeetingWindow) => {
    const entry = document.createElement("li");
    entry.className = "entry";

    const speakerLabel = document.createElement("strong");
    speakerLabel.textContent = `${speaker} · ${
      meeting.platform ?? "unknown"
    } meeting`;
    entry.appendChild(speakerLabel);

    const textNode = document.createElement("span");
    textNode.textContent = text;
    entry.appendChild(textNode);

    listElement.appendChild(entry);
    entry.scrollIntoView({ behavior: "smooth", block: "end" });

    toggleEmptyState(false);
  };
};
