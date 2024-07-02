import { CloseOutlined } from "@ant-design/icons";
import { useKeyPress } from "ahooks";
import { useEffect, useState } from "react";

import { MediaPreviewParams } from "../common/MediaPreviewModal";
import styles from "./index.module.scss";
import MediaPreviewSwiper from "./MediaPreviewSwiper";

export const MediaPreview = () => {
  const [previewData, setPreviewData] = useState<MediaPreviewParams>();

  const handleClose = () => {
    setPreviewData(undefined);
    setTimeout(() => {
      window.electronAPI?.ipcInvoke("hideMediaPreview");
    }, 50);
  };
  useKeyPress(27, handleClose);

  useEffect(() => {
    const handlePreview = (data: MediaPreviewParams) => {
      console.log("get preview", data);
      setPreviewData(data);
    };

    const handleProtMessage = (
      event: MessageEvent<{ type: string; data: unknown }>,
    ) => {
      const { type, data } = event.data;
      switch (type) {
        case "preview":
          handlePreview(data as MediaPreviewParams);
          break;
      }
      window.electronAPI?.ipcInvoke("showMediaPreview");
    };
    window.onmessage = (event) => {
      if (event.source === window) {
        const [port] = event.ports;
        switch (event.data) {
          case "mediaPreviewPort":
            window.mediaPreviewPort = port;
            port.onmessage = handleProtMessage;
        }
      }
    };
    window.electronAPI?.ipcInvoke("getWindowPort");
  }, []);

  return (
    <div className="flex h-full w-full flex-col rounded-lg bg-[rgba(0,0,0,.45)]">
      <CloseOutlined className={styles["close-icon"]} onClick={handleClose} />
      <div className="app-drag h-[30px]"></div>
      {previewData && <MediaPreviewSwiper {...previewData}></MediaPreviewSwiper>}
    </div>
  );
};
