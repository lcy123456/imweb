import { useLatest } from "ahooks";
import { Button } from "antd";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";

import DraggableModalWrap from "@/components/DraggableModalWrap";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { useUserStore } from "@/store";
import { bytesToSize } from "@/utils/common";
import emitter from "@/utils/events";

interface UpdaterStatus {
  status: number;
  message: string;
  progressInfo?: ProgressInfo;
}
interface ProgressInfo {
  bytesPerSecond: number;
  percent: number;
  total: number;
  transferred: number;
}

const AutoUpdaterModal: ForwardRefRenderFunction<OverlayVisibleHandle> = (
  props,
  ref,
) => {
  const { isOverlayOpen, closeOverlay, openOverlay } = useOverlayVisible(ref);
  const versionRef = useRef("");
  const [updaterStatus, setUpdaterStatus] = useState<UpdaterStatus>({
    status: 0,
    message: "",
  });
  const latestOverlayOpen = useLatest(isOverlayOpen);

  useEffect(() => {
    const handleOpenModal = (val: string) => {
      if (latestOverlayOpen.current) return;
      const { version, updateLog } = useUserStore.getState().appVersionConfig;
      versionRef.current = val || version;
      openOverlay();
      setUpdaterStatus({
        status: 10,
        message: `新版本已发布，确定后更新最新版本<br>${updateLog}`,
      });
    };
    const handleUpdaterStatus = (_: unknown, data: UpdaterStatus) => {
      console.log("updaterStatus", data);
      setUpdaterStatus(data);
    };
    emitter.on("AUTO_UPDATER", handleOpenModal);
    window.electronAPI?.subscribe("updaterStatus", handleUpdaterStatus);
    return () => {
      emitter.off("AUTO_UPDATER", handleOpenModal);
      window.electronAPI?.unsubscribe("updaterStatus", handleUpdaterStatus);
    };
  }, []);

  const startUpdater = () => {
    switch (updaterStatus.status) {
      case -1:
      case 4:
        closeOverlay();
        break;
      case 10:
        window.electronAPI?.ipcInvoke("autoUpdater", versionRef.current);
        break;
      case 3:
        window.electronAPI?.ipcInvoke("quitAndInstall", versionRef.current);
        setUpdaterStatus({
          status: 11,
          message:
            "正在安装最新版本，请勿关闭。安装后将自动进行应用重启（重启期间请勿重复打开，避免更新失败）",
        });
        break;
    }
  };

  return (
    <DraggableModalWrap
      footer={null}
      title="新版本更新（app）"
      open={isOverlayOpen}
      onCancel={closeOverlay}
      width={460}
      maskClosable={false}
      keyboard={false}
      closable={updaterStatus.status === 0}
      ignoreClasses=".ignore-drag"
    >
      <div className="ignore-drag">
        <div className="">
          <div dangerouslySetInnerHTML={{ __html: updaterStatus.message }}></div>
          {updaterStatus.status === 2 && updaterStatus.progressInfo && (
            <ProgressWrap progressInfo={updaterStatus.progressInfo}></ProgressWrap>
          )}
        </div>
        <div className="mt-2.5 flex justify-end">
          {updaterStatus.status === 10 && (
            <Button
              className="ml-3 border-0 bg-[var(--chat-bubble)] px-6"
              onClick={closeOverlay}
            >
              取消
            </Button>
          )}
          <Button
            disabled={![-1, 3, 4, 10].includes(updaterStatus.status)}
            className="px-6"
            type="primary"
            onClick={startUpdater}
            loading={[1, 11].includes(updaterStatus.status)}
          >
            确定
          </Button>
        </div>
      </div>
    </DraggableModalWrap>
  );
};

export default memo(forwardRef(AutoUpdaterModal));

interface ProgressWrapProps {
  progressInfo: ProgressInfo;
}
const ProgressWrap = (props: ProgressWrapProps) => {
  const { progressInfo } = props;
  const { bytesPerSecond, total, percent, transferred } = progressInfo;
  return (
    <div>
      <div>下载进度：{percent.toFixed(2)}%</div>
      <div>下载速率：{bytesToSize(bytesPerSecond)}/s</div>
      <div>已下载：{bytesToSize(transferred)}</div>
      <div>总大小：{bytesToSize(total)}</div>
    </div>
  );
};
