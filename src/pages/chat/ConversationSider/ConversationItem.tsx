/* eslint-disable prettier/prettier */
import { Badge } from "antd";
import clsx from "clsx";
import { GroupAtType, MessageReceiveOptType } from "open-im-sdk-wasm";
import type {
  ConversationItem,
  ConversationItem as ConversationItemType,
  MessageItem,
} from "open-im-sdk-wasm/lib/types/entity";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import notify_cancel from "@/assets/images/conversation/notify_cancel.png";
import MyPopover from "@/components/MyPopover";
import OIMAvatar from "@/components/OIMAvatar";
import { burnMenuList } from "@/constants";
import { useContactStore, useConversationStore } from "@/store";
import {
  formatConversionTime,
  formatGroupAtText,
  formatMessageByType,
} from "@/utils/imCommon";

import styles from "./conversation-item.module.scss";
import ConversationMenuContent from "./ConversationMenuContent";

interface IConversationProps {
  conversation: ConversationItemType;
}

const ConversationItem = ({ conversation }: IConversationProps) => {
  const navigate = useNavigate();
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const updateCurrentConversation = useConversationStore(
    (state) => state.updateCurrentConversation,
  );
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const { friendList } = useContactStore();

  const toSpecifiedConversation = () => {
    updateCurrentConversation({ ...conversation });
    navigate(`/home/chat/${conversation.conversationID}`);
  };

  const closeConversationMenu = () => {
    setShowConversationMenu(false);
  };

  const burnToText = useMemo(() => {
    const item = burnMenuList.find((v) => v.idx === conversation.burnDuration);
    return item?.text || "";
  }, [conversation.burnDuration]);

  const prefixText = useMemo(() => {
    const draft = conversation.draftText ? "[草稿]" : "";
    return draft + formatGroupAtText(conversation);
  }, [conversation.groupAtType, conversation.draftText]);

  const getLatestMessageContent = () => {
    if (conversation.latestMsg) {
      const message = JSON.parse(conversation.latestMsg) as MessageItem;
      const isGroup = Boolean(conversation.groupID);
      const text = formatMessageByType(message);
      const regWithoutHtml = /(<([^>]+)>)/gi;
      let showName = "";
      if (isGroup && message.senderNickname) {
        const friend = friendList.find((v) => v.userID === message.sendID);
        showName = ` ${friend?.remark || message.senderNickname}：`;
      }
      return showName + text.replace(regWithoutHtml, "");
    }
    return "";
  };

  const latestMessageTime = formatConversionTime(conversation.latestMsgSendTime);

  const isNotNotify = useMemo(() => {
    return conversation.recvMsgOpt === MessageReceiveOptType.NotNotify;
  }, [conversation.recvMsgOpt]);

  return (
    <MyPopover
      overlayClassName="conversation-popover"
      placement="bottomRight"
      open={showConversationMenu}
      onOpenChange={(vis) => setShowConversationMenu(vis)}
      content={
        <ConversationMenuContent
          conversation={conversation}
          closeConversationMenu={closeConversationMenu}
        />
      }
      trigger="contextMenu"
    >
      <div
        className={clsx(
          styles["conversation-item"],
          conversation.isPinned && styles["conversation-item-pinned"],
          ((currentConversation?.groupID &&
            currentConversation?.groupID === conversation.groupID) ||
            (currentConversation?.userID &&
              currentConversation?.userID === conversation?.userID)) &&
            "bg-[var(--primary-active)]",
        )}
        onClick={toSpecifiedConversation}
      >
        {conversation.isPrivateChat && (
          <div className={String(styles["burn-wrap"])}>{burnToText}</div>
        )}
        <OIMAvatar
          src={conversation.faceURL}
          isgroup={Boolean(conversation.groupID)}
          text={conversation.showName}
          size={42}
        />

        <div className={clsx("ml-3 flex-1 truncate")}>
          <div className="mb-1 truncate font-sBold text-base ">
            {conversation.showName}
          </div>
          <div className="flex text-xs">
            <div className="text-[var(--primary)]">{prefixText}</div>
            <div
              className="truncate text-[rgba(112,121,145,1)]"
              dangerouslySetInnerHTML={{ __html: getLatestMessageContent() }}
            ></div>
          </div>
        </div>
        <div className="flex w-[80px] flex-col items-end">
          <div className="mb-1 text-xs text-[var(--sub-text)]">{latestMessageTime}</div>
          <div className="flex" style={{ alignItems: "center" }}>
            <Badge
              count={conversation.unreadCount}
              size="small"
              style={{ backgroundColor: isNotNotify ? "#a0a0a0" : "#52c41a" }}
            ></Badge>
            {isNotNotify && <img src={notify_cancel} alt="" className="ml-1 w-4" />}
          </div>
        </div>
      </div>
    </MyPopover>
  );
};

export default ConversationItem;
