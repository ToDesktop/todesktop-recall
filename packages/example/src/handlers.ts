import { recallDesktop, type MeetingWindow } from '@todesktop/client-recall';
import {
  TranscriptRealtimeEnvelope,
  describeError,
  errorLog,
  getUploadTokenFromBackend,
  isTranscriptEvent,
  log,
  warn,
} from './utils';
import { getActiveRecordingWindowId, setActiveRecordingWindowId } from './state';

interface MeetingDetectedDeps {
  setStatus: (text: string) => void;
}

interface RealtimeDeps {
  appendTranscriptLine: (speaker: string, text: string, meeting: MeetingWindow) => void;
}

interface RecordingStartedDeps {
  setStatus: (text: string) => void;
}

interface RecordingEndedDeps {
  setStatus: (text: string) => void;
  toggleEmptyState: (shouldShowEmpty: boolean) => void;
}

export const createMeetingDetectedHandler = ({ setStatus }: MeetingDetectedDeps) => {
  return async ({ window }: { window: MeetingWindow }) => {
    log('Meeting detected:', window);

    if (getActiveRecordingWindowId() === window.id) {
      log('Recording already active for window', window.id);
      return;
    }

    setStatus(`Meeting detected for ${window.platform ?? 'unknown'} — fetching upload token…`);

    try {
      const uploadToken = await getUploadTokenFromBackend();
      log('Received upload token, starting recording…');

      const result = await recallDesktop.startRecording(window.id, uploadToken);
      log('startRecording result:', result);

      if (!result.success) {
        throw new Error(result.message ?? 'Unknown error starting recording');
      }

      setActiveRecordingWindowId(window.id);
      setStatus(`Recording started (${window.platform ?? 'unknown'}). Waiting for transcript data…`);
    } catch (err) {
      errorLog('Failed to start recording', err);
      setStatus(`Failed to start recording: ${describeError(err)}`);
    }
  };
};

export const createRealtimeHandler = ({ appendTranscriptLine }: RealtimeDeps) => {
  return (payload: TranscriptRealtimeEnvelope) => {
    if (!isTranscriptEvent(payload)) {
      return;
    }

    log('Transcript event received:', payload);

    const transcriptData = payload.data?.data;
    if (!transcriptData) {
      warn('Transcript event missing data payload');
      return;
    }

    const words = transcriptData.words?.map((word) => word.text?.trim()).filter(Boolean) ?? [];
    if (words.length === 0) {
      warn('Transcript event contained no words');
      return;
    }

    const speakerName = transcriptData.participant?.name?.trim();
    const speaker = speakerName && speakerName.length > 0 ? speakerName : 'Unknown participant';

    appendTranscriptLine(speaker, words.join(' '), payload.window);
  };
};

export const createRecordingStartedHandler = ({ setStatus }: RecordingStartedDeps) => {
  return ({ window }: { window: MeetingWindow }) => {
    log('Recording started event received:', window);
    setStatus(`Recording confirmed for ${window.platform ?? 'unknown'}.`);
  };
};

export const createRecordingEndedHandler = ({
  setStatus,
  toggleEmptyState,
}: RecordingEndedDeps) => {
  return ({ window }: { window: MeetingWindow }) => {
    log('Recording ended event received:', window);

    if (getActiveRecordingWindowId() === window.id) {
      setActiveRecordingWindowId(null);
    }

    setStatus('Recording ended. Waiting for the next meeting…');
    toggleEmptyState(true);
  };
};
