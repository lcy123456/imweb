import { app, ipcMain } from "electron";
import {
  closeWindow,
  minimize,
  updateMaximize,
  showWindow,
  setBadgeCount,
  blinkWindow,
  handleWindowPort,
  notificationShow,
  notificationHide,
  notificationHeight,
  mediaPreviewShow,
  mediaPreviewHide,
} from "./windowManage";
import { IpcRenderToMain } from "../constants";
import { getStore } from "./storeManage";
import { setFeedURL, quitAndInstall } from "../utils/autoUpdater";
import {
  cacheFile,
  compareFiles,
  saveAsFile,
  previewFile,
  log,
  getFile,
} from "../utils";
import { traySetImage } from "./trayManage";

const store = getStore();

export const setIpcMainListener = () => {
  // window manage
  ipcMain.handle(IpcRenderToMain.showWindow, showWindow);
  ipcMain.handle(IpcRenderToMain.minimizeWindow, minimize);
  ipcMain.handle(IpcRenderToMain.maxmizeWindow, updateMaximize);
  ipcMain.handle(IpcRenderToMain.closeWindow, closeWindow);
  ipcMain.handle(IpcRenderToMain.updateBadge, (_, { count }) => {
    setBadgeCount(count);
  });
  ipcMain.handle(IpcRenderToMain.blinkWindow, (_, val) => {
    traySetImage(val);
    blinkWindow(val);
  });
  ipcMain.handle(IpcRenderToMain.getWindowPort, handleWindowPort);

  // autoUpdater
  ipcMain.handle(IpcRenderToMain.autoUpdater, (_, version) => {
    setFeedURL(version);
  });
  ipcMain.handle(IpcRenderToMain.quitAndInstall, quitAndInstall);

  // notificationWindow
  ipcMain.handle(IpcRenderToMain.showNotification, notificationShow);
  ipcMain.handle(IpcRenderToMain.hideNotification, notificationHide);
  ipcMain.handle(IpcRenderToMain.heightNotification, (_, height) => {
    notificationHeight(height);
  });

  // mediaPreviewWindow
  ipcMain.handle(IpcRenderToMain.showMediaPreview, mediaPreviewShow);
  ipcMain.handle(IpcRenderToMain.hideMediaPreview, mediaPreviewHide);

  // data transfer
  ipcMain.handle(IpcRenderToMain.setKeyStore, (_, { key, data }) => {
    store.set(key, data);
  });
  ipcMain.handle(IpcRenderToMain.getKeyStore, (e, { key }) => {
    return store.get(key);
  });
  ipcMain.handle(IpcRenderToMain.deleteKeyStore, (e, { key }) => {
    return store.delete(key);
  });
  ipcMain.handle(IpcRenderToMain.getPackVersion, () => {
    return app.getVersion();
  });

  // file handle
  ipcMain.handle(IpcRenderToMain.compareFiles, async (e, params) => {
    return await compareFiles(params);
  });
  ipcMain.handle(IpcRenderToMain.previewFile, async (e, params) => {
    return await previewFile(params);
  });
  ipcMain.handle(IpcRenderToMain.saveAsFile, async (e, params) => {
    try {
      return await saveAsFile(params);
    } catch (err) {
      log.error(err);
    }
  });
  ipcMain.handle(IpcRenderToMain.cacheFile, async (e, params) => {
    try {
      return await cacheFile(params);
    } catch (err) {
      log.error(err);
    }
  });
  ipcMain.handle(IpcRenderToMain.getFile, async (e, params) => {
    try {
      return await getFile(params);
    } catch (err) {
      log.error(err);
      throw new Error(err);
    }
  });
};
