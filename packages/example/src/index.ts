import { recallDesktop } from "@todesktop/client-recall";
import {
  createEmptyStateToggle,
  createStatusSetter,
  createTranscriptRenderer,
  describeError,
  errorLog,
  log,
} from "./utils";
import {
  createMeetingDetectedHandler,
  createRealtimeHandler,
  createRecordingEndedHandler,
  createRecordingStartedHandler,
} from "./handlers";

const statusElement = document.getElementById("status");
const transcriptListElement = document.getElementById("transcript");
const emptyStateElement = document.getElementById("emptyState");

const setStatus = createStatusSetter(statusElement);
const toggleEmptyState = createEmptyStateToggle(emptyStateElement);
const appendTranscriptLine = createTranscriptRenderer(
  transcriptListElement,
  toggleEmptyState
);

const handleRealtimeEvent = createRealtimeHandler({ appendTranscriptLine });
const handleMeetingDetected = createMeetingDetectedHandler({ setStatus });
const handleRecordingStarted = createRecordingStartedHandler({ setStatus });
const handleRecordingEnded = createRecordingEndedHandler({
  setStatus,
  toggleEmptyState,
});

toggleEmptyState(true);

let initialised = false;

const initialise = async () => {
  if (initialised) {
    log("Already initialised, skipping.");
    return;
  }
  initialised = true;

  log("Initialising Recall Desktop client…");
  if (!recallDesktop.isAvailable()) {
    setStatus(
      "Recall Desktop SDK is not available. Open this page inside your ToDesktop app."
    );
    return;
  }

  try {
    const result = await recallDesktop.initSdk();
    log("initSdk result:", result);
    if (!result.success) {
      setStatus(`Failed to initialise Recall SDK: ${result.message}`);
      return;
    }
  } catch (err) {
    errorLog("initSdk threw an error", err);
    setStatus(`Failed to initialise Recall SDK: ${describeError(err)}`);
    return;
  }

  setStatus("Waiting for meeting detection…");

  recallDesktop.addEventListener("realtime-event", handleRealtimeEvent);
  recallDesktop.addEventListener("meeting-detected", handleMeetingDetected);
  recallDesktop.addEventListener("recording-started", handleRecordingStarted);
  recallDesktop.addEventListener("recording-ended", handleRecordingEnded);

  log("Event listeners registered.");
};

void initialise();
