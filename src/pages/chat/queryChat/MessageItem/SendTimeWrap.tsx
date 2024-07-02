import { FC, useMemo } from "react";

import call_fail_icon from "@/assets/images/messageItem/call_fail_icon.png";
import call_fail_send from "@/assets/images/messageItem/call_fail_send.png";
import call_success_icon from "@/assets/images/messageItem/call_success_icon.png";
import call_success_send from "@/assets/images/messageItem/call_success_send.png";
import pinned_active from "@/assets/images/messageMenu/pinned_active.png";
import { CallMessagetTypes, RealCallsStatus } from "@/constants";
import { useMessageStore } from "@/store";
import { formatMessageTime } from "@/utils/imCommon";

import { BubbleWrapType, IMessageItemProps } from ".";
import { CustomElemData } from "./CustomMessageRenderer";
import styles from "./message-item.module.scss";
import MessageSuffix from "./MessageSuffix";

interface Props extends IMessageItemProps {
  className?: string;
}
const SendTimeWrap: FC<Props> = ({
  message,
  isSender,
  isSingle,
  isAbsoluteTime,
  className,
}) => {
  const { pinnedMessageList } = useMessageStore();
  const { contentType, customElem, ex, clientMsgID } = message;
  const isBubbleWrap = BubbleWrapType.includes(contentType);

  const customData = useMemo(() => {
    return JSON.parse(customElem?.data || "{}") as CustomElemData;
  }, [customElem]);

  const isCall = useMemo(() => {
    return CallMessagetTypes.includes(customData.type);
  }, [customData]);

  const getCallImg = useMemo(() => {
    const { status } = customData;
    if (isSender) {
      return status === RealCallsStatus.Success ? call_success_send : call_fail_send;
    }
    return status === RealCallsStatus.Success ? call_success_icon : call_fail_icon;
  }, [customData, isSender]);

  const exData = useMemo(() => {
    return JSON.parse(ex || "{}") as { type: string };
  }, [ex]);

  const isPinned = useMemo(() => {
    return pinnedMessageList.findIndex((v) => v.clientMsgID === clientMsgID) !== -1;
  }, [pinnedMessageList]);

  return (
    <div
      className={`${styles["time-wrap"]} ${
        (isAbsoluteTime || !isBubbleWrap) && styles["absolute-time"]
      } ${!isBubbleWrap && styles["absolute-time-bg"]} ${className}`}
    >
      {isCall && <img className="mr-1" src={getCallImg} alt="" />}
      {isPinned && <img className="mr-1" src={pinned_active} width="12"></img>}
      {exData.type === "edit" && "已编辑 "}
      {formatMessageTime(message.sendTime)}
      <MessageSuffix message={message} isSender={isSender} isSingle={isSingle} />
    </div>
  );
};

export default SendTimeWrap;
