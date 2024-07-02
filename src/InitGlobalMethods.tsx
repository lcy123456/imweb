import { useLatest } from "ahooks";
import { Modal } from "antd";
import { useEffect } from "react";

import { getAppVersionConfig } from "@/api/login";

import { useUserStore } from "./store";
import emitter from "./utils/events";

let modalInstance: {
  destroy: () => void;
} | null;
let clientVersionTimer: NodeJS.Timeout;
let refreshWindowTimer: NodeJS.Timeout;

const InitGlobalMethods = () => {
  const {
    packVersion,
    updateAppVersionConfig,
    updateAppSettings,
    updatePackVersion,
    getThirdConfig,
  } = useUserStore();
  const latestPackVersion = useLatest(packVersion);

  useEffect(() => {
    const { electronAPI, open } = window;

    const initSettingStore = async () => {
      if (!electronAPI) return;
      updateAppSettings({
        closeAction:
          (await electronAPI.ipcInvoke("getKeyStore", {
            key: "closeAction",
          })) || "miniSize",
      });
    };

    const customMethods = () => {
      String.prototype.pointLength = function () {
        let len = 0;
        for (let i = 0; i < this.length; ) {
          len++;
          const point = this.codePointAt(i) || 0;
          i += point > 0xffff ? 2 : 1;
        }
        return len;
      };
      String.prototype.pointAt = function (index: number) {
        let curIndex = 0;
        for (let i = 0; i < this.length; ) {
          if (curIndex === index) {
            const point = this.codePointAt(i) || 0;
            return String.fromCodePoint(point);
          }
          curIndex++;
          const point = this.codePointAt(i) || 0;
          i += point > 0xffff ? 2 : 1;
        }
        return "";
      };
      String.prototype.pointSlice = function (start: number, end?: number) {
        end = end ?? this.pointLength();
        let result = "";
        for (let i = start; i < end; i++) {
          result += this.pointAt(i);
        }
        return result;
      };
    };

    const checkClientVersion = async () => {
      const res = await getAppVersionConfig();
      res.data.updateLog = res.data.updateLog.split("\n").join("<br>");
      updateAppVersionConfig(res.data);
      const { version, updateLog } = res.data;
      const versionNum = Number(version.split(".").join(""));

      if (electronAPI) {
        const packVersion = latestPackVersion.current;
        const packVersionNum = Number(packVersion.split(".").join(""));
        console.log(`远端版本: ${version}; 本地版本：${packVersion}`);
        if (versionNum > packVersionNum) {
          emitter.emit("AUTO_UPDATER", version);
          return true;
        }
      } else {
        const { webVersion: docWebVersion } = window.versionMap;
        const docWebVersionNum = Number(docWebVersion.split(".").join(""));
        console.log(`远端版本: ${version}; 本地版本: ${docWebVersion}`);
        if (versionNum > docWebVersionNum && !modalInstance) {
          modalInstance = Modal.confirm({
            title: "新版本更新",
            content: (
              <div
                dangerouslySetInnerHTML={{
                  __html: `新版本已发布，确定后更新最新版本<br>${updateLog}`,
                }}
              ></div>
            ),
            onOk: () => window.location.reload(),
            onCancel: () => {
              modalInstance = null;
            },
          });
          return true;
        }
      }
      return false;
    };

    getThirdConfig();

    const refreshWindow = () => {
      clearTimeout(refreshWindowTimer);
      refreshWindowTimer = setTimeout(() => {
        window.location.reload();
      }, 1 * 3600 * 1000);
    };

    if (!electronAPI || !electronAPI.routePath) {
      initSettingStore();
      updatePackVersion();
      clientVersionTimer = setInterval(checkClientVersion, 2 * 60 * 1000);
      checkClientVersion();
      customMethods();

      if (electronAPI) {
        window.checkClientVersion = checkClientVersion;
        window.openHttp = electronAPI.openExternal;
        window.forceUpdate = (version: string) => {
          emitter.emit("AUTO_UPDATER", version);
        };
      } else {
        document.documentElement.style.setProperty("--searchbar-height", "0");
        window.openHttp = (url) => {
          open(url, "_blank");
        };
      }
    }

    refreshWindow();
    window.addEventListener("click", refreshWindow);
    return () => {
      clearInterval(clientVersionTimer);
      window.removeEventListener("click", refreshWindow);
    };
  }, []);
  return <></>;
};

export default InitGlobalMethods;
