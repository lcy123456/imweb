import { app } from "electron";
import { isExistMainWindow, showWindow } from "./windowManage";
import { join } from "node:path";
import { isMac, isProd, isWin } from "../utils";
import { getStore } from "./storeManage";

const store = getStore();

app.commandLine.appendSwitch("wm-window-animations-disabled");
export const setSingleInstance = () => {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
  }

  app.on("second-instance", () => {
    showWindow();
  });
};

export const setAppListener = (startApp: () => void) => {
  app.on("ready", () => {
    isWin && app.setAppUserModelId("MuskIM");
  });
  app.on("activate", () => {
    if (isExistMainWindow()) {
      showWindow();
    } else {
      startApp();
    }
  });

  app.on("window-all-closed", () => {
    if (isMac && !getIsForceQuit()) return;

    app.quit();
  });
};

export const setAppGlobalData = () => {
  const electronDistPath = join(__dirname, "../");
  const distPath = join(electronDistPath, "../dist");
  const publicPath = isProd ? distPath : join(electronDistPath, "../public");
  global.pathConfig = {
    electronDistPath,
    distPath,
    publicPath,
    trayIcon: join(
      publicPath,
      `/icons/${isWin ? "tray@2x.png" : "icon_16x16Template@2x.png"}`,
    ),
    trayIconTip: join(
      publicPath,
      `/icons/${isWin ? "tray@2x_tip.png" : "icon_16x16Template@2x.png"}`,
    ),
    indexHtml: join(distPath, "index.html"),
    notificationHtml: join(publicPath, "notificationPage/index.html"),
    preload: join(__dirname, "../preload/index.js"),
    mediaPreviewPreload: join(__dirname, "../preload/mediaPreviewPreload.js"),
  };
};

export const getIsForceQuit = () =>
  store.get("closeAction") === "quit" || global.forceQuit;
