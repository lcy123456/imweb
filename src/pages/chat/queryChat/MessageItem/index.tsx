import { ExclamationCircleFilled } from "@ant-design/icons";
import { Checkbox } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import clsx from "clsx";
import { MessageStatus, MessageType } from "open-im-sdk-wasm";
import {
  AttachedInfoElem,
  GroupHasReadInfo,
  PublicUserItem,
  SoundElem,
} from "open-im-sdk-wasm/lib/types/entity";
import { FC, memo, useCallback, useMemo, useState } from "react";
import { v4 as uuidV4 } from "uuid";

import { apiGetMessageById } from "@/api/imApi";
import MyPopover from "@/components/MyPopover";
import OIMAvatar from "@/components/OIMAvatar";
import { _MessageType, FileMessageTypes, TextMessageTypes } from "@/constants";
import { IMSDK } from "@/layout/MainContentWrap";
import {
  ExMessageItem,
  useContactStore,
  useConversationStore,
  useMessageStore,
} from "@/store";
import { blobToFile, feedbackToast } from "@/utils/common";
import { idsGetConversationID } from "@/utils/imCommon";

import { useFileMessage } from "../ChatFooter/SendActionBar/useFileMessage";
import { useSendMessage } from "../ChatFooter/useSendMessage";
import CardMessageRenderer from "./CardMessageRenderer";
import CatchMessageRender from "./CatchMsgRenderer";
import CustomMessageRenderer from "./CustomMessageRenderer";
import FileMessageRenderer from "./FileMessageRenderer";
import GiveLikeWrap from "./GiveLikeWrap";
import LocationMessageRenderer from "./LocationMessageRenderer";
import MediaMessageRender from "./MediaMessageRender";
import MergeMessageRenderer from "./MergeMessageRenderer";
import styles from "./message-item.module.scss";
import MessageMenuContent from "./MessageMenuContent";
import QuoteMessageRenderer from "./QuoteMessageRenderer";
import SendTimeWrap from "./SendTimeWrap";
import TextMessageRender from "./TextMessageRender";
import VoiceMessageRender from "./VoiceMessageRender";

export interface IMessageItemProps {
  message: ExMessageItem;
  isSender: boolean;
  conversationID?: string;
  isSingle?: boolean;
  isActive?: boolean;
  mediaList?: ExMessageItem[];
  isAbsoluteTime?: boolean;
  isChatContainer?: boolean;
  updateMessage?: (message: ExMessageItem) => void;
}

export const MessageComponentMap: Record<number, FC<IMessageItemProps>> = {
  [MessageType.TextMessage]: TextMessageRender,
  [MessageType.AtTextMessage]: TextMessageRender,
  [MessageType.QuoteMessage]: TextMessageRender,
  [MessageType.VoiceMessage]: VoiceMessageRender,
  [MessageType.PictureMessage]: MediaMessageRender,
  [MessageType.VideoMessage]: MediaMessageRender,
  [MessageType.CardMessage]: CardMessageRenderer,
  [MessageType.FileMessage]: FileMessageRenderer,
  [MessageType.LocationMessage]: LocationMessageRenderer,
  [MessageType.MergeMessage]: MergeMessageRenderer,
  [MessageType.CustomMessage]: CustomMessageRenderer,
  [_MessageType.AdvancedMessage]: TextMessageRender,
};

export const BubbleWrapType = [
  ...TextMessageTypes,
  MessageType.CustomMessage,
  MessageType.VoiceMessage,
];

const MessageItem: FC<IMessageItemProps> = (props) => {
  const { friendList } = useContactStore();
  const { message, isSender, isSingle, conversationID, isActive } = props;
  const { pictureElem, videoElem, fileElem, soundElem } = message;
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const { isCheckMode, updateOneMessage, deleteOneMessage } = useMessageStore();
  const { sendMessage } = useSendMessage();
  const { createFileMessage } = useFileMessage();

  const [readerList, setReaderList] = useState<PublicUserItem[]>([]);

  const MessageRenderComponent = useMemo(() => {
    return MessageComponentMap[message.contentType] || CatchMessageRender;
  }, [message.contentType]);

  const isQuoteMessage = useMemo(() => {
    return [MessageType.QuoteMessage, MessageType.AtTextMessage].includes(
      message.contentType,
    );
  }, [message.contentType]);

  const messageIsSuccess = useMemo(() => {
    return message.status === MessageStatus.Succeed;
  }, [message.status]);

  const isHiddenTimeWrap = useMemo(() => {
    return [...TextMessageTypes, MessageType.VoiceMessage].includes(
      message.contentType,
    );
  }, [message.contentType]);

  const isBubbleWrap = useMemo(() => {
    return BubbleWrapType.includes(message.contentType);
  }, [message.contentType]);

  const isSpecialWrap = useMemo(() => {
    return (
      message.contentType === (_MessageType.AdvancedMessage as unknown as MessageType)
    );
  }, [message.contentType]);

  const showNickname = useMemo(() => {
    const friend = friendList.find((v) => v.userID === message.sendID);
    return friend?.remark || message.senderNickname;
  }, [message.sendID, friendList]);

  const onCheckChange = (e: CheckboxChangeEvent) => {
    updateOneMessage({ ...message, checked: e.target.checked });
  };

  const tryShowUserCard = useCallback(() => {
    if (isSender) return;
    window.userClick(message.sendID, message.groupID);
  }, []);

  const closeMessageMenu = useCallback(() => {
    setShowMessageMenu(false);
  }, []);

  const handleResend = () => {
    const msg = {
      ...message,
      status: MessageStatus.Sending,
    };
    updateOneMessage(msg);

    if (FileMessageTypes.includes(message.contentType)) {
      handleFileResend();
      return;
    }
    sendMessage({
      message: msg,
      needPush: false,
      recvID: message.groupID ? "" : message.recvID,
      groupID: message.groupID,
    });
  };

  const handleFileResend = async () => {
    try {
      const { currentConversation } = useConversationStore.getState();
      const {
        url: pictureUrl,
        type: pictureType,
        uuid: pictureUUID,
      } = pictureElem?.sourcePicture || {};
      const { videoUrl, videoType, videoUUID } = videoElem || {};
      const {
        sourceUrl,
        soundType,
        uuid: soundUUID,
      } = (soundElem || {}) as SoundElem & {
        soundType: string;
      };
      const { sourceUrl: fileUrl, fileName } = fileElem || {};
      const type = pictureType || videoType || soundType || "";

      let file: File;
      const { systemPath } = JSON.parse(message.localEx || "{}") as {
        systemPath: string;
      };
      if (systemPath) {
        const res = (await window?.electronAPI?.ipcInvoke("getFile", {
          filePath: systemPath,
        })) as { data: Blob; name: string };
        file = blobToFile(res.data, res.name, { type });
      } else {
        const url =
          pictureUrl || videoUrl || sourceUrl || fileUrl || "blob:http://placeholder";
        const name =
          (pictureUUID || videoUUID || soundUUID)?.split("/")?.at(-1) ||
          fileName ||
          uuidV4();
        const data = await fetch(url);
        const blob = await data.blob();
        file = blobToFile(blob, name, { type });
      }
      const newMessage = await createFileMessage(file);

      await IMSDK.deleteMessage({
        clientMsgID: message.clientMsgID,
        conversationID: currentConversation?.conversationID || "",
      });
      deleteOneMessage(message.clientMsgID);

      const msg = {
        ...newMessage,
        localEx: message.localEx,
        status: MessageStatus.Sending,
      };
      sendMessage({
        message: msg,
        recvID: message.groupID ? "" : message.recvID,
        groupID: message.groupID,
      });
    } catch (error) {
      console.log("error", error);
      feedbackToast({
        error: error,
        msg: "源文件路径无法获取，该文件无法重新发送，将于30s后删除",
      });
      setTimeout(() => {
        deleteOneMessage(message.clientMsgID);
        IMSDK.deleteMessage({
          clientMsgID: message.clientMsgID,
          conversationID: idsGetConversationID(message),
        });
      }, 30 * 1000);
    }
  };

  const handleGetReader = async (val: boolean) => {
    if (isSingle || !val) return;
    const res = await apiGetMessageById({
      sendID: message.sendID,
      groupID: message.groupID,
      clientMsgID: message.clientMsgID,
    });
    if (!res.data.chatLogs[0].attachedInfo) return;
    const { hasReadUids } = (
      JSON.parse(res.data.chatLogs[0].attachedInfo) as AttachedInfoElem
    ).groupHasReadInfo as GroupHasReadInfo & { hasReadUids: string[] };
    if (!hasReadUids) return;
    const { data } = await IMSDK.getUsersInfo(hasReadUids);
    const list = data
      .filter((v) => v.publicInfo)
      .map((v) => ({ ...v.publicInfo })) as PublicUserItem[];
    setReaderList(list);
  };

  return (
    <div className={clsx(isActive && styles["position-active"])}>
      <div
        className={clsx(
          "relative mx-auto flex w-4/5 py-3", //  max-w-[700px]
          message.errCode && "!pb-6",
          isCheckMode && "cursor-pointer",
        )}
        onClick={() =>
          isCheckMode &&
          onCheckChange({
            target: { checked: !message.checked },
          } as CheckboxChangeEvent)
        }
      >
        {isCheckMode && (
          <Checkbox
            checked={message.checked}
            onChange={onCheckChange}
            className="my-checkbox pointer-events-none mr-5 h-9"
          />
        )}
        <div
          className={clsx(
            styles["message-container"],
            isSender && styles["message-container-sender"],
            isCheckMode && "pointer-events-none",
          )}
        >
          {!isSingle && !isSender && (
            <OIMAvatar
              className={`mr-2`}
              size={38}
              src={message.senderFaceUrl}
              text={showNickname}
              onClick={tryShowUserCard}
            />
          )}
          <div>
            <div className={styles["message-wrap"]}>
              <MyPopover
                className={clsx(
                  styles["menu-wrap"],
                  isBubbleWrap && styles["bubble"],
                  isSpecialWrap && styles["special"],
                )}
                overlayClassName="message-menu-overlay"
                content={
                  <MessageMenuContent
                    message={message}
                    conversationID={conversationID!}
                    readerList={readerList}
                    closeMenu={closeMessageMenu}
                    isSpecial={isSpecialWrap}
                  />
                }
                destroyTooltipOnHide
                trigger="contextMenu"
                open={messageIsSuccess ? showMessageMenu : false}
                onOpenChange={(val) => {
                  handleGetReader(val);
                  setShowMessageMenu(val);
                }}
              >
                {isQuoteMessage && (
                  <QuoteMessageRenderer message={message} isSender={isSender} />
                )}
                <div
                  title={showNickname}
                  className={`${
                    (isSingle || isSender) && "hidden"
                  } mb-1 truncate font-sBold text-[var(--primary)]`}
                >
                  {showNickname}
                </div>
                <MessageRenderComponent
                  message={message}
                  isSender={isSender}
                  isSingle={isSingle}
                  isChatContainer={true}
                />
                {!isHiddenTimeWrap && (
                  <SendTimeWrap
                    message={message}
                    isSender={isSender}
                    isSingle={isSingle}
                  ></SendTimeWrap>
                )}
              </MyPopover>
              {message.status === MessageStatus.Failed && (
                <ExclamationCircleFilled
                  className={`${styles.fail_icon} cursor-pointer text-base text-[var(--warn-text)]`}
                  rev={undefined}
                  onClick={handleResend}
                />
              )}
            </div>
            {!TextMessageTypes.includes(message.contentType) && (
              <GiveLikeWrap {...props}></GiveLikeWrap>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MessageItem);
