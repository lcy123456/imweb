import { feedbackToast } from "@/utils/common";
import emitter from "@/utils/events";

export interface CreateNotificationType {
  title?: string;
  options?: NotificationOptions & {
    faceURL?: string;
    isGroup?: boolean;
  };
}
const map: {
  [propsName: string]: Notification;
} = {};
const mapTimer: {
  [propsName: string]: NodeJS.Timeout;
} = {};
const useSystemNotification = () => {
  const getPermissionStatus = () => {
    return Notification.permission === "granted";
  };
  const askNotificationPermission = async () => {
    if (!("Notification" in window)) {
      const msg = "This browser does not support notifications.";
      feedbackToast({
        msg,
        error: msg,
      });
      throw new Error(msg);
    } else {
      await Notification.requestPermission();
      return getPermissionStatus();
    }
  };

  const createNotification = (params: CreateNotificationType = {}) => {
    if (document.visibilityState === "visible") return;
    const { options = {} } = params;
    const { tag } = options;
    if (!tag) {
      return createNotificationApi(params);
    }
    if (mapTimer[tag]) return;
    map[tag]?.close();
    const instance = createNotificationApi(params);
    if (!instance) return;
    map[tag] = instance;
    mapTimer[tag] = setTimeout(() => {
      Reflect.deleteProperty(mapTimer, tag);
    }, 5000);
  };
  const createNotificationApi = (params: CreateNotificationType = {}) => {
    const { title = "您有一条新消息", options = {} } = params;
    const defaultOptions = {
      icon: "/icons/icon.png",
      body: "您有一条新消息",
      ...options,
    };
    if (window.electronAPI) {
      window.electronAPI.ipcInvoke("blinkWindow", true);
      window.notificationPort.postMessage({
        type: "add",
        data: { title, ...defaultOptions },
      });
    } else {
      const notification = new Notification(title, defaultOptions);
      notification.onclick = function () {
        window.focus();
        emitter.emit("NOTIFICATION_CLICK", params);
      };
      return notification;
    }
  };

  const closeNotification = (tag: string) => {
    if (!map[tag]) return;
    map[tag].close();
    Reflect.deleteProperty(map, tag);
  };

  const closeAllNotification = () => {
    if (window.electronAPI) {
      window.notificationPort.postMessage({
        type: "closeAll",
        data: null,
      });
      window.electronAPI.ipcInvoke("blinkWindow", false);
      return;
    }
    const values = Object.values(map);
    values.forEach((v) => closeNotification(v.tag));
  };

  return {
    getPermissionStatus,
    askNotificationPermission,
    createNotification,
    closeNotification,
    closeAllNotification,
  };
};

export default useSystemNotification;
