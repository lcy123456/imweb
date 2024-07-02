import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Divider } from "antd";
import clsx from "clsx";
import { MessageType, SessionType } from "open-im-sdk-wasm";
import { PublicUserItem, WsResponse } from "open-im-sdk-wasm/lib/types/entity";
import { memo, useMemo, useState } from "react";
import { useCopyToClipboard } from "react-use";

import { modal } from "@/AntdGlobalComp";
import {
  apiAddCollectMessage,
  apiPinnedCancelMessage,
  apiPinnedMessage,
} from "@/api/chatApi";
import { apiGiveLikeMessage } from "@/api/imApi";
import read_status from "@/assets/images/messageItem/read_status.png";
import check from "@/assets/images/messageMenu/check.png";
import check_active from "@/assets/images/messageMenu/check_active.png";
import collect from "@/assets/images/messageMenu/collect.png";
import collect_active from "@/assets/images/messageMenu/collect_active.png";
import copy from "@/assets/images/messageMenu/copy.png";
import copy_active from "@/assets/images/messageMenu/copy_active.png";
import edit from "@/assets/images/messageMenu/edit.png";
import edit_active from "@/assets/images/messageMenu/edit_active.png";
import favorite from "@/assets/images/messageMenu/favorite.png";
import favorite_active from "@/assets/images/messageMenu/favorite_active.png";
import forward from "@/assets/images/messageMenu/forward.png";
import forward_active from "@/assets/images/messageMenu/forward_active.png";
import pinned from "@/assets/images/messageMenu/pinned.png";
import pinned_active from "@/assets/images/messageMenu/pinned_active.png";
import remove from "@/assets/images/messageMenu/remove.png";
import remove_active from "@/assets/images/messageMenu/remove_active.png";
import reply from "@/assets/images/messageMenu/reply.png";
import reply_active from "@/assets/images/messageMenu/reply_active.png";
import revoke from "@/assets/images/messageMenu/revoke.png";
import revoke_active from "@/assets/images/messageMenu/revoke_active.png";
import save from "@/assets/images/messageMenu/save.png";
import save_active from "@/assets/images/messageMenu/save_active.png";
import MyPopover, { menuItemType, PopoverContent } from "@/components/MyPopover";
import OIMAvatar from "@/components/OIMAvatar";
import { FileMessageTypes, TextMessageTypes } from "@/constants";
import useFavoriteEmoji from "@/hooks/useFavoriteEmoji";
import { IMSDK } from "@/layout/MainContentWrap";
import {
  ExMessageItem,
  useContactStore,
  useConversationStore,
  useMessageStore,
  useUserStore,
} from "@/store";
import { feedbackToast, getMessageTextContent, tryDownload } from "@/utils/common";
import { LikeEmojiItem, likeEmojis } from "@/utils/emojis";
import emitter from "@/utils/events";
import {
  checkCodeStatus,
  formatMessageByType,
  formatMessageFileUrl,
} from "@/utils/imCommon";

import { GiveLikeItem } from "./GiveLikeWrap";

interface Props {
  message: ExMessageItem;
  conversationID: string;
  readerList: PublicUserItem[];
  isSpecial?: boolean;
  closeMenu: () => void;
}
const MessageMenuContent = ({
  message,
  conversationID,
  readerList,
  isSpecial,
  closeMenu,
}: Props) => {
  const selfUserID = useUserStore((state) => state.selfInfo.userID);
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const ownerUserID = useConversationStore(
    (state) => state.currentGroupInfo?.ownerUserID,
  );
  const {
    sendID,
    clientMsgID,
    contentType,
    pictureElem,
    videoElem,
    soundElem,
    mergeElem,
    fileElem,
    sessionType,
  } = message;
  const senderIsOwner = sendID === ownerUserID;
  const isSender = sendID === selfUserID;

  const getPinnedMessageList = useMessageStore((state) => state.getPinnedMessageList);
  const pinnedMessageList = useMessageStore((state) => state.pinnedMessageList);
  const updateCheckMode = useMessageStore((state) => state.updateCheckMode);
  const updateOneMessage = useMessageStore((state) => state.updateOneMessage);
  const deleteOneMessage = useMessageStore((state) => state.deleteOneMessage);
  const updateQuoteMessage = useConversationStore((state) => state.updateQuoteMessage);

  const [_, copyToClipboard] = useCopyToClipboard();
  const { addFavoriteEmoji, favoriteEmojiList } = useFavoriteEmoji();

  const isPinned = useMemo(() => {
    return pinnedMessageList.some((v) => v.clientMsgID === clientMsgID);
  }, [pinnedMessageList]);

  const messageMenuList = useMemo(() => {
    const list = (
      [
        {
          idx: 1,
          title: "转发",
          icon: forward,
          active_icon: forward_active,
          fn: () => tryForward(),
        },
        {
          idx: 2,
          title: "复制",
          icon: copy,
          active_icon: copy_active,
          fn: () => tryCopy(),
        },
        {
          idx: 3,
          title: "多选",
          icon: check,
          active_icon: check_active,
          fn: () => {
            updateCheckMode(true);
          },
        },
        {
          idx: 4,
          title: "回复",
          icon: reply,
          active_icon: reply_active,
          fn: () => updateQuoteMessage(message),
        },
        {
          idx: 9,
          title: "编辑",
          icon: edit,
          active_icon: edit_active,
          fn: () => tryEdit(),
        },
        {
          idx: 5,
          title: "撤回",
          icon: revoke,
          active_icon: revoke_active,
          fn: () => tryRevoke(),
        },
        {
          idx: 10,
          title: "收藏",
          icon: collect,
          active_icon: collect_active,
          fn: () => tryCollect(),
        },
        {
          idx: 6,
          title: "删除",
          icon: remove,
          active_icon: remove_active,
          fn: () => tryRemove(),
        },
        {
          idx: 7,
          title: isPinned ? "取消置顶" : "置顶",
          icon: pinned,
          active_icon: pinned_active,
          fn: () => tryPinned(),
        },
        {
          idx: 8,
          title: "添加到表情",
          icon: favorite,
          active_icon: favorite_active,
          fn: () => tryAddFavoriteEmoji(),
        },
        {
          idx: 11,
          title: "另存为",
          icon: save,
          active_icon: save_active,
          fn: () => trySaveMediaFile(),
        },
      ] as menuItemType[]
    ).filter((v) => {
      v.className = "!h-[34px]";
      if (
        (isSpecial && [1, 9].includes(v.idx as number)) ||
        ([2].includes(v.idx as number) && !TextMessageTypes.includes(contentType)) ||
        (v.idx === 5 && !isSender) ||
        (v.idx === 6 && (sessionType === SessionType.Single ? false : !isSender)) ||
        (v.idx === 7 &&
          ![
            ...TextMessageTypes,
            ...FileMessageTypes,
            MessageType.MergeMessage,
          ].includes(contentType)) ||
        (v.idx === 8 && contentType !== MessageType.PictureMessage) ||
        // favoriteEmojiList.includes(pictureElem.sourcePicture.url)
        (v.idx === 9 && (!isSender || !TextMessageTypes.includes(contentType))) ||
        (v.idx === 11 && !FileMessageTypes.includes(contentType))
      ) {
        return false;
      }
      return true;
    });
    return list;
  }, [message, isSender, isPinned, favoriteEmojiList]);

  const menuClick = (idx: menuItemType["idx"], menu: menuItemType) => {
    menu.fn?.();
    closeMenu();
  };

  const tryForward = async () => {
    const { data } = await IMSDK.createForwardMessage(message);
    emitter.emit("OPEN_CHOOSE_MODAL", {
      type: "FORWARD_MESSAGE",
      extraData: {
        ...data,
        ex: undefined,
      },
    });
  };

  const tryCopy = () => {
    const text = getMessageTextContent(message);
    copyToClipboard(text);
    feedbackToast({ msg: "复制成功！" });
  };

  const tryEdit = () => {
    updateQuoteMessage(message, true);
  };

  const tryRevoke = async () => {
    try {
      await IMSDK.revokeMessage({ conversationID, clientMsgID });
      updateOneMessage({
        ...message,
        contentType: MessageType.RevokeMessage,
        notificationElem: {
          detail: JSON.stringify({
            clientMsgID: message.clientMsgID,
            revokeTime: Date.now(),
            revokerID: selfUserID,
            revokerNickname: "你",
            revokerRole: 0,
            seq: message.seq,
            sessionType: message.sessionType,
            sourceMessageSendID: message.sendID,
            sourceMessageSendTime: message.sendTime,
            sourceMessageSenderNickname: message.senderNickname,
          }),
        },
      });
    } catch (error) {
      feedbackToast({ error });
    }
  };

  const tryRemove = () => {
    modal.confirm({
      title: "删除消息",
      content: `确定删除消息吗？将会同步删除他人的消息`,
      onOk: async () => {
        try {
          await IMSDK.deleteMessage({ clientMsgID, conversationID });
          deleteOneMessage(clientMsgID);
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  };

  const tryPinned = async () => {
    if (!currentConversation?.conversationID) return;
    try {
      if (isPinned) {
        const id =
          pinnedMessageList.find((v) => v.clientMsgID === clientMsgID)?.id || 0;
        await apiPinnedCancelMessage({
          id,
        });
        feedbackToast({ msg: "取消置顶成功" });
      } else {
        await apiPinnedMessage({
          ...message,
          conversationID: currentConversation.conversationID,
          content: getPinnedContent(),
        });
        feedbackToast({ msg: "置顶成功" });
      }
      getPinnedMessageList();
    } catch (error) {
      feedbackToast({ error, msg: checkCodeStatus((error as WsResponse).errCode) });
    }
  };

  const tryAddFavoriteEmoji = () => {
    if (favoriteEmojiList.length >= 200) {
      feedbackToast({
        error: "表情包添加上限200张",
        msg: "表情包添加上限200张",
      });
      return;
    }
    const url = pictureElem.sourcePicture.url;
    addFavoriteEmoji({
      url,
    });
  };

  const tryCollect = async () => {
    if (!currentConversation) return;
    try {
      await apiAddCollectMessage({
        content: JSON.stringify(message),
        senderNickname: currentConversation.groupID
          ? currentConversation.showName
          : message.senderNickname,
      });
      feedbackToast({ msg: "收藏成功" });
    } catch (error) {
      feedbackToast({ error });
    }
  };

  const trySaveMediaFile = () => {
    if (contentType === MessageType.FileMessage) {
      emitter.emit("MESSAGE_SAVEAS_FILE", clientMsgID);
      return;
    }
    const url = formatMessageFileUrl(
      pictureElem?.sourcePicture?.url || videoElem?.videoUrl || soundElem?.sourceUrl,
    );
    tryDownload(url);
  };

  const getPinnedContent = () => {
    switch (contentType) {
      case MessageType.TextMessage:
      case MessageType.AtTextMessage:
      case MessageType.QuoteMessage:
        return formatMessageByType(message);
      case MessageType.PictureMessage:
        return pictureElem.sourcePicture.url;
      case MessageType.VideoMessage:
        return videoElem.snapshotUrl;
      case MessageType.MergeMessage:
        return mergeElem.title;
      case MessageType.FileMessage:
        return fileElem.fileName;
      default:
        return "";
    }
  };

  const [expand, setExpand] = useState(2);
  const handleExpand = () => {
    setExpand(expand === 1 ? 2 : 1);
  };

  const tryLikeClick = async (v: LikeEmojiItem) => {
    try {
      await apiGiveLikeMessage({
        ...message,
        emoji: v.context,
      });
      closeMenu();
    } catch (error) {
      feedbackToast({ error, msg: "消息点赞异常" });
    }
  };

  return (
    <div className={"w-[210px] pt-2"}>
      <div className="-ml-[20px] mb-2 flex w-[250px] flex-wrap items-start justify-evenly rounded-[20px] border border-gray-100 bg-white px-1 py-2">
        {likeEmojis.map((v, i) => {
          return v.context === "arrow" ? (
            <div
              key={v.context}
              className={clsx(
                "app-no-drag mx-1.5 mt-[2px]",
                "flex h-[24px] w-[24px] cursor-pointer items-center",
                "justify-center rounded-full bg-gray-400 text-white",
                expand === 1 && "mb-3",
              )}
              onClick={handleExpand}
            >
              {expand === 1 ? <UpOutlined /> : <DownOutlined />}
            </div>
          ) : (
            <img
              key={v.context}
              src={v.src}
              alt=""
              width={26}
              className={clsx(
                "mx-1 cursor-pointer select-none",
                expand !== 1 && i > 6 && "hidden",
              )}
              onClick={() => tryLikeClick(v)}
            />
          );
        })}
      </div>
      <PopoverContent
        menuList={messageMenuList}
        actionClick={menuClick}
      ></PopoverContent>
      {readerList.length > 0 && (
        <ReaderListPopover
          message={message}
          readerList={readerList}
          closeMenu={closeMenu}
        ></ReaderListPopover>
      )}
    </div>
  );
};

export default memo(MessageMenuContent);

interface ReaderListPopoverProps {
  message: ExMessageItem;
  readerList: PublicUserItem[];
  closeMenu: () => void;
}
const ReaderListPopover = (props: ReaderListPopoverProps) => {
  const { friendList } = useContactStore();
  const { message, readerList, closeMenu } = props;
  const { currentConversation } = useConversationStore();

  const [subVisible, setSubVisible] = useState(false);

  const giveLikeList = useMemo(() => {
    const { giveLike } = JSON.parse(message.ex || "{}") as {
      giveLike?: GiveLikeItem[];
    };
    return giveLike || [];
  }, [message.ex]);

  return (
    <MyPopover
      open={subVisible}
      onOpenChange={(val) => {
        setSubVisible(val);
      }}
      content={
        <div className="max-h-[260px] w-[160px] overflow-auto py-2">
          {readerList.map((v) => {
            const giveLikeItem = giveLikeList.find((j) => j.uid === v.userID);
            const likeEmoji = likeEmojis.find((j) => j.context === giveLikeItem?.key);
            const friend = friendList.find((j) => j.userID === v.userID);
            const showName = friend?.remark || v.nickname;
            return (
              <div
                className="flex cursor-pointer items-center px-4 py-1 hover:bg-[var(--primary-active)]"
                key={v.userID}
                onClick={() => {
                  setSubVisible(false);
                  closeMenu();
                  window.userClick(v.userID, currentConversation?.groupID || "");
                }}
              >
                <OIMAvatar src={v.faceURL} text={showName} size={28}></OIMAvatar>
                <span className="ml-2 mr-auto truncate">{showName}</span>
                <img src={likeEmoji?.src} alt="" width={20} />
              </div>
            );
          })}
        </div>
      }
      placement="rightTop"
    >
      <Divider className="m-0 border-2 border-[var(--gap-text)]" />
      <div className="relative flex cursor-pointer items-center rounded bg-white px-[20px] py-3">
        <img src={read_status} alt="" width={16} className="mr-1" />
        <span>{readerList.length}人已读</span>
        {readerList.slice(0, 5).map((v, i) => {
          const friend = friendList.find((j) => j.userID === v.userID);
          const showName = friend?.remark || v.nickname;
          return (
            <OIMAvatar
              className={`absolute right-[20px]`}
              style={{ marginRight: `${12 * i}px` }}
              key={v.userID}
              src={v.faceURL}
              text={showName}
              size={24}
            ></OIMAvatar>
          );
        })}
      </div>
    </MyPopover>
  );
};
