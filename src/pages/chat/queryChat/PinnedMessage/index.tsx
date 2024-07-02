import { MessageType } from "open-im-sdk-wasm";
import { WsResponse } from "open-im-sdk-wasm/lib/types/entity";
import { FC, useEffect, useMemo, useState } from "react";

import { apiPinnedCancelMessage } from "@/api/chatApi";
import pinned_close from "@/assets/images/chatSetting/pinned_close.png";
import { useMessageStore } from "@/store";
import { feedbackToast } from "@/utils/common";
import { formatEmoji } from "@/utils/emojis";
import emitter from "@/utils/events";
import { checkCodeStatus, formatMessageFileUrl } from "@/utils/imCommon";

import styles from "./pinnedMessage.module.scss";

const PinnedMessage: FC = () => {
  const pinnedMessageList = useMessageStore((state) => state.pinnedMessageList);
  const getPinnedMessageList = useMessageStore((state) => state.getPinnedMessageList);
  const [pinnedIndex, setPinnedIndex] = useState<number>(0);

  useEffect(() => {
    setPinnedIndex(pinnedMessageList.length - 1);
  }, [pinnedMessageList]);

  const pinnedMessage = useMemo(() => {
    return pinnedMessageList[pinnedIndex];
  }, [pinnedIndex, pinnedMessageList]);

  const _pinnedClick = () => {
    setPinnedIndex(pinnedIndex <= 0 ? pinnedMessageList.length - 1 : pinnedIndex - 1);
    emitter.emit("CHAT_LIST_SCROLL_TO_MESSAGE", pinnedMessage);
  };

  const pinnedCancelClick = async () => {
    try {
      await apiPinnedCancelMessage({
        id: pinnedMessage.id,
      });
      feedbackToast({ msg: "取消置顶成功" });
      getPinnedMessageList();
    } catch (error) {
      feedbackToast({ error, msg: checkCodeStatus((error as WsResponse).errCode) });
    }
  };

  const messageContent = () => {
    switch (pinnedMessage.contentType) {
      case MessageType.PictureMessage:
      case MessageType.VideoMessage:
        return (
          <img src={formatMessageFileUrl(pinnedMessage.content)} className="h-6"></img>
        );
      default:
        return (
          <div
            className={`${styles.content} truncate leading-6`}
            dangerouslySetInnerHTML={{ __html: formatEmoji(pinnedMessage.content) }}
          ></div>
        );
    }
  };

  return (
    <div
      onClick={_pinnedClick}
      className={`h-[50px] flex-shrink-0 ${
        !pinnedMessage && "!h-[0]"
      } cursor-pointer select-none`}
    >
      {pinnedMessage && (
        <div className="absolute left-0 right-0 flex h-[50px] items-center bg-white px-4">
          <div className="mr-4 flex h-full flex-col py-1">
            {pinnedMessageList.map((v, i) => (
              <div
                className={`my-[1px] w-[3px] flex-1 bg-gray-200 ${
                  i === pinnedIndex && "!bg-[var(--primary)]"
                }`}
                key={v.clientMsgID}
              ></div>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-sMedium text-xs text-[var(--primary)]">置顶消息</div>
            {/* <div
              className={`${styles.content} truncate`}
              dangerouslySetInnerHTML={{ __html: formatEmoji(pinnedMessage.content) }}
            ></div> */}
            {messageContent()}
          </div>
          <img
            className="ml-auto self-center"
            width={20}
            src={pinned_close}
            onClick={(e) => {
              e.stopPropagation();
              pinnedCancelClick();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PinnedMessage;
