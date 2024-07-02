import { FC, memo, useMemo } from "react";

import audio_call_active from "@/assets/images/messageItem/audio_call_active.png";
import audio_call_icon from "@/assets/images/messageItem/audio_call_icon.png";
import video_call_active from "@/assets/images/messageItem/video_call_active.png";
import video_call_icon from "@/assets/images/messageItem/video_call_icon.png";
import { CallMessagetTypes, RealCallsStatus, RealCallsType } from "@/constants";
import { secondsToMS } from "@/utils/common";
import emitter from "@/utils/events";

import { IMessageItemProps } from ".";
import styles from "./message-item.module.scss";

export interface CustomElemData {
  type: number;
  status: number;
  userIDs: string[];
  duration: number;
}
const CustomMessageRenderer: FC<IMessageItemProps> = ({
  message,
  isSender,
  isSingle,
}) => {
  const { customElem } = message;

  const customData = useMemo(() => {
    return JSON.parse(customElem?.data || "{}") as CustomElemData;
  }, [customElem]);

  const isCall = useMemo(() => {
    return CallMessagetTypes.includes(customData.type);
  }, [customData]);

  return (
    <div
      className={`${styles["custom-message-container"]} ${
        isCall && styles["call-message-container"]
      }`}
    >
      {isCall && (
        <CallMessageRenderer
          customData={customData}
          isSender={isSender}
          isSingle={isSingle}
        ></CallMessageRenderer>
      )}
    </div>
  );
};

const CallMessageTemp: FC<
  Partial<IMessageItemProps> & {
    customData: CustomElemData;
  }
> = ({ customData, isSender }) => {
  const { type, status, duration } = customData;
  const isVideoCall = type === RealCallsType.Video;
  const mediaText = isVideoCall ? "视频" : "语音";

  const getRenderIcon = useMemo(() => {
    let img;
    if (isSender) {
      img = isVideoCall ? video_call_active : audio_call_active;
    } else {
      img = isVideoCall ? video_call_icon : audio_call_icon;
    }
    return img;
  }, []);
  const text = useMemo(() => {
    switch (status) {
      case RealCallsStatus.Call:
        return `发起${mediaText}通话`;
      case RealCallsStatus.Reject:
        return `${isSender ? "对方" : ""}已拒绝`;
      case RealCallsStatus.Cancel:
        return `${isSender ? "" : "对方"}已取消`;
      case RealCallsStatus.Success:
        return `${mediaText}通话`;
      case RealCallsStatus.Busy:
        return `${isSender ? "对方" : ""}忙线中`;
      case RealCallsStatus.NotRes:
        return `${isSender ? "对方" : ""}未应答`;
    }
  }, [isSender]);
  return (
    <>
      <img
        className="absolute bottom-4 left-4 h-[22px] w-[22px] cursor-pointer"
        src={getRenderIcon}
        alt=""
        onClick={() => emitter.emit("SEDN_CALL_MESSAGE", type)}
      />
      <div className="text-base">
        <span>{text}</span>
        {status === RealCallsStatus.Success && (
          <span className="ml-1 text-[var(--primary)]">
            {secondsToMS(duration / 1000)}
          </span>
        )}
      </div>
    </>
  );
};
const CallMessageRenderer = memo(CallMessageTemp);

export default CustomMessageRenderer;
