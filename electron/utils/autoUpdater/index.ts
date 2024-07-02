import { BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import log from "../log";

const server = "https://doc.muskim.com";

const statusMap = {
  error: { status: -1, message: "更新出错" },
  checking: { status: 0, message: "正在检查更新..." },
  updateAvailable: { status: 1, message: "检测到新版本，准备开始下载..." },
  downloadProgress: { status: 2, message: "新版本正在下载..." },
  updateDownloaded: { status: 3, message: "新版本已下载成功，确定后安装最新版本" },
  updateNotAvailable: { status: 4, message: "已经是最新版本" },
};

export const handleUpdate = (mainWindow: BrowserWindow) => {
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;

  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for update...");
    sendUpdateStatus(statusMap.checking);
  });
  autoUpdater.on("update-available", (info) => {
    console.log("Update available.", info);
    sendUpdateStatus(statusMap.updateAvailable);
    autoUpdater.downloadUpdate();
  });
  autoUpdater.on("update-not-available", (info) => {
    console.log("Update not available.", info);
    sendUpdateStatus(statusMap.updateNotAvailable);
  });
  autoUpdater.on("error", (err) => {
    console.log("Error in auto-updater. " + err);
    sendUpdateStatus({
      ...statusMap.error,
      message: "更新出错：" + err,
    });
  });
  autoUpdater.on("download-progress", (progressInfo) => {
    let log_message = "Download speed: " + progressInfo.bytesPerSecond;
    log_message = log_message + " - Downloaded " + progressInfo.percent + "%";
    log_message =
      log_message + " (" + progressInfo.transferred + "/" + progressInfo.total + ")";
    console.log(log_message);
    sendUpdateStatus({ ...statusMap.downloadProgress, progressInfo });
  });
  autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded", info);
    sendUpdateStatus(statusMap.updateDownloaded);
  });

  function sendUpdateStatus(data) {
    mainWindow.webContents.send("updaterStatus", data);
  }
};

export const setFeedURL = (version) => {
  const url = `${server}/${process.platform}/${version}`;
  autoUpdater.setFeedURL(url);
  checkForUpdates();
};

export const checkForUpdates = () => {
  autoUpdater.checkForUpdates();
};

export const quitAndInstall = () => {
  global.forceQuit = true;
  global.mainWindow.setClosable(true);
  autoUpdater.quitAndInstall();
};

export default autoUpdater;
