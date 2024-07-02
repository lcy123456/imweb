import { useLongPress, useThrottle } from "ahooks";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { v4 as uuidV4 } from "uuid";

import { useRecordAudio } from "@/hooks/useRecordAudio";
import { ExMessageItem } from "@/store";
import { feedbackToast, secondsToMS } from "@/utils/common";

import { SendMessageParams } from "../useSendMessage";

interface Props {
  sendMessage: (params: SendMessageParams) => Promise<void>;
  createFileMessage: (file: File, duration?: number) => Promise<ExMessageItem>;
  isRecordAudio: boolean;
  setIsRecordAudio: (val: boolean) => void;
  isRecordCancel: boolean;
  setIsRecordCancel: (val: boolean) => void;
  getTypingMessage: (val: string) => void;
  wrapClassName?: string;
}
const SendRecordAudio = (props: Props) => {
  const {
    sendMessage,
    createFileMessage,
    isRecordAudio,
    isRecordCancel,
    setIsRecordAudio,
    setIsRecordCancel,
    getTypingMessage,
    wrapClassName,
  } = props;
  const {
    start: handleStartRecord,
    getRecordAudioData,
    stop: handleStopRecord,
    destroy: handleDestroyRecord,
    duration,
  } = useRecordAudio();
  const throttledDuration = useThrottle(duration, {
    wait: 1000,
  });

  const recorderBtnRef = useRef<HTMLDivElement>(null);
  useLongPress(() => handleRecorder(true), recorderBtnRef, {
    onClick: () => handleRecorder(false),
  });

  const handleRecorder = async (start: boolean) => {
    if (!start) {
      feedbackToast({ error: "长按开始录音", msg: "长按开始录音" });
      return;
    }
    await handleStartRecord();
    setIsRecordAudio(true);
  };

  useEffect(() => {
    const handleMouseUp = async () => {
      try {
        if (!isRecordAudio) return;
        if (isRecordCancel) {
          handleStopRecord();
          return;
        }
        const { blob } = getRecordAudioData();
        console.log("duration", duration);
        if (duration < 2) {
          feedbackToast({ error: "录音时长不小于2s", msg: "录音时长不小于2s" });
          return;
        }
        const file = new File([blob], `${uuidV4()}.wav`, {
          type: blob.type,
        });
        const message = await createFileMessage(file, Math.ceil(duration));
        sendMessage({ message });
      } finally {
        setIsRecordAudio(false);
        setIsRecordCancel(false);
        handleDestroyRecord();
      }
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isRecordAudio, isRecordCancel, duration]);

  useEffect(() => {
    if (!throttledDuration) return;
    getTypingMessage("正在说话中...");
  }, [throttledDuration]);

  return (
    <div className={clsx(wrapClassName, "flex select-none items-center")}>
      {isRecordAudio && (
        <>
          <div className="mr-2 h-2 w-2 rounded-lg bg-red-500"></div>
          <div className="font-sBold">{secondsToMS(Math.floor(duration))}</div>
        </>
      )}
      <div
        ref={recorderBtnRef}
        className="h-[46px] w-[46px] cursor-pointer
          bg-[url('@/assets/images/chatFooter/record_audio.png')] 
          bg-[length:20px_24px]
          bg-center bg-no-repeat 
          hover:bg-[url('@/assets/images/chatFooter/record_audio_active.png')]
          hover:bg-[length:36px_36px]"
      ></div>
    </div>
  );
};

export default SendRecordAudio;
