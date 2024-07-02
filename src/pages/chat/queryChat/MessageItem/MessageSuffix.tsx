import { MessageStatus } from "open-im-sdk-wasm";
import { FC, useMemo } from "react";

import no_read_status from "@/assets/images/messageItem/no_read_status.png";
import read_status from "@/assets/images/messageItem/read_status.png";
import send_status from "@/assets/images/messageItem/send_status.gif";

import { IMessageItemProps } from ".";
import styles from "./message-item.module.scss";

const MessageSuffix: FC<IMessageItemProps> = ({ message, isSender, isSingle }) => {
  const { attachedInfoElem } = message;
  const showIcon = useMemo(() => {
    if (isSender && message.status !== MessageStatus.Failed) return true;
    return false;
  }, [isSender, message.status]);

  const iconImg = useMemo(() => {
    if (message.status === MessageStatus.Sending) return send_status;
    else if (message.isRead || attachedInfoElem?.groupHasReadInfo?.hasReadCount > 0) {
      return read_status;
    }
    return no_read_status;
  }, [message]);

  return (
    <div className={styles.suffix}>
      {showIcon && <img src={iconImg} alt="" width={16} />}
    </div>
  );
};

export default MessageSuffix;
