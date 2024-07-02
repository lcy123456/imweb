import { useKeyPress } from "ahooks";
import { Button } from "antd";
import {
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
  useMemo,
  useState,
} from "react";

import file_icon from "@/assets/images/chatFooter/file.png";
import play_icon from "@/assets/images/messageItem/play_video.png";
import DraggableModalWrap from "@/components/DraggableModalWrap";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { bytesToSize } from "@/utils/common";

import { useFileMessage } from "../SendActionBar/useFileMessage";
import { SendMessageParams } from "../useSendMessage";

export interface PreviewFile {
  type: string;
  preview: string | File;
  key: string;
}

interface Props {
  pasteFiles: File[];
  previewFiles: PreviewFile[];
  sendMessage: (params: SendMessageParams) => Promise<void>;
  setEditorFocus: () => void;
}
const PasteFileModal: ForwardRefRenderFunction<OverlayVisibleHandle, Props> = (
  props,
  ref,
) => {
  const { pasteFiles, previewFiles, sendMessage, setEditorFocus } = props;

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const { createFileMessage } = useFileMessage();

  const modalTitle = useMemo(() => {
    const isImg = previewFiles.every((v) => v.type === "image");
    if (isImg) return "发送图片";
    const isVideo = previewFiles.every((v) => v.type === "video");
    if (isVideo) return "发送视频";
    return "发送文件";
  }, [previewFiles]);

  const handleSend = () => {
    if (!isOverlayOpen) return;
    pasteFiles.forEach(async (file) => {
      const message = await createFileMessage(file);
      sendMessage({
        message,
      });
      handleClose();
    });
  };

  const handleClose = () => {
    setEditorFocus();
    closeOverlay();
  };

  useKeyPress("enter", handleSend);

  return (
    <DraggableModalWrap
      footer={null}
      title={<div className="cursor-move">{modalTitle}</div>}
      centered
      open={isOverlayOpen}
      onCancel={handleClose}
      width={620}
      ignoreClasses=".paste_modal_container"
    >
      <div className={`paste_modal_container max-h-[80%] overflow-auto`}>
        <div className="flex flex-wrap items-center justify-center">
          {previewFiles?.map((v, i) => {
            return v.type === "file" ? (
              <FileRender key={v.key} file={v.preview as File}></FileRender>
            ) : (
              <MediaRender
                key={v.key}
                url={v.preview as string}
                type={v.type}
              ></MediaRender>
            );
          })}
        </div>
        <div className="flex justify-end px-5.5 py-2.5">
          <Button className="mr-3 px-6" onClick={closeOverlay}>
            取消
          </Button>
          <Button className="px-6" type="primary" onClick={handleSend}>
            确定
          </Button>
        </div>
      </div>
    </DraggableModalWrap>
  );
};

export default forwardRef(PasteFileModal);

const FileRender = (props: { file: File }) => {
  const { file } = props;
  return (
    <div className="m-2 flex h-[60px] w-[45%] items-center border border-gray-200 p-2">
      <img className="mr-2" width={38} src={file_icon} alt="file" />
      <div className="overflow-hidden">
        <p className="truncate font-sMedium">{file.name}</p>
        <p className="text-xs text-[var(--sub-text)]">{bytesToSize(file.size)}</p>
      </div>
    </div>
  );
};

const MediaRender = (props: { url: string; type: string }) => {
  const { url, type } = props;
  return (
    <div className="relative m-2">
      <img src={url} alt="" className="h-[160px] w-[160px] object-contain" />
      {type === "video" && (
        <img
          src={play_icon}
          width={40}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          alt="play"
        />
      )}
    </div>
  );
};
