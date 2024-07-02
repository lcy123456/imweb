import { Platform } from "open-im-sdk-wasm";

export interface IElectronAPI {
  routePath?: string;
  getVersion: () => string;
  getPlatform: () => Platform;
  subscribe: (channel: string, callback: (...args: any[]) => void) => void;
  subscribeOnce: (channel: string, callback: (...args: any[]) => void) => void;
  unsubscribe: (channel: string, callback: (...args: any[]) => void) => void;
  unsubscribeAll: (channel: string) => void;
  ipcInvoke: <T = unknown>(channel: string, ...arg: any) => Promise<T>;
  openExternal: (src: string) => void;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
    userClick: (userID: string, groupID: string) => void;
    openHttp: (url: string) => void;
    forceUpdate: (version: string) => void;
    checkClientVersion: () => Promise<boolean | undefined>;
    versionMap: {
      webVersion: string;
    };
    notificationPort: MessagePort;
    mediaPreviewPort: MessagePort;
  }
  declare const __APP_VERSION__: string;
  interface String {
    pointLength: () => number;
    pointAt: (index: number) => string;
    pointSlice: (start: number, end?: number) => string;
  }

  interface File {
    path: string;
  }
}
