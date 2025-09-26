/**
 * ToDesktop Recall Desktop SDK Plugin - Main Process
 *
 * This file runs in Electron's main process and handles:
 * - Recall Desktop SDK integration and lifecycle management
 * - IPC communication with renderer processes
 * - Meeting detection and recording management
 * - Event forwarding from SDK to frontend
 */

import { ipcMain } from "electron";
import {
  IPC_CHANNELS,
  ApiResponse,
  PluginStatus,
  RecallSdkError,
  StartRecordingRequest,
  StopRecordingRequest,
  PauseRecordingRequest,
  ResumeRecordingRequest,
  UploadRecordingRequest,
  PermissionType,
  SdkInitOptions,
  PrepareDesktopAudioResponse,
  RecallSdkConfig,
  RecallSdkEventType,
  PluginContext,
} from "./shared";
import { recallSdkStore, setPluginContext } from "./store";
import RecallAiSdk from "@recallai/desktop-sdk";

class RecallDesktopMain {
  private version = "1.0.0";
  private isInitialized = false;
  private subscriptions: Map<RecallSdkEventType, Map<number, number>> =
    new Map();
  private trackedWebContents = new Map<number, Electron.WebContents>();
  private sdkEventHandlers = new Map<RecallSdkEventType, (evt: any) => void>();
  private readonly eventSideEffects: Partial<
    Record<RecallSdkEventType, (evt: any) => void>
  > = {
    shutdown: () => {
      recallSdkStore.clearState();
    },
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!recallSdkStore.isEnabled()) {
      console.log("RecallDesktopMain: Plugin is disabled");
      return;
    }

    try {
      // Initialize plugin store
      await recallSdkStore.initialize();

      // Register IPC handlers
      this.registerIpcHandlers();

      // SDK will now be initialized on-demand via IPC

      this.isInitialized = true;
      console.log("RecallDesktopMain: Main process initialized");
    } catch (error) {
      console.error(
        "RecallDesktopMain: Failed to initialize main process:",
        error
      );
      throw error;
    }
  }

  private async initializeSdk(): Promise<void> {
    try {
      const config = recallSdkStore.getConfig();

      const sdkOptions: SdkInitOptions = {
        apiUrl: config.apiUrl,
        acquirePermissionsOnStartup: config.requestPermissionsOnStartup
          ? ["accessibility", "screen-capture", "microphone", "system-audio"]
          : undefined,
        restartOnError: true,
      };

      console.log("RecallDesktopMain: SDK options:", sdkOptions);

      // Initialize the Recall SDK
      await RecallAiSdk.init(sdkOptions);

      recallSdkStore.setSdkInitialized(true);
      console.log("RecallDesktopMain: SDK initialized successfully");
    } catch (error) {
      console.error("RecallDesktopMain: Failed to initialize SDK:", error);
      throw new RecallSdkError("SDK initialization failed", "SDK_INIT_ERROR");
    }
  }

  private broadcastEvent(type: RecallSdkEventType, data: any): void {
    const channel = `recall-desktop:event:${type}`;
    const subs = this.subscriptions.get(type);
    if (!subs) return;
    subs.forEach((_count, wcId) => {
      const wc = this.trackedWebContents.get(wcId);
      if (!wc) return;
      try {
        wc.send(channel, data);
      } catch (err) {
        console.error(
          "RecallDesktopMain: Failed to send event to webContents",
          wcId,
          err
        );
      }
    });
  }

  private ensureSdkListener(eventType: RecallSdkEventType): void {
    if (this.sdkEventHandlers.has(eventType)) {
      return;
    }

    const handler = (evt: any) => {
      this.handleSdkEvent(eventType, evt);
    };

    this.sdkEventHandlers.set(eventType, handler);
    RecallAiSdk.addEventListener(eventType as any, handler);
  }

  private handleSdkEvent(eventType: RecallSdkEventType, evt: any): void {
    if (eventType === "error") {
      console.error("RecallDesktopMain: SDK error:", evt);
    } else {
      console.log(`RecallDesktopMain: ${eventType}`, evt);
    }

    const sideEffect = this.eventSideEffects[eventType];
    if (sideEffect) {
      try {
        sideEffect(evt);
      } catch (error) {
        console.error(
          "RecallDesktopMain: Side effect failed for",
          eventType,
          error
        );
      }
    }

    this.broadcastEvent(eventType, evt);
  }

  private registerIpcHandlers(): void {
    const addDestroyedCleanup = (wc: Electron.WebContents) => {
      const id = wc.id;
      if (this.trackedWebContents.has(id)) return;
      this.trackedWebContents.set(id, wc);
      wc.once("destroyed", () => {
        // Remove this wc from all subscriptions
        this.subscriptions.forEach((map) => {
          map.delete(id);
        });
        this.trackedWebContents.delete(id);
      });
    };

    // Subscribe to events
    ipcMain.handle(
      IPC_CHANNELS.SUBSCRIBE_EVENTS,
      async (event, eventType: RecallSdkEventType): Promise<ApiResponse> => {
        try {
          const wc = event.sender;
          addDestroyedCleanup(wc);
          let map = this.subscriptions.get(eventType);
          if (!map) {
            map = new Map();
            this.subscriptions.set(eventType, map);
          }
          const id = wc.id;
          const prev = map.get(id) || 0;
          map.set(id, prev + 1);
          this.ensureSdkListener(eventType);
          return { success: true, message: `Subscribed to ${eventType}` };
        } catch (error) {
          console.error("RecallDesktopMain: subscribe-events failed", error);
          return { success: false, message: "Failed to subscribe to events" };
        }
      }
    );

    // Unsubscribe from events
    ipcMain.handle(
      IPC_CHANNELS.UNSUBSCRIBE_EVENTS,
      async (event, eventType: RecallSdkEventType): Promise<ApiResponse> => {
        try {
          const wc = event.sender;
          const map = this.subscriptions.get(eventType);
          if (map) {
            const id = wc.id;
            const prev = map.get(id) || 0;
            if (prev <= 1) map.delete(id);
            else map.set(id, prev - 1);
          }
          return { success: true, message: `Unsubscribed from ${eventType}` };
        } catch (error) {
          console.error("RecallDesktopMain: unsubscribe-events failed", error);
          return {
            success: false,
            message: "Failed to unsubscribe from events",
          };
        }
      }
    );
    // Initialize SDK
    ipcMain.handle(IPC_CHANNELS.INIT_SDK, async (): Promise<ApiResponse> => {
      try {
        if (!recallSdkStore.isEnabled()) {
          throw new RecallSdkError("Plugin is disabled", "PLUGIN_DISABLED");
        }

        if (recallSdkStore.isSdkInitialized()) {
          return { success: true, message: "SDK already initialized" };
        }

        await this.initializeSdk();
        return { success: true, message: "SDK initialized successfully" };
      } catch (error) {
        console.error("RecallDesktopMain: SDK initialization failed:", error);
        return {
          success: false,
          message:
            error instanceof RecallSdkError
              ? error.message
              : "SDK initialization failed",
        };
      }
    });

    // Shutdown SDK
    ipcMain.handle(
      IPC_CHANNELS.SHUTDOWN_SDK,
      async (): Promise<ApiResponse> => {
        try {
          await (RecallAiSdk.shutdown as any)();
          recallSdkStore.clearState();
          return { success: true, message: "SDK shutdown successfully" };
        } catch (error) {
          console.error("RecallDesktopMain: SDK shutdown failed:", error);
          return { success: false, message: "SDK shutdown failed" };
        }
      }
    );

    // Get plugin status
    ipcMain.handle(IPC_CHANNELS.GET_STATUS, async (): Promise<PluginStatus> => {
      return {
        initialized: this.isInitialized,
        sdkInitialized: recallSdkStore.isSdkInitialized(),
        version: this.version,
        config: recallSdkStore.getConfig(),
      };
    });

    // Start recording
    ipcMain.handle(
      IPC_CHANNELS.START_RECORDING,
      async (event, request: StartRecordingRequest): Promise<ApiResponse> => {
        try {
          if (!recallSdkStore.isSdkInitialized()) {
            throw new RecallSdkError(
              "SDK not initialized",
              "SDK_NOT_INITIALIZED"
            );
          }

          await (RecallAiSdk.startRecording as any)({
            windowId: request.windowId,
            uploadToken: request.uploadToken,
          });
          return { success: true, message: "Recording started successfully" };
        } catch (error) {
          console.error("RecallDesktopMain: Start recording failed:", error);
          return {
            success: false,
            message:
              error instanceof RecallSdkError
                ? error.message
                : "Failed to start recording",
          };
        }
      }
    );

    // Stop recording
    ipcMain.handle(
      IPC_CHANNELS.STOP_RECORDING,
      async (event, request: StopRecordingRequest): Promise<ApiResponse> => {
        try {
          await (RecallAiSdk.stopRecording as any)({
            windowId: request.windowId,
          });
          return { success: true, message: "Recording stopped successfully" };
        } catch (error) {
          console.error("RecallDesktopMain: Stop recording failed:", error);
          return { success: false, message: "Failed to stop recording" };
        }
      }
    );

    // Pause recording
    ipcMain.handle(
      IPC_CHANNELS.PAUSE_RECORDING,
      async (event, request: PauseRecordingRequest): Promise<ApiResponse> => {
        try {
          await (RecallAiSdk.pauseRecording as any)({
            windowId: request.windowId,
          });
          return { success: true, message: "Recording paused successfully" };
        } catch (error) {
          console.error("RecallDesktopMain: Pause recording failed:", error);
          return { success: false, message: "Failed to pause recording" };
        }
      }
    );

    // Resume recording
    ipcMain.handle(
      IPC_CHANNELS.RESUME_RECORDING,
      async (event, request: ResumeRecordingRequest): Promise<ApiResponse> => {
        try {
          await (RecallAiSdk.resumeRecording as any)({
            windowId: request.windowId,
          });
          return { success: true, message: "Recording resumed successfully" };
        } catch (error) {
          console.error("RecallDesktopMain: Resume recording failed:", error);
          return { success: false, message: "Failed to resume recording" };
        }
      }
    );

    // Upload recording
    ipcMain.handle(
      IPC_CHANNELS.UPLOAD_RECORDING,
      async (event, request: UploadRecordingRequest): Promise<ApiResponse> => {
        try {
          await (RecallAiSdk.uploadRecording as any)({
            windowId: request.windowId,
          });
          return {
            success: true,
            message: "Recording upload started successfully",
          };
        } catch (error) {
          console.error("RecallDesktopMain: Upload recording failed:", error);
          return { success: false, message: "Failed to upload recording" };
        }
      }
    );

    // Prepare desktop audio recording
    ipcMain.handle(
      IPC_CHANNELS.PREPARE_DESKTOP_AUDIO,
      async (): Promise<ApiResponse<PrepareDesktopAudioResponse>> => {
        try {
          const windowId = await (
            RecallAiSdk.prepareDesktopAudioRecording as any
          )();
          return {
            success: true,
            message: "Desktop audio recording prepared successfully",
            data: { windowId },
          };
        } catch (error) {
          console.error(
            "RecallDesktopMain: Prepare desktop audio failed:",
            error
          );
          return {
            success: false,
            message: "Failed to prepare desktop audio recording",
          };
        }
      }
    );

    // Request permission
    ipcMain.handle(
      IPC_CHANNELS.REQUEST_PERMISSION,
      async (event, permission: PermissionType): Promise<ApiResponse> => {
        try {
          await (RecallAiSdk.requestPermission as any)(permission);
          return {
            success: true,
            message: `Permission request sent for ${permission}`,
          };
        } catch (error) {
          console.error("RecallDesktopMain: Request permission failed:", error);
          return { success: false, message: "Failed to request permission" };
        }
      }
    );

    // Set configuration
    ipcMain.handle(
      IPC_CHANNELS.SET_CONFIG,
      async (event, config: Partial<RecallSdkConfig>): Promise<ApiResponse> => {
        try {
          recallSdkStore.setConfig(config);

          // If SDK settings changed and SDK is initialized, reinitialize
          if (
            recallSdkStore.isSdkInitialized() &&
            (config.apiUrl || config.requestPermissionsOnStartup !== undefined)
          ) {
            console.log(
              "RecallDesktopMain: Reinitializing SDK due to configuration change"
            );
            await (RecallAiSdk.shutdown as any)();
            await this.initializeSdk();
          }

          return {
            success: true,
            message: "Configuration updated successfully",
          };
        } catch (error) {
          console.error(
            "RecallDesktopMain: Failed to set configuration:",
            error
          );
          return { success: false, message: "Failed to update configuration" };
        }
      }
    );

    // Get configuration
    ipcMain.handle(
      IPC_CHANNELS.GET_CONFIG,
      async (): Promise<ApiResponse<RecallSdkConfig>> => {
        return {
          success: true,
          message: "Configuration retrieved successfully",
          data: recallSdkStore.getConfig(),
        };
      }
    );
  }
}

// Initialize plugin
export const recallDesktopMain = new RecallDesktopMain();

export default (context: PluginContext): void => {
  setPluginContext(context);
  recallDesktopMain.initialize().catch(() => undefined);
};
