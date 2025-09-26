import RecallDesktopClient, { RecallDesktopClient as ClientClass, PermissionType } from '../src/index';

describe('RecallDesktopClient (smoke tests)', () => {
  const originalWindow = (global as any).window;

  afterEach(() => {
    (global as any).window = originalWindow;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('isAvailable() is false when plugin not present and methods throw', async () => {
    delete (global as any).window;
    const client = new ClientClass();
    expect(client.isAvailable()).toBe(false);
    await expect(client.initSdk()).rejects.toThrow(/not available/i);
    expect(() => client.getVersion()).toThrow(/not available/i);
  });

  test('calls through to underlying API when available', async () => {
    const calls: Record<string, any[]> = {};
    const track = (name: string) => (...args: any[]) => {
      calls[name] = args;
      return Promise.resolve({ success: true, message: 'ok' });
    };

    const mockApi = {
      initSdk: track('initSdk'),
      shutdownSdk: track('shutdownSdk'),
      getStatus: jest.fn().mockResolvedValue({ initialized: true }),
      startRecording: track('startRecording'),
      stopRecording: track('stopRecording'),
      pauseRecording: track('pauseRecording'),
      resumeRecording: track('resumeRecording'),
      uploadRecording: track('uploadRecording'),
      prepareDesktopAudioRecording: jest.fn().mockResolvedValue({ success: true, message: 'ok', data: { windowId: 'wd-1' } }),
      requestPermission: track('requestPermission'),
      setConfig: track('setConfig'),
      getConfig: jest.fn().mockResolvedValue({ success: true, message: 'ok', data: { apiUrl: 'x', enabled: true, requestPermissionsOnStartup: true } }),
      addEventListener: jest.fn().mockImplementation((_type: string, _cb: (d: any) => void) => {
        // Return unsubscribe
        return () => void 0;
      }),
      getVersion: jest.fn().mockReturnValue('1.2.3'),
      onMeetingDetected: jest.fn(),
      onRecordingStateChange: jest.fn(),
      onUploadProgress: jest.fn(),
      onPermissionStatusChange: jest.fn(),
      onError: jest.fn(),
      onRealtimeEvent: jest.fn(),
    } as any;

    (global as any).window = { todesktop: { recallDesktop: mockApi } };
    const client = new ClientClass();

    expect(client.isAvailable()).toBe(true);
    await client.initSdk();
    expect(calls.initSdk).toBeDefined();

    await client.startRecording('win-1', 'token-1');
    expect(calls.startRecording).toEqual(['win-1', 'token-1']);

    await client.stopRecording('win-1');
    expect(calls.stopRecording).toEqual(['win-1']);

    await client.pauseRecording('win-1');
    expect(calls.pauseRecording).toEqual(['win-1']);

    await client.resumeRecording('win-1');
    expect(calls.resumeRecording).toEqual(['win-1']);

    await client.uploadRecording('win-1');
    expect(calls.uploadRecording).toEqual(['win-1']);

    const prep = await client.prepareDesktopAudioRecording();
    expect(prep.success).toBe(true);
    expect(prep.data?.windowId).toBe('wd-1');

    await client.requestPermission('screen-capture' as PermissionType);
    expect(calls.requestPermission).toEqual(['screen-capture']);

    await client.setConfig({ apiUrl: 'https://us-east-1.recall.ai' });
    expect(calls.setConfig).toEqual([{ apiUrl: 'https://us-east-1.recall.ai' }]);

    const cfg = await client.getConfig();
    expect(cfg.success).toBe(true);

    expect(client.getVersion()).toBe('1.2.3');

    await client.shutdownSdk();
    expect(calls.shutdownSdk).toBeDefined();
  });

  test('event subscription returns working unsubscribe and removeAllEventListeners cleans up', () => {
    const unsub1 = jest.fn();
    const unsub2 = jest.fn();
    const addEventListener = jest
      .fn()
      .mockReturnValueOnce(unsub1)
      .mockReturnValueOnce(unsub2);

    (global as any).window = {
      todesktop: {
        recallDesktop: {
          addEventListener,
          initSdk: jest.fn(),
          shutdownSdk: jest.fn(),
          getStatus: jest.fn(),
          startRecording: jest.fn(),
          stopRecording: jest.fn(),
          pauseRecording: jest.fn(),
          resumeRecording: jest.fn(),
          uploadRecording: jest.fn(),
          prepareDesktopAudioRecording: jest.fn(),
          requestPermission: jest.fn(),
          setConfig: jest.fn(),
          getConfig: jest.fn(),
          getVersion: jest.fn().mockReturnValue('1.0.0'),
          onMeetingDetected: jest.fn(),
          onRecordingStateChange: jest.fn(),
          onUploadProgress: jest.fn(),
          onPermissionStatusChange: jest.fn(),
          onError: jest.fn(),
          onRealtimeEvent: jest.fn(),
        },
      },
    } as any;

    const client = new ClientClass();
    const off1 = client.addEventListener('meeting-detected', () => {});
    const off2 = client.addEventListener('upload-progress', () => {});

    // Individual unsubscribe
    off1();
    expect(unsub1).toHaveBeenCalledTimes(1);

    // removeAll should call remaining unsubscribes
    client.removeAllEventListeners();
    expect(unsub2).toHaveBeenCalledTimes(1);
  });
});
