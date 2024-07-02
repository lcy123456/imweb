import { app, Menu } from "electron";
import { isMac } from "../utils";
import {
  openMainTools,
  openNotificationTools,
  openMediaPreviewDevTools,
} from "./windowManage";

const createAppMenu = () => {
  const template: Electron.MenuItemConstructorOptions[] = [];
  if (isMac) {
    template.push(
      {
        label: app.getName(),
        submenu: [
          { label: "关于", role: "about" },
          { type: "separator" },
          { label: "隐藏", role: "hide" },
          { type: "separator" },
          { label: "复制", accelerator: "CmdOrCtrl+C", role: "copy" },
          { label: "粘贴", accelerator: "CmdOrCtrl+V", role: "paste" },
          { label: "剪切", accelerator: "CmdOrCtrl+X", role: "cut" },
          { label: "撤销", accelerator: "CmdOrCtrl+Z", role: "undo" },
          { label: "重做", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
          { label: "全选", accelerator: "CmdOrCtrl+A", role: "selectAll" },
          {
            label: "退出",
            accelerator: "Command+Q",
            click: () => {
              global.forceQuit = true;
              app.quit();
            },
          },
        ],
      },
      {
        label: "窗口",
        role: "window",
        submenu: [
          { label: "最小化", role: "minimize", accelerator: "Command+W" },
          { label: "关闭", role: "close" },
        ],
      },
    );
  }
  template.push({
    label: "开发者工具",
    submenu: [
      {
        label: "Main",
        accelerator: "Alt+CmdOrCtrl+I",
        click: openMainTools,
      },
      {
        label: "Notification",
        accelerator: "Alt+CmdOrCtrl+J",
        click: openNotificationTools,
      },
      {
        label: "MediaPreview",
        accelerator: "Alt+CmdOrCtrl+K",
        click: openMediaPreviewDevTools,
      },
    ],
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

export default createAppMenu;
