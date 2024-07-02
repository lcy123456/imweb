import { Layout } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import { CbEvents, OnlineState, Platform, SessionType } from "open-im-sdk-wasm";
import {
  UserOnlineState,
  WSEvent,
  WsResponse,
} from "open-im-sdk-wasm/lib/types/entity";
import { memo, useEffect, useMemo, useRef, useState } from "react";

import { apiCallInviteOrKick, apiCreateRoom } from "@/api/chatApi";
import call_video from "@/assets/images/chatHeader/call_video.png";
import call_video_active from "@/assets/images/chatHeader/call_video_active.png";
import delete_png from "@/assets/images/chatHeader/delete.png";
import group_member from "@/assets/images/chatHeader/group_member.png";
import history from "@/assets/images/chatHeader/history.png";
import history_active from "@/assets/images/chatHeader/history_active.png";
import launch_group from "@/assets/images/chatHeader/launch_group.png";
import launch_group_active from "@/assets/images/chatHeader/launch_group_active.png";
import settings from "@/assets/images/chatHeader/settings.png";
import settings_active from "@/assets/images/chatHeader/settings_active.png";
import ChatRecords from "@/components/ChatRecords";
import MyPopover, { menuItemType } from "@/components/MyPopover";
import OIMAvatar from "@/components/OIMAvatar";
import { RealCallOpStatus, RealCallsStatus, RealCallsType } from "@/constants";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useRealCallStore, useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";
import emitter, { InviteCallUserID } from "@/utils/events";
import { formatOffLineTime, isGroupSession } from "@/utils/imCommon";

import { useSendMessage } from "../ChatFooter/useSendMessage";
import GroupSetting from "../GroupSetting";
import SingleSetting from "../SingleSetting";

const ChatHeader = () => {
  const { selfInfo } = useUserStore();
  const { sendMessage } = useSendMessage();
  const singleSettingRef = useRef<OverlayVisibleHandle>(null);
  const groupSettingRef = useRef<OverlayVisibleHandle>(null);
  const [actionVisible, setActionVisible] = useState(false);

  const {
    currentConversation,
    delConversationByCID,
    currentGroupInfo,
    currentMemberInGroup,
    typingStatus,
  } = useConversationStore();
  const { currentCallData, currentRoomStatus } = useRealCallStore();

  const inGroup = Boolean(currentMemberInGroup?.groupID);
  const isSingle = currentConversation?.conversationType === SessionType.Single;

  const [loading, setLoading] = useState(false);

  const handleClickAvatar = () => {
    if (isSingle) {
      emitter.emit("OPEN_USER_CARD", { userID: currentConversation?.userID });
    } else {
      actionClick(5);
    }
  };

  const menuList = useMemo((): menuItemType[] => {
    const list = [
      {
        idx: 5,
        title: "设置",
        icon: settings,
        active_icon: settings_active,
      },
      {
        idx: 3,
        title: "创建群聊",
        icon: launch_group,
        active_icon: launch_group_active,
      },
      {
        idx: 4,
        title: "邀请好友",
        icon: launch_group,
        active_icon: launch_group_active,
      },
      {
        idx: 7,
        title: "历史记录",
        icon: history,
        active_icon: history_active,
      },
      {
        idx: 8,
        title: "视频通话",
        icon: call_video,
        active_icon: call_video_active,
      },
      {
        idx: 6,
        title: "删除对话",
        icon: delete_png,
      },
    ];
    return list.filter((v) => {
      if (v.idx === 4 && (isSingle || (!inGroup && !isSingle))) {
        return null;
      }
      if (v.idx === 3 && !isSingle) {
        return null;
      }
      return true;
    });
  }, [isSingle, inGroup]);

  const actionClick = (idx: menuItemType["idx"]) => {
    switch (idx) {
      case 3:
      case 4:
        emitter.emit("OPEN_CHOOSE_MODAL", {
          type: isSingle ? "CRATE_GROUP" : "INVITE_TO_GROUP",
          extraData: isSingle
            ? [{ ...currentConversation }]
            : currentConversation?.groupID,
        });
        break;
      case 5:
        if (isGroupSession(currentConversation?.conversationType)) {
          groupSettingRef.current?.openOverlay();
        } else {
          singleSettingRef.current?.openOverlay();
        }
        break;
      case 6:
        removeConversation();
        break;
      case 7:
        openDrawer();
        break;
      case 8:
        handleRealCall(RealCallsType.Video);
        break;
      default:
        break;
    }
    setActionVisible(false);
  };

  const removeConversation = async () => {
    if (!currentConversation?.conversationID) return;
    setLoading(true);
    try {
      await IMSDK.hideConversation(currentConversation.conversationID);
      delConversationByCID(currentConversation.conversationID);
    } catch (error) {
      feedbackToast({ error, msg: t("toast.deleteConversationFailed") });
    }
    setLoading(false);
  };

  const realCallType = useRef<RealCallsType>(RealCallsType.Audio);
  const handleRealCall = (type: RealCallsType) => {
    if (!currentConversation) return;
    if (currentCallData.conversation || currentRoomStatus.count) {
      feedbackToast({
        error: true,
        msg: "当前通话未结束，无法重复发起",
      });
      return;
    }
    realCallType.current = type;
    if (currentConversation.groupID) {
      emitter.emit("OPEN_CHOOSE_MODAL", {
        type: "INVITE_TO_CALL",
        extraData: JSON.stringify({
          type: "start",
          disabledUserID: [selfInfo.userID],
        }),
      });
    } else {
      handleCreateRoom([currentConversation.userID]);
    }
  };
  const handleCreateRoom = async (userIDs: string[]) => {
    if (!currentConversation) return;
    try {
      emitter.emit("CHECK_GLOBAL_LOADING", null);
      const res = await apiCreateRoom({
        sendID: selfInfo.userID,
        conversationID: currentConversation.conversationID,
        type: realCallType.current,
        recvID: currentConversation.userID,
        groupID: currentConversation.groupID,
      });
      emitter.emit("OPEN_CALL_MODAL", {
        type: realCallType.current,
        conversation: currentConversation,
        token: res.data.token,
        isAnswer: true,
        isSendMsg: true,
        userIDs,
      });
    } catch (error) {
      if ((error as WsResponse).errCode === RealCallsStatus.Busy) {
        sendCallMessage({
          type: realCallType.current,
          status: RealCallsStatus.Busy,
        });
      } else {
        feedbackToast({ error });
      }
    } finally {
      emitter.emit("CHECK_GLOBAL_LOADING", null);
    }
  };

  const sendCallMessage = async ({
    type,
    status,
  }: {
    type: RealCallsType;
    status: RealCallsStatus;
  }) => {
    const { data } = await IMSDK.createCustomMessage({
      data: JSON.stringify({
        type,
        status,
      }),
      extension: "",
      description: "",
    });
    await sendMessage({
      message: data,
    });
  };

  const handleInviteCallUserID = async (data: InviteCallUserID) => {
    if (!currentConversation) return;
    const { type, userIDs } = data;
    if (type === "start") {
      handleCreateRoom(userIDs);
    } else if (type === "invite") {
      await apiCallInviteOrKick({
        userIDs,
        roomName: currentConversation.conversationID,
        opType: RealCallOpStatus.Invite,
        type: currentCallData.type,
      });
      feedbackToast({ msg: "已发出邀请" });
    }
  };

  useEffect(() => {
    emitter.on("SEDN_CALL_MESSAGE", handleRealCall);
    emitter.on("INVITE_CALL_USERID", handleInviteCallUserID);
    return () => {
      emitter.off("SEDN_CALL_MESSAGE", handleRealCall);
      emitter.off("INVITE_CALL_USERID", handleInviteCallUserID);
    };
  }, [currentConversation, currentCallData]);

  // 历史记录
  const [isDisplay, setIsDisplay] = useState<boolean>(false);
  const closeDrawer = () => {
    setIsDisplay(false);
  };
  const openDrawer = () => {
    setIsDisplay(true);
  };

  return (
    <Layout.Header className="relative border-b border-b-[var(--gap-text)] !bg-white !px-3">
      <div className="flex h-full items-center leading-none">
        <div className="flex items-center">
          <OIMAvatar
            src={currentConversation?.faceURL}
            text={currentConversation?.showName}
            isgroup={!isSingle}
            size={40}
            onClick={handleClickAvatar}
          />
          <div className="ml-3 flex h-10.5 flex-col justify-between">
            <div className="font-sBold text-base">
              {currentConversation?.showName}
              <span className="ml-3 font-sMedium text-sm text-[var(--primary)]">
                {typingStatus}
              </span>
            </div>
            {isSingle ? (
              <OnlineOrTypingStatus />
            ) : (
              <div className="flex items-center text-xs text-[var(--sub-text)]">
                <img width={20} src={group_member} alt="member" />
                <span>{currentGroupInfo?.memberCount}</span>
              </div>
            )}
          </div>
        </div>

        <div
          className={`ml-auto h-[40px] w-[40px] cursor-pointer
          bg-[url("@/assets/images/chatHeader/call_audio.png")] 
          bg-contain bg-center bg-no-repeat
          hover:bg-[url("@/assets/images/chatHeader/call_audio_active.png")]`}
          onClick={() => handleRealCall(RealCallsType.Audio)}
        ></div>
        <MyPopover
          trigger="click"
          placement="bottomRight"
          open={actionVisible}
          onOpenChange={(vis) => setActionVisible(vis)}
          actionClick={actionClick}
          menuList={menuList}
          loading={loading}
        >
          <div
            className={`mr-3 h-[40px] w-[40px] cursor-pointer rounded-full
            bg-[url("@/assets/images/chatHeader/more.png")] bg-contain
            ${
              actionVisible &&
              'bg-gray-100 bg-[url("@/assets/images/chatHeader/more_active.png")]'
            }
          `}
          ></div>
        </MyPopover>
      </div>
      <SingleSetting ref={singleSettingRef} />
      <GroupSetting ref={groupSettingRef} />

      {/* 历史记录  */}
      <ChatRecords isDisplay={isDisplay} close={closeDrawer} />
    </Layout.Header>
  );
};

export default ChatHeader;

const OnlineOrTypingStatus = memo(() => {
  const { currentConversation } = useConversationStore();
  const [online, setOnline] = useState(false);
  const [platform, setPlatform] = useState(Platform.Web);

  const userID = currentConversation?.userID || "";

  useEffect(() => {
    const handleStatusChange = (data: UserOnlineState) => {
      if (data.userID === userID) {
        console.log("subscribeUsersStatus", data);
        const isOnline = data.status === OnlineState.Online;
        setOnline(isOnline);
        data.platformIDs && setPlatform(data.platformIDs[0]);
      }
    };
    const userStatusChangeHandler = ({ data }: WSEvent<UserOnlineState>) => {
      handleStatusChange(data);
    };
    IMSDK.on(CbEvents.OnUserStatusChanged, userStatusChangeHandler);
    IMSDK.subscribeUsersStatus([userID]).then(({ data }) => {
      handleStatusChange(data[0]);
    });
    return () => {
      IMSDK.off(CbEvents.OnUserStatusChanged, userStatusChangeHandler);
      IMSDK.unsubscribeUsersStatus([userID]);
    };
  }, [userID]);

  const onlineText = useMemo(() => {
    if (online) return `${Platform[platform]}在线`;
    return platform < 100 ? "离线" : `${formatOffLineTime(platform * 1000)}在线`;
  }, [online, platform]);

  return (
    <div className="flex items-center">
      <i
        className={clsx(
          "mr-1.5 inline-block h-[6px] w-[6px] rounded-full bg-[#2ddd73]",
          {
            "bg-[#999]": !online,
          },
        )}
      />
      <span className="text-xs text-[var(--sub-text)]">{onlineText}</span>
    </div>
  );
});
