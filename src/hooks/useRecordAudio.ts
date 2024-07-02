import Recorder from "js-audio-recorder";
import { useEffect, useRef, useState } from "react";

import { feedbackToast } from "@/utils/common";

const ErrorText = {
  NotAllowedError: "麦克风权限未打开",
};
type ErrorTextKey = keyof typeof ErrorText;

let isPermission = false;

export const useRecordAudio = () => {
  const recorder = useRef<Recorder>();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    getPermission();
  }, []);

  const getPermission = async () => {
    await (Recorder as any).getPermission();
    isPermission = true;
  };

  const initRecorder = () => {
    recorder.current = new Recorder();
    recorder.current.onprogress = function (params) {
      // console.log("录音时长(秒)", params.duration);
      // console.log("录音大小(字节)", params.fileSize);
      // console.log("录音音量百分比(%)", params.vol);
      setDuration(params.duration);
      // console.log('当前录音的总数据([DataView, DataView...])', params.data);
    };
  };

  async function start() {
    try {
      if (!isPermission) {
        await getPermission();
        return Promise.reject();
      }
      initRecorder();
      await recorder.current?.start();
    } catch (error) {
      const _error = error as { name: ErrorTextKey; message: string };
      const text = ErrorText[_error?.name] || _error?.message;
      feedbackToast({ error, msg: text });
      return Promise.reject(text);
    }
  }

  function stop() {
    setDuration(0);
    recorder.current?.stop();
  }

  function getWAVBlob(): Blob {
    setDuration(0);
    return recorder.current?.getWAVBlob() as Blob;
  }

  const getRecordAudioData = () => {
    return {
      blob: getWAVBlob(),
    };
  };

  const destroy = () => {
    recorder.current?.destroy().then(() => {
      recorder.current = undefined;
    });
  };

  return { getWAVBlob, start, stop, getRecordAudioData, duration, destroy };
};
