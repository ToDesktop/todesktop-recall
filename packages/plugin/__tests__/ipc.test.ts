import { ipcMain, ipcRenderer } from 'electron';
import { EventEmitter } from 'events';
import RecallAiSdk from '@recallai/desktop-sdk';
import { RecallDesktopClient } from '../../client/src/index';
import { recallDesktopMain } from '../src/main';
import * as preload from '../src/preload';
import { IPC_CHANNELS } from '../src/shared';
import { recallSdkStore } from '../src/store';

jest.mock('electron', () => ({
  ipcMain: { handle: jest.fn() },
  ipcRenderer: { invoke: jest.fn(), on: jest.fn(), removeListener: jest.fn() },
}));
jest.mock('@recallai/desktop-sdk', () => ({
  __esModule: true,
  default: {
    startRecording: jest.fn(),
    sendChatMessage: jest.fn(),
    listDevices: jest.fn(),
    setDesktopAudioDevice: jest.fn(),
    addEventListener: jest.fn(),
  },
}));

const sdk = jest.mocked(RecallAiSdk);
const invoke = jest.mocked(ipcRenderer.invoke);
const handlers = new Map<string, (event: unknown, request?: unknown) => Promise<unknown>>();
const originalWindow = (global as any).window;
let client: RecallDesktopClient;

beforeAll(async () => {
  jest.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
    handlers.set(channel, handler as (event: unknown, request?: unknown) => Promise<unknown>);
  });
  await recallDesktopMain.initialize();
});
beforeEach(() => {
  jest.clearAllMocks();
  for (const mock of [sdk.startRecording, sdk.sendChatMessage, sdk.listDevices, sdk.setDesktopAudioDevice]) {
    mock.mockReset();
  }
  invoke.mockImplementation(async (channel, request) => {
    const handler = handlers.get(channel);
    if (!handler) throw new Error(`No handler for ${channel}`);
    return handler({}, request);
  });
  recallSdkStore.setSdkInitialized(true);
  (global as any).window = { todesktop: { recallDesktop: preload } };
  client = new RecallDesktopClient();
});
afterEach(() => {
  (global as any).window = originalWindow;
});

test('legacy recording calls retain their original IPC and SDK payloads', async () => {
  await expect(client.startRecording('window', 'token')).resolves.toMatchObject({ success: true });
  expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.START_RECORDING, { windowId: 'window', uploadToken: 'token' });
  expect(sdk.startRecording).toHaveBeenCalledWith({ windowId: 'window', uploadToken: 'token' });
});

test.each([true, false])('forwards disableRawMedia=%s through client, preload, and main', async disableRawMedia => {
  await expect(client.startRecording('window', 'token', { disableRawMedia })).resolves.toMatchObject({ success: true });
  expect(sdk.startRecording).toHaveBeenCalledWith({ windowId: 'window', uploadToken: 'token', disableRawMedia });
});

test('recording options cannot replace the window ID or upload token', async () => {
  const options = { disableRawMedia: true, windowId: 'other', uploadToken: 'other' };
  await client.startRecording('window', 'token', options);
  expect(sdk.startRecording).toHaveBeenCalledWith({ windowId: 'window', uploadToken: 'token', disableRawMedia: true });
});

test('rejects an invalid Raw Media override at the IPC boundary', async () => {
  const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const result = await invoke(IPC_CHANNELS.START_RECORDING, { windowId: 'window', uploadToken: 'token', disableRawMedia: 'false' });
    expect(result).toMatchObject({ success: false, message: 'disableRawMedia must be a boolean' });
    expect(sdk.startRecording).not.toHaveBeenCalled();
  } finally {
    errorLog.mockRestore();
  }
});

test.each([
  { windowId: 'window', message: 'Recording started' },
  { windowId: 'window', message: 'Recording started', to: 'participant', pin: false },
  { windowId: 'window', message: 'x'.repeat(4096), to: 'everyone', pin: true },
])('forwards supported chat options without changing defaults', async config => {
  await expect(client.sendChatMessage(config)).resolves.toMatchObject({ success: true });
  expect(sdk.sendChatMessage).toHaveBeenCalledWith(config);
});

test.each([
  null,
  {},
  { windowId: '', message: 'hello' },
  { windowId: 'window', message: '' },
  { windowId: 'window', message: 42 },
  { windowId: 'window', message: 'x'.repeat(4097) },
  { windowId: 'window', message: 'hello', to: '' },
  { windowId: 'window', message: 'hello', to: 42 },
  { windowId: 'window', message: 'hello', pin: 'true' },
])('rejects malformed chat requests before calling the SDK (%#)', async request => {
  await expect(invoke(IPC_CHANNELS.SEND_CHAT_MESSAGE, request)).resolves.toMatchObject({ success: false });
  expect(sdk.sendChatMessage).not.toHaveBeenCalled();
});

test('preserves native chat failures in the normal API response', async () => {
  sdk.sendChatMessage.mockRejectedValueOnce(new Error('No Raw Media recording is active'));
  await expect(client.sendChatMessage({ windowId: 'window', message: 'hello' })).resolves.toEqual({
    success: false, message: 'No Raw Media recording is active',
  });
});

test('returns Windows audio devices through the normal data envelope', async () => {
  const devices = [
    { id: 'mic', name: 'USB microphone', direction: 'input' as const },
    { id: 'speakers', name: 'Speakers', direction: 'output' as const },
  ];
  sdk.listDevices.mockResolvedValueOnce(devices);
  await expect(client.listDevices()).resolves.toMatchObject({ success: true, data: devices });
  expect(sdk.listDevices).toHaveBeenCalledWith();
});

test.each([
  ['mic', 'input'],
  ['speakers', 'output'],
  [null, 'input'],
  [null, 'output'],
] as const)('selects or resets a desktop audio device (%s, %s)', async (id, direction) => {
  await expect(client.setDesktopAudioDevice(id, direction)).resolves.toMatchObject({ success: true });
  expect(sdk.setDesktopAudioDevice).toHaveBeenCalledWith(id, direction);
});

test.each([
  null,
  {},
  { id: undefined, direction: 'input' },
  { id: '', direction: 'input' },
  { id: 42, direction: 'input' },
  { id: null, direction: 'invalid' },
])('rejects malformed device requests before calling the SDK (%#)', async request => {
  await expect(invoke(IPC_CHANNELS.SET_DESKTOP_AUDIO_DEVICE, request)).resolves.toMatchObject({ success: false });
  expect(sdk.setDesktopAudioDevice).not.toHaveBeenCalled();
});

test('reports unsupported-platform device errors without rejecting the IPC call', async () => {
  sdk.listDevices.mockRejectedValueOnce(new Error('Only available on Windows'));
  sdk.setDesktopAudioDevice.mockRejectedValueOnce(new Error('Only available on Windows'));
  await expect(client.listDevices()).resolves.toEqual({ success: false, message: 'Only available on Windows' });
  await expect(client.setDesktopAudioDevice(null, 'input')).resolves.toEqual({ success: false, message: 'Only available on Windows' });
});

test('new native methods require SDK initialization', async () => {
  recallSdkStore.setSdkInitialized(false);
  const unavailable = { success: false, message: 'SDK not initialized' };
  await expect(client.sendChatMessage({ windowId: 'window', message: 'hello' })).resolves.toEqual(unavailable);
  await expect(client.listDevices()).resolves.toEqual(unavailable);
  await expect(client.setDesktopAudioDevice(null, 'input')).resolves.toEqual(unavailable);
  expect(sdk.sendChatMessage).not.toHaveBeenCalled();
  expect(sdk.listDevices).not.toHaveBeenCalled();
  expect(sdk.setDesktopAudioDevice).not.toHaveBeenCalled();
});

test('capabilities describe the bridge without calling native APIs', () => {
  expect(client.getCapabilities()).toEqual({
    disableRawMedia: true, sendChatMessage: true, listDevices: true, setDesktopAudioDevice: true,
  });
  expect(invoke).not.toHaveBeenCalled();
});

test('forwards Zoom computer-audio connection changes through IPC and stops on unsubscribe', () => {
  const rendererEvents = new EventEmitter();
  const sender = {
    id: 1,
    once: jest.fn(),
    send: jest.fn((channel: string, payload: unknown) => rendererEvents.emit(channel, {}, payload)),
  };
  invoke.mockImplementation(async (channel, request) => {
    const handler = handlers.get(channel);
    if (!handler) throw new Error(`No handler for ${channel}`);
    return handler({ sender }, request);
  });
  jest.mocked(ipcRenderer.on).mockImplementation((channel, listener) => {
    rendererEvents.on(channel, listener);
    return ipcRenderer;
  });
  jest.mocked(ipcRenderer.removeListener).mockImplementation((channel, listener) => {
    rendererEvents.removeListener(channel, listener);
    return ipcRenderer;
  });

  const received = jest.fn();
  const unsubscribe = client.addEventListener('zoom-computer-audio', payload => {
    const status: 'connected' | 'disconnected' = payload.status;
    received(payload.window.id, status);
  });
  expect(sdk.addEventListener).toHaveBeenCalledWith('zoom-computer-audio', expect.any(Function));
  const emit = sdk.addEventListener.mock.calls[0][1];
  const window = { id: 'zoom-window', platform: 'zoom' };

  for (const status of ['disconnected', 'connected'] as const) {
    emit({ window, status });
    expect(sender.send).toHaveBeenLastCalledWith('recall-desktop:event:zoom-computer-audio', { window, status });
    expect(received).toHaveBeenLastCalledWith(window.id, status);
  }

  unsubscribe();
  expect(invoke).toHaveBeenLastCalledWith(IPC_CHANNELS.UNSUBSCRIBE_EVENTS, 'zoom-computer-audio');
  emit({ window, status: 'disconnected' });
  expect(sender.send).toHaveBeenCalledTimes(2);
  expect(received).toHaveBeenCalledTimes(2);
  expect(rendererEvents.listenerCount('recall-desktop:event:zoom-computer-audio')).toBe(0);
});
