import { useThrottleFn } from "ahooks";
import { Spin } from "antd";
import { CbEvents, MessageStatus } from "open-im-sdk-wasm";
import { WSEvent } from "open-im-sdk-wasm/lib/types/entity";
import { FC, useEffect, useMemo, useRef, useState } from "react";

import file_icon from "@/assets/images/messageItem/file_icon.png";
import { IMSDK } from "@/layout/MainContentWrap";
import { ExMessageItem, useConversationStore, useMessageStore } from "@/store";
import FileDownloadIcon from "@/svg/FileDownloadIcon";
import {
  bytesToSize,
  downloadATag,
  downloadFileApi,
  feedbackToast,
} from "@/utils/common";
import emitter from "@/utils/events";
import { formatMessageFileUrl } from "@/utils/imCommon";

import { IMessageItemProps } from ".";

type DownloadState = "downloading" | "pause" | "resume" | "cancel" | "finish";
interface ExParams {
  savePath: string;
  saveHash: string;
}

const FileMessageRenderer: FC<IMessageItemProps> = ({
  message,
  isChatContainer,
  updateMessage,
}) => {
  const { updateOneMessage } = useMessageStore();
  const { fileElem, localEx } = message;
  const { fileName, fileSize, sourceUrl } = fileElem;
  const [exTemp, setExTemp] = useState("{}");
  const [progress, setProgress] = useState(0);
  const [downloadState, setDownloadState] = useState<DownloadState>("cancel");
  const isSending = message.status === MessageStatus.Sending;
  const isSucceed = message.status === MessageStatus.Succeed;

  const downloadManager = useRef<ReturnType<typeof downloadFileApi> | null>(null);

  const fileUrl = useMemo(() => {
    return formatMessageFileUrl(sourceUrl);
  }, [sourceUrl]);

  const exParse = useMemo(() => {
    if (isChatContainer) return JSON.parse(localEx || "{}") as ExParams;
    return JSON.parse(exTemp) as ExParams;
  }, [localEx, exTemp]);

  useEffect(() => {
    const uploadHandle = ({
      data: { clientMsgID, progress },
    }: WSEvent<{ clientMsgID: string; progress: number }>) => {
      if (clientMsgID === message.clientMsgID) {
        setProgress(progress);
        if (progress === 100) {
          setTimeout(() => {
            setProgress(0);
          }, 1000);
        }
      }
    };
    IMSDK.on(CbEvents.OnProgress, uploadHandle);
    return () => {
      IMSDK.off(CbEvents.OnProgress, uploadHandle);
      downloadManager.current?.cancel();
    };
  }, []);

  useEffect(() => {
    const handleDownload = (clientMsgID: string) => {
      clientMsgID === message.clientMsgID && handleClick(true);
    };
    emitter.on("MESSAGE_SAVEAS_FILE", handleDownload);
    return () => {
      emitter.off("MESSAGE_SAVEAS_FILE", handleDownload);
    };
  }, [fileElem, exParse]);

  const handleClick = async (isSaveAs = false) => {
    if (!fileUrl) return;
    if (!window.electronAPI) {
      downloadATag(fileUrl, fileName);
      return;
    }
    const { savePath, saveHash } = exParse;
    if (savePath && saveHash) {
      const isExists = await window.electronAPI.ipcInvoke("compareFiles", {
        filePath: savePath,
        fileHash: saveHash,
      });
      if (isExists) {
        isSaveAs
          ? handleSaveAs(savePath)
          : window.electronAPI.ipcInvoke("previewFile", savePath);
        return;
      }
    }
    tryDownload(isSaveAs);
  };

  const tryDownload = (isSaveAs = false) => {
    const isOk = downloadManager?.current?.getIsOk();
    if (!downloadManager.current || downloadState === "cancel" || isOk) {
      setDownloadState("downloading");
      downloadManager.current = downloadFileApi({
        filename: fileName,
        fileUrl: fileUrl,
        isATag: false,
        onProgress: run,
        onDone: (blob: Blob) => onDone({ blob, isSaveAs }),
      });
    }

    if (downloadState === "downloading" || downloadState === "resume") {
      setDownloadState("pause");
      downloadManager.current.pause();
    }

    if (downloadState === "pause") {
      setDownloadState("resume");
      downloadManager.current.resume();
    }
  };

  const downloadProgressCb = (downloadProgress: number) => {
    setProgress(downloadProgress);
    if (downloadProgress === 100) {
      setTimeout(() => setDownloadState("finish"), 1000);
    }
  };

  const { run } = useThrottleFn(downloadProgressCb, { wait: 1000 });

  const onDone = async (params: { blob: Blob; isSaveAs: boolean }) => {
    const { blob, isSaveAs } = params;
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const { savePath, saveHash } = (await window.electronAPI?.ipcInvoke("cacheFile", {
      fileName,
      uint8Array,
    })) as { savePath: ""; saveHash: "" };
    if (savePath && saveHash) {
      const { currentConversation } = useConversationStore.getState();
      const newEx = JSON.stringify({
        ...exParse,
        savePath,
        saveHash,
      });
      currentConversation &&
        IMSDK.setMessageLocalEx({
          conversationID: currentConversation.conversationID,
          clientMsgID: message.clientMsgID,
          localEx: newEx,
        });
      updateOneMessage({
        ...message,
        localEx: newEx,
      });
      updateMessage?.({
        ...message,
        localEx: newEx,
      });
      if (!isChatContainer) {
        setExTemp(newEx);
        // handleSaveAs({ fileName, uint8Array });
        window.electronAPI?.ipcInvoke("previewFile", savePath);
        return;
      }
      isSaveAs && handleSaveAs(savePath);
    }
  };
  const handleSaveAs = async (data: string) => {
    try {
      await window.electronAPI?.ipcInvoke("saveAsFile", data);
      feedbackToast({ msg: "文件保存成功" });
    } catch {
      feedbackToast({ msg: "文件保存失败" });
    }
  };

  return (
    <Spin spinning={isSending}>
      <div className="flex w-60 items-center justify-between break-all rounded-md border border-[var(--gap-text)] bg-white p-3">
        <div className="flex h-full flex-col justify-between">
          <div>{fileName}</div>
          <div className="text-xs text-[var(--sub-text)]">{bytesToSize(fileSize)}</div>
        </div>
        <div
          className="relative min-w-[38px] cursor-pointer"
          onClick={() => handleClick()}
        >
          <img width={38} src={file_icon} alt="file" />
          {isSucceed &&
            downloadState !== "finish" &&
            (!exParse.savePath || ![0, 100].includes(progress)) && (
              <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center rounded-md bg-[rgba(0,0,0,.4)]">
                <FileDownloadIcon
                  pausing={downloadState === "pause"}
                  percent={progress}
                />
              </div>
            )}
        </div>
      </div>
    </Spin>
  );
};

export default FileMessageRenderer;
