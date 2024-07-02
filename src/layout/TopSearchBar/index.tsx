import { Modal, notification } from "antd";
import { MessageType, SessionType } from "open-im-sdk-wasm";
import {
  ConversationItem,
  GroupItem,
  MergeElem,
} from "open-im-sdk-wasm/lib/types/entity";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiCallRefused, apiGetRoomToken } from "@/api/chatApi";
import call_music from "@/assets/audio/call_music.mp3";
import answer_icon from "@/assets/images/realCallsModal/answer_icon.png";
import hungup_icon from "@/assets/images/realCallsModal/hungup_icon.png";
import OIMAvatar from "@/components/OIMAvatar";
import WindowControlBar from "@/components/WindowControlBar";
import { PlayType, RealCallsType, receiveMessageMusicMap } from "@/constants";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import useSystemNotification from "@/hooks/useSystemNotification";
import AddAcountModal from "@/pages/common/AddAcountModal";
import ChooseModal, { ChooseModalState } from "@/pages/common/ChooseModal";
import GroupCardModal from "@/pages/common/GroupCardModal";
import MediaPreviewModal, {
  MediaPreviewParams,
} from "@/pages/common/MediaPreviewModal";
import MergeMessageModal from "@/pages/common/MergeMessageModal";
import RealCallsModal from "@/pages/common/RealCallsModal";
import UserCardModal from "@/pages/common/UserCardModal";
import {
  ExMessageItem,
  useConversationStore,
  useRealCallStore,
  useUserStore,
} from "@/store";
import { CurrentCallData } from "@/store/type";
import { feedbackToast, getMessageTextContent } from "@/utils/common";
import emitter, {
  OpenMediaParams,
  OpenUserCardParams,
  PlayAudioParams,
} from "@/utils/events";
import { formatGroupAtText, formatMessageFileUrl } from "@/utils/imCommon";

import { IMSDK } from "../MainContentWrap";

let timer: NodeJS.Timeout;
let isPlayTips = true;
const modalParams = {
  width: 260,
  title: null,
  icon: null,
  content: "确认后开启新消息提示音",
  centered: true,
  okText: "确定",
  className: "modal-content-center",
};

const TopSearchBar = () => {
  const navigate = useNavigate();
  const { currentCallData, updateCurrentCallData } = useRealCallStore();
  const { selfInfo, receiveMessageMusicKey } = useUserStore();
  const { updateCurrentConversation } = useConversationStore();
  const userCardRef = useRef<OverlayVisibleHandle>(null);
  const groupCardRef = useRef<OverlayVisibleHandle>(null);
  const chooseModalRef = useRef<OverlayVisibleHandle>(null);
  // const messageMusicRef = useRef<HTMLAudioElement>(null);
  // const callMusiceRef = useRef<HTMLAudioElement>(null);
  const audioElement = useRef<HTMLAudioElement>(new Audio()).current;
  const addAcountRef = useRef<OverlayVisibleHandle>(null);
  const realCallsModalRef = useRef<OverlayVisibleHandle>(null);
  const [chooseModalState, setChooseModalState] = useState<ChooseModalState>({
    type: "CRATE_GROUP",
  });
  const [userCardState, setUserCardState] = useState<OpenUserCardParams>();
  const [groupCardData, setGroupCardData] = useState<GroupItem>();
  const [mediaData, setMediaData] = useState<MediaPreviewParams>();

  const [notifyApi, contextHolder] = notification.useNotification();
  const {
    askNotificationPermission,
    getPermissionStatus,
    createNotification,
    closeAllNotification,
  } = useSystemNotification();

  const playAudioHandle = ({ type, src, conversation }: PlayAudioParams) => {
    switch (type) {
      case PlayType.NewMessage:
        if (audioElement.paused) {
          _playAudioHandle(
            receiveMessageMusicMap[receiveMessageMusicKey],
            conversation,
          );
        }
        break;
      case PlayType.Call:
        _playAudioHandle(call_music, conversation);
        break;
      // case PlayType.VoiceMessage:
      // if (!src) return;
      // audioElement.src = src;
      // audioElement.play();
      // break;
    }
  };
  const _playAudioHandle = async (src: string, conversation?: ConversationItem) => {
    if (!getPermissionStatus() && isPlayTips) {
      isPlayTips = false;
      const cloneModalParams = JSON.parse(
        JSON.stringify(modalParams),
      ) as typeof modalParams;
      cloneModalParams.width = 360;
      cloneModalParams.content = "检测到通知权限未开启，请于左上角开启通知权限";
      Modal.success(cloneModalParams);
      await askNotificationPermission();
      return;
    }

    audioElement.src = src;
    audioElement.currentTime = 0;
    audioElement.play().catch(() => {
      if (!isPlayTips) return;
      isPlayTips = false;
      Modal.success(modalParams);
    });
    if (conversation) {
      const isGroup = Boolean(conversation.groupID);
      const msg = JSON.parse(conversation.latestMsg) as ExMessageItem;
      createNotification({
        title: conversation.showName,
        options: {
          tag: conversation.conversationID,
          body: `${formatGroupAtText(conversation)}${
            isGroup && msg.senderNickname ? ` ${msg.senderNickname}：` : " "
          }${getMessageTextContent(msg)}`,
          faceURL: formatMessageFileUrl(conversation.faceURL),
          isGroup,
        },
      });
    }
  };
  const stopAudioHandle = (src: string) => {
    if (audioElement.src.includes(src)) {
      audioElement.currentTime = 0;
      audioElement.pause();
    }
  };
  useEffect(() => {
    emitter.on("PLAY_MESSAGE_AUDIO", playAudioHandle);
    return () => {
      emitter.off("PLAY_MESSAGE_AUDIO", playAudioHandle);
    };
  }, [receiveMessageMusicKey]);

  useEffect(() => {
    const userCardHandler = (params: OpenUserCardParams) => {
      setUserCardState({ ...params });
      userCardRef.current?.openOverlay();
    };
    const chooseModalHandler = (params: ChooseModalState) => {
      setChooseModalState({ ...params });
      chooseModalRef.current?.openOverlay();
    };
    const mediaPreviewHandler = async (data: OpenMediaParams) => {
      const { mediaList, message, conversationID } = data;
      const { currentConversation } = useConversationStore.getState();
      let messageList = mediaList;
      if (!messageList) {
        const { data } = await IMSDK.searchLocalMessages({
          conversationID: conversationID || currentConversation?.conversationID || "",
          keywordList: [],
          messageTypeList: [MessageType.PictureMessage, MessageType.VideoMessage],
          pageIndex: 1,
          count: 999,
        });
        if (!data.searchResultItems) return;
        messageList = data.searchResultItems[0].messageList.reverse();
      }
      const index = messageList.findIndex((v) => v.clientMsgID === message.clientMsgID);
      if (index === -1) return;
      const options = {
        index,
        messageList,
      };
      if (window.electronAPI) {
        window.mediaPreviewPort.postMessage({
          type: "preview",
          data: options,
        });
        return;
      }
      setMediaData({ ...options });
    };
    const addUserAccount = () => {
      addAcountRef.current?.openOverlay();
    };
    askNotificationPermission();

    const handleNotificationMessage = (
      event: MessageEvent<{ type: string; data: string }>,
    ) => {
      console.log("port notificationMessage:", event.data);
      const { type, data } = event.data;
      const conversation = useConversationStore
        .getState()
        .conversationList.find((v) => v.conversationID === data);
      switch (type) {
        case "reply":
          if (!conversation) return;
          updateCurrentConversation({ ...conversation });
          navigate(`/home/chat/${conversation.conversationID}`);
          break;
      }
    };
    const handleMediaPreviewMessage = (
      event: MessageEvent<{ type: string; data: string }>,
    ) => {
      console.log("port mediaPreviewMessage:", event.data);
    };

    window.onmessage = (event) => {
      if (event.source === window) {
        if (event.data === "notificationPort") {
          const [port] = event.ports;
          window.notificationPort = port;
          port.onmessage = handleNotificationMessage;
        } else if (event.data === "mediaPreviewPort") {
          const [port] = event.ports;
          window.mediaPreviewPort = port;
          port.onmessage = handleMediaPreviewMessage;
        }
      }
    };

    emitter.on("OPEN_USER_CARD", userCardHandler);
    emitter.on("OPEN_GROUP_CARD", openGroupCardWithData);
    emitter.on("OPEN_CHOOSE_MODAL", chooseModalHandler);
    emitter.on("OPEN_MEDIA_PREVIEW", mediaPreviewHandler);
    emitter.on("ADD_USER_ACCOUNT", addUserAccount);
    document.addEventListener("visibilitychange", closeAllNotification);
    window.electronAPI?.ipcInvoke("getWindowPort");
    return () => {
      emitter.off("OPEN_USER_CARD", userCardHandler);
      emitter.off("OPEN_GROUP_CARD", openGroupCardWithData);
      emitter.off("OPEN_CHOOSE_MODAL", chooseModalHandler);
      emitter.off("OPEN_MEDIA_PREVIEW", mediaPreviewHandler);
      emitter.off("ADD_USER_ACCOUNT", addUserAccount);
      document.removeEventListener("visibilitychange", closeAllNotification);
    };
  }, []);

  const openGroupCardWithData = useCallback((group: GroupItem) => {
    setGroupCardData(group);
    groupCardRef.current?.openOverlay();
  }, []);

  useEffect(() => {
    const openCallsNotify = async (params: CurrentCallData) => {
      const { conversation } = params;
      if (!conversation) return;
      const res = await apiGetRoomToken({
        recvID: selfInfo.userID,
        conversationID: conversation.conversationID,
      });
      clearTimeout(timer);
      // callMusiceRef.current?.play();
      playAudioHandle({ type: PlayType.Call, conversation });
      params.token = res.data.token;
      const key = conversation.conversationID;
      notifyApi.open({
        className: "no_notify_message !w-[340px]",
        message: null,
        description: (
          <RealCallsNotify
            {...params}
            destroyCallNotify={() => destroyCallNotify(key)}
            openCallModal={openCallModal}
          ></RealCallsNotify>
        ),
        placement: "bottomRight",
        duration: null,
        key,
        closeIcon: null,
      });
      timer = setTimeout(() => {
        destroyCallNotify(key);
      }, 60000);
    };
    const openCallModal = (params: CurrentCallData) => {
      updateCurrentCallData({ ...params });
      realCallsModalRef.current?.openOverlay();
    };
    const closeCallNotify = (params: CurrentCallData) => {
      const { conversation } = params;
      if (!conversation) return;
      destroyCallNotify(conversation.conversationID);
    };
    const destroyCallNotify = (conversationID: string) => {
      // if (!callMusiceRef.current) return;
      // callMusiceRef.current.currentTime = 0;
      // callMusiceRef.current.pause();
      stopAudioHandle(call_music);
      notifyApi.destroy(conversationID);
    };
    emitter.on("OPEN_CALL_NOTIFY", openCallsNotify);
    emitter.on("CLOSE_CALL_NOTIFY", closeCallNotify);
    emitter.on("OPEN_CALL_MODAL", openCallModal);
    return () => {
      emitter.off("OPEN_CALL_NOTIFY", openCallsNotify);
      emitter.off("CLOSE_CALL_NOTIFY", closeCallNotify);
      emitter.off("OPEN_CALL_MODAL", openCallModal);
    };
  }, [selfInfo, currentCallData]);

  return (
    <div
      className={`no-mobile app-drag flex h-[var(--searchbar-height)] shrink-0 items-center bg-[var(--top-search-bar)] dark:bg-[#141414]`}
    >
      {contextHolder}
      <WindowControlBar />
      <UserCardModal ref={userCardRef} {...userCardState} />
      <GroupCardModal ref={groupCardRef} groupData={groupCardData} />
      <ChooseModal ref={chooseModalRef} state={chooseModalState} />
      <RealCallsModal ref={realCallsModalRef} />
      {mediaData && (
        <MediaPreviewModal
          {...mediaData}
          closeOverlay={() => setMediaData(undefined)}
        />
      )}
      <AddAcountModal ref={addAcountRef} />
    </div>
  );
};

interface RealCallsNotifyParams extends CurrentCallData {
  destroyCallNotify: () => void;
  openCallModal: (params: CurrentCallData) => void;
}
const RealCallsNotify = (props: RealCallsNotifyParams) => {
  const { conversation, type, destroyCallNotify, openCallModal } = props;
  const { currentCallData, currentRoomStatus } = useRealCallStore();

  // const handleAvatarClick = () => {
  //   destroyCallNotify();
  //   openCallModal({..props});
  // };
  const handleAnswer = () => {
    console.log("handleAnswer", currentCallData.conversation, currentRoomStatus.count);
    if (currentCallData.conversation) {
      feedbackToast({
        error: true,
        msg: "当前通话未结束，无法重复接听",
      });
      return;
    }
    destroyCallNotify();
    openCallModal({
      ...props,
      isAnswer: true,
    });
  };
  const handleHungup = () => {
    console.log("handleHungup");
    destroyCallNotify();
    if (!conversation) return;
    if (conversation.conversationType === SessionType.WorkingGroup) return;
    apiCallRefused({
      sendID: conversation.userID,
      conversationID: conversation.conversationID,
    });
  };
  return (
    <div className="flex items-center overflow-hidden">
      <OIMAvatar
        src={conversation?.faceURL}
        text={conversation?.showName}
        isgroup={Boolean(conversation?.groupID)}
        size={45}
        // onClick={handleAvatarClick}
      ></OIMAvatar>
      <div className="ml-1 overflow-hidden ">
        <div className="truncate font-sMedium">{conversation?.showName}</div>
        <div className="text-xs text-[var(--sub-text)]">
          邀请你{type === RealCallsType.Video ? "视频" : "语音"}通话
        </div>
      </div>
      <img
        width={45}
        className="ml-auto mr-5 cursor-pointer"
        src={hungup_icon}
        alt=""
        onClick={handleHungup}
      />
      <img
        className="cursor-pointer"
        width={45}
        src={answer_icon}
        alt=""
        onClick={handleAnswer}
      />
    </div>
  );
};

export default TopSearchBar;
