let activeRecordingWindowId: string | null = null;

export const getActiveRecordingWindowId = (): string | null => activeRecordingWindowId;

export const setActiveRecordingWindowId = (windowId: string | null) => {
  activeRecordingWindowId = windowId;
};
