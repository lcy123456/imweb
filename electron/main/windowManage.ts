import { join } from "node:path";
import {
  BrowserWindow,
  dialog,
  app,
  screen,
  MessageChannelMain,
  WebContents,
} from "electron";
import { isMac, isWin, Badge } from "../utils";
import { destroyTray } from "./trayManage";
import { getStore } from "./storeManage";
import { getIsForceQuit } from "./appManage";
import { traySetTitle } from "./trayManage";
import { handleUpdate } from "../utils/autoUpdater";
import fs from "fs";
import path from "path";

const url = process.env.VITE_DEV_SERVER_URL;
let mainWindow: BrowserWindow | null = null;
let mainBadge: Badge;
let notificationWindow: BrowserWindow | null = null;
let mediaPreviewWindow: BrowserWindow | null = null;

const store = getStore();

export function createMainWindow() {
  app.commandLine.appendSwitch("ignore-certificate-errors");
  mainWindow = new BrowserWindow({
    title: "sumi.chat-1",
    icon: isMac
      ? join(global.pathConfig.publicPath, "/icons/ico.png")
      : join(global.pathConfig.publicPath, "/icons/logo.png"),
    frame: false,
    // minWidth: 990,
    // minHeight: 700,
    width: 990,
    height: 700,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: global.pathConfig.preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
    },
  });

  if (url) {
    // Open devTool if the app is not packaged
    setTimeout(openMainTools, 2000);
    mainWindow.loadURL(url);
  } else {
    handleUpdate(mainWindow);
    mainWindow.loadFile(global.pathConfig.indexHtml);
  }

  mainWindow.on("close", (e) => {
    if (
      getIsForceQuit() ||
      !mainWindow.isVisible() ||
      store.get("closeAction") === "quit"
    ) {
      mainWindow = null;
      notificationWindow?.close();
      mediaPreviewWindow?.close();
      destroyTray();
    } else {
      e.preventDefault();
      if (isMac && mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      }
      mainWindow?.hide();
    }
  });
  mainWebContents(mainWindow.webContents);
  if (isWin) {
    mainBadge = new Badge(mainWindow, {
      font: "10px arial",
      color: "#f23c34",
    });
  }
  global.mainWindow = mainWindow;
  return mainWindow;
}

// utils
export const isExistMainWindow = (): boolean =>
  !!mainWindow && !mainWindow?.isDestroyed();

export const closeWindow = () => {
  if (!mainWindow) return;
  mainWindow.close();
};

export const showSelectDialog = async (options: Electron.OpenDialogOptions) => {
  if (!mainWindow) throw new Error("main window is undefined");
  return await dialog.showOpenDialog(mainWindow, options);
};
export const minimize = () => {
  if (!mainWindow) return;
  mainWindow.minimize();
};
export const updateMaximize = () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
};
export const toggleHide = () => {
  if (!mainWindow) return;
  mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
};
export const toggleMinimize = () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    mainWindow.restore();
    mainWindow.focus();
  } else {
    mainWindow.minimize();
  }
};
export const showWindow = () => {
  // console.log(mainWindow.isMinimized(), mainWindow.isVisible())
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
};
export const hideWindow = () => {
  if (!mainWindow) return;
  mainWindow.hide();
};
export const setBadgeCount = (count) => {
  if (isWin) {
    mainBadge.update(Number(count));
    return;
  }
  traySetTitle(count ? (Number(count) > 99 ? "99+" : count + "") : "");
  app.setBadgeCount(Number(count));
};

export const blinkWindow = (val: boolean) => {
  if (!mainWindow) return;
  mainWindow.flashFrame(val);
};

export const openMainTools = () => {
  if (!mainWindow) return;
  mainWindow.webContents.openDevTools({
    mode: "detach",
  });
};

const mainWebContents = (webContents: WebContents) => {
  webContents.on("did-fail-load", (_, errorCode) => {
    switch (errorCode) {
      case -6:
        url
          ? mainWindow.loadURL(url)
          : mainWindow.loadFile(global.pathConfig.indexHtml);
        break;
    }
  });
};

export function createNotificationWindow() {
  notificationWindow = new BrowserWindow({
    width: 320,
    height: 90,
    frame: false,
    skipTaskbar: true,
    show: false,
    transparent: true,
    roundedCorners: false,
    webPreferences: {
      preload: global.pathConfig.preload,
    },
  });
  // if (url) {
  //   setTimeout(openNotificationTools, 6000);
  // }

  notificationWindow.loadFile(global.pathConfig.notificationHtml);
  notificationWindow.setAlwaysOnTop(true, "status"); //screen-saver
  resetPosition();

  notificationWindow.on("close", (e) => {
    notificationWindow = null;
  });
}

export const openNotificationTools = () => {
  if (!notificationWindow) return;
  notificationWindow.webContents.openDevTools({
    mode: "detach",
  });
};

export const notificationShow = () => {
  // notificationWindow.show();
  notificationWindow.showInactive();
};

export const notificationHide = () => {
  notificationWindow.hide();
};

export const notificationHeight = (height: number) => {
  notificationWindow.setSize(320, height);
  resetPosition();
};

export const resetPosition = () => {
  const mainScreen = screen.getPrimaryDisplay();
  const { width, height } = mainScreen.workAreaSize;
  const notificationWindowBounds = notificationWindow.getBounds();
  const x = width - notificationWindowBounds.width - 10;
  const y = height - notificationWindowBounds.height - 10;
  notificationWindow.setPosition(x, y);
};

export function createMediaPreviewWindow() {
  mediaPreviewWindow = new BrowserWindow({
    frame: false,
    skipTaskbar: true,
    show: false,
    // titleBarStyle: "hiddenInset",
    transparent: true,
    webPreferences: {
      preload: global.pathConfig.mediaPreviewPreload,
    },
  });
  if (url) {
    // setTimeout(openMediaPreviewDevTools, 6000);
    mediaPreviewWindow.loadURL(url);
  } else {
    mediaPreviewWindow.loadFile(global.pathConfig.indexHtml);
  }
  mediaPreviewSetSize();

  mediaPreviewWindow.on("close", (e) => {
    mediaPreviewWindow = null;
  });
}

export const mediaPreviewSetSize = () => {
  const mainScreen = screen.getPrimaryDisplay();
  const { width, height } = mainScreen.workAreaSize;
  mediaPreviewWindow.setSize(width, height);
  mediaPreviewWindow.setPosition(0, 0);
};

export const mediaPreviewShow = () => {
  mediaPreviewWindow.show();
};

export const mediaPreviewHide = () => {
  mediaPreviewWindow.hide();
  mainWindow.focus();
};

export const openMediaPreviewDevTools = () => {
  if (!mediaPreviewWindow) return;
  mediaPreviewWindow.webContents.openDevTools({
    mode: "detach",
  });
};

export const handleWindowPort = () => {
  if (!mainWindow || !notificationWindow || !mediaPreviewWindow) return;
  const { port1, port2 } = new MessageChannelMain();
  mainWindow.webContents.postMessage("notificationPort", null, [port1]);
  notificationWindow.webContents.postMessage("notificationPort", null, [port2]);

  const { port1: port3, port2: port4 } = new MessageChannelMain();
  mainWindow.webContents.postMessage("mediaPreviewPort", null, [port3]);
  mediaPreviewWindow.webContents.postMessage("mediaPreviewPort", null, [port4]);
};

export const handleWriteLog = (content) => {
  const filePath = path.join(__dirname, "log.txt");
  writeFile(filePath, content)
    .then(() => console.log("文件已保存。", content))
    .catch((err) => console.error(err));
};
// 写入文件的函数
function writeFile(filePath, content) {
  return new Promise<void>((resolve, reject) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // 文件不存在，先创建文件
        fs.writeFile(filePath, content, (err) => {
          if (err) {
            console.error("创建文件失败:", err);
            reject();
          } else {
            console.log("文件创建成功:", filePath);
            resolve();
          }
        });
      } else {
        // 文件存在，追加内容
        fs.appendFile(filePath, content, (err) => {
          if (err) {
            console.error("追加内容失败:", err);
            reject();
          } else {
            console.log("内容已添加到文件:", filePath);
            resolve();
          }
        });
      }
    });
  });
}
