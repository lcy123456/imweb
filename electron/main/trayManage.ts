import { app, Menu, Tray } from "electron";
import { hideWindow, showWindow } from "./windowManage";
import { join } from "node:path";
import { isMac } from "../utils";

let appTray: Tray;
let timer: NodeJS.Timeout | null = null;

export const createTray = () => {
  const trayMenu = Menu.buildFromTemplate([
    {
      label: "显示主界面",
      click: showWindow,
    },
    {
      label: "隐藏主界面",
      click: hideWindow,
    },
    {
      label: "退出",
      click: () => {
        global.forceQuit = true;
        app.quit();
      },
    },
  ]);
  appTray = new Tray(global.pathConfig.trayIcon);
  appTray.setToolTip(app.getName());
  appTray.setIgnoreDoubleClickEvents(true);
  appTray.on("right-click", () => {
    appTray.popUpContextMenu(trayMenu);
  });
  appTray.on("click", showWindow);

  // appTray.setContextMenu(trayMenu);
};

export const traySetTitle = (str) => {
  appTray.setTitle(str);
};

export const destroyTray = () => {
  if (!appTray || appTray.isDestroyed()) return;
  clearTimeout(timer);
  appTray.destroy();
  appTray = null;
};

const blinkTime = 1000;
export const traySetImage = (isBlink: boolean) => {
  if (isMac || !appTray) return;
  clearTimeout(timer);
  if (isBlink) {
    appTray.setImage(join(global.pathConfig.publicPath, "/icons/tray_clear.png"));
    timer = setTimeout(() => {
      appTray.setImage(global.pathConfig.trayIconTip);
      timer = setTimeout(() => {
        traySetImage(true);
      }, blinkTime);
    }, blinkTime);
    return;
  }
  appTray.setImage(global.pathConfig.trayIcon);
};
