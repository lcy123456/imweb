import { RightOutlined } from "@ant-design/icons";
import clsx from "clsx";
import { t } from "i18next";
import { MessageReceiveOptType } from "open-im-sdk-wasm";
import { ConversationItem } from "open-im-sdk-wasm/lib/types/entity";
import { memo, useMemo, useState } from "react";

import { apiSetConversation } from "@/api/imApi";
import deletePng from "@/assets/images/chatHeader/delete.png";
import archive_active from "@/assets/images/conversation/archive_active.png";
import archive_group_add from "@/assets/images/conversation/archive_group_add.png";
import archive_icon from "@/assets/images/conversation/archive_icon.png";
import no_read from "@/assets/images/conversation/no_read.png";
import no_read_active from "@/assets/images/conversation/no_read_active.png";
import notify_active from "@/assets/images/conversation/notify_active.png";
import notify_cancel from "@/assets/images/conversation/notify_cancel.png";
import notify_cancel_active from "@/assets/images/conversation/notify_cancel_active.png";
import notify_icon from "@/assets/images/conversation/notify_icon.png";
import pinned_active from "@/assets/images/conversation/pinned_active.png";
import pinned_cancel from "@/assets/images/conversation/pinned_cancel.png";
import pinned_cancel_active from "@/assets/images/conversation/pinned_cancel_active.png";
import pinned_icon from "@/assets/images/conversation/pinned_icon.png";
import nav_archive from "@/assets/images/nav/nav_archive.png";
import nav_archive_active from "@/assets/images/nav/nav_archive_active.png";
import { menuItemType, MyPopoverProps, PopoverContent } from "@/components/MyPopover";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";
import emitter from "@/utils/events";

interface Props {
  conversation: ConversationItem;
  closeConversationMenu: () => void;
}
const ConversationMenuContent = (props: Props) => {
  const { conversation, closeConversationMenu } = props;
  const { selfInfo } = useUserStore();
  const { delConversationByCID, conversationFolder } = useConversationStore();

  const [loading, setLoading] = useState(false);
  const [showArchiveMenu, setShowArchiveMenu] = useState(false);

  const tempAttachedInfo = useMemo(() => {
    return JSON.parse(conversation.attachedInfo || "{}") as {
      archive_id: number;
    };
  }, [conversation.attachedInfo]);

  const actionClick = async (idx: menuItemType["idx"]) => {
    if (idx === 4) return;
    setLoading(true);
    const map = {
      0: updateConversationPin,
      1: markConversationAsRead,
      2: removeConversation,
      3: noticePngConversation,
    };
    switch (idx) {
      case 0:
      case 1:
      case 2:
      case 3:
        await map[idx]();
        break;
    }
    setLoading(false);
    closeConversationMenu();
  };

  const archiveClick = (idx: menuItemType["idx"]) => {
    switch (idx) {
      case "4-add":
        emitter.emit("OPEN_CHOOSE_MODAL", {
          type: "CRATE_ARCHIVE",
          extraData: [{ ...conversation }],
        });
        break;
      default:
        archiveConversation(idx);
    }
    setShowArchiveMenu(false);
    closeConversationMenu();
  };

  const updateConversationPin = async () => {
    try {
      await IMSDK.pinConversation({
        conversationID: conversation.conversationID,
        isPinned: !conversation.isPinned,
      });
    } catch (error) {
      feedbackToast({ error, msg: t("toast.pinConversationFailed") });
    }
  };

  const removeConversation = async () => {
    try {
      await IMSDK.hideConversation(conversation.conversationID);
      delConversationByCID(conversation.conversationID);
    } catch (error) {
      feedbackToast({ error, msg: t("toast.deleteConversationFailed") });
    }
  };

  // 关闭开启通知
  const noticePngConversation = async () => {
    try {
      await IMSDK.setConversationRecvMessageOpt({
        conversationID: conversation.conversationID,
        opt:
          conversation.recvMsgOpt === MessageReceiveOptType.NotNotify
            ? MessageReceiveOptType.Nomal
            : MessageReceiveOptType.NotNotify,
      });
    } catch (error) {
      feedbackToast({ error, msg: t("toast.setConversationRecvMessageOptFailed") });
    }
  };

  const markConversationAsRead = async () => {
    try {
      await IMSDK.markConversationMessageAsRead(conversation.conversationID);
    } catch (error) {
      feedbackToast({ error });
    }
  };

  const archiveConversation = async (id: string | number) => {
    try {
      await apiSetConversation({
        userIDs: [selfInfo.userID],
        conversation: {
          conversationID: conversation.conversationID,
          conversationType: conversation.conversationType,
          groupID: conversation.groupID,
          attachedInfo: JSON.stringify({
            ...tempAttachedInfo,
            archive_id: tempAttachedInfo.archive_id === id ? -1 : id,
          }),
        },
      });
    } catch (error) {
      feedbackToast({ error });
    }
  };

  const archiveProps = useMemo((): MyPopoverProps => {
    const menuList: menuItemType[] = [
      ...conversationFolder.map((v) => {
        const isActive = v.id === tempAttachedInfo.archive_id;
        return {
          idx: v.id,
          title: v.name,
          icon: isActive ? nav_archive_active : nav_archive,
          active_icon: nav_archive_active,
          className: clsx("max-w-[160px]", isActive && "text-[var(--primary)]"),
        };
      }),
      {
        idx: "4-add",
        title: "新建分组",
        icon: archive_group_add,
        className: "text-[var(--primary)]",
      },
    ];
    return {
      placement: "right",
      contentOptions: {
        className: "max-h-[200px] no-scrollbar",
      },
      open: showArchiveMenu,
      onOpenChange: (val) => setShowArchiveMenu(val),
      menuList,
      actionClick: archiveClick,
    };
  }, [showArchiveMenu, conversationFolder, tempAttachedInfo]);

  const menuList = useMemo((): menuItemType[] => {
    const { isPinned, recvMsgOpt } = conversation;
    const isNotNotify = recvMsgOpt === MessageReceiveOptType.NotNotify;
    return [
      {
        idx: 0,
        title: `${isPinned ? "取消" : ""}置顶`,
        icon: isPinned ? pinned_cancel : pinned_icon,
        active_icon: isPinned ? pinned_cancel_active : pinned_active,
      },
      ...(conversation.unreadCount
        ? [{ idx: 1, title: "标记已读", icon: no_read, active_icon: no_read_active }]
        : []),
      {
        idx: 3,
        title: `${isNotNotify ? "开启" : "关闭"}通知`,
        icon: isNotNotify ? notify_icon : notify_cancel,
        active_icon: isNotNotify ? notify_active : notify_cancel_active,
      },
      {
        idx: 4,
        title: "分组",
        icon: archive_icon,
        active_icon: archive_active,
        right_icon: <RightOutlined />,
        children: archiveProps,
      },
      {
        idx: 2,
        title: "删除对话",
        icon: deletePng,
        className: "text-[var(--warn-text)]",
      },
    ];
  }, [conversation, archiveProps]);

  return (
    <PopoverContent
      menuList={menuList}
      actionClick={actionClick}
      loading={loading}
    ></PopoverContent>
  );
};

export default memo(ConversationMenuContent);
