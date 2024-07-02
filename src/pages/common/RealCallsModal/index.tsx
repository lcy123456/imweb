import "@livekit/components-styles";

import { TrackReference } from "@livekit/components-core";
import {
  AudioTrack,
  LiveKitRoom,
  useRoomContext,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import clsx from "clsx";
import { Track } from "livekit-client";
import { ConversationItem, GroupMemberItem } from "open-im-sdk-wasm/lib/types/entity";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";

import { apiCallInviteOrKick, apiCallRefused } from "@/api/chatApi";
import call_audio_active from "@/assets/images/chatHeader/call_audio_active.png";
import delete_png from "@/assets/images/chatHeader/delete.png";
import answer_icon from "@/assets/images/realCallsModal/answer_icon.png";
import call_video_active from "@/assets/images/realCallsModal/call_video_active.png";
import camera_active_icon from "@/assets/images/realCallsModal/camera_active_icon.png";
import camera_icon from "@/assets/images/realCallsModal/camera_icon.png";
import disable_microphone from "@/assets/images/realCallsModal/disable_microphone.png";
import hungup_icon from "@/assets/images/realCallsModal/hungup_icon.png";
import invite_icon from "@/assets/images/realCallsModal/invite_icon.png";
import microphone_active_icon from "@/assets/images/realCallsModal/microphone_active_icon.png";
import microphone_icon from "@/assets/images/realCallsModal/microphone_icon.png";
import scale_icon from "@/assets/images/realCallsModal/scale_icon.png";
import speak_icon from "@/assets/images/realCallsModal/speak_icon.png";
import DraggableModalWrap from "@/components/DraggableModalWrap";
import DraggableWrap from "@/components/DraggableWrap";
import MyPopover, { menuItemType } from "@/components/MyPopover";
import OIMAvatar from "@/components/OIMAvatar";
import { RealCallOpStatus, RealCallsStatus, RealCallsType } from "@/constants";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { useSendMessage } from "@/pages/chat/queryChat/ChatFooter/useSendMessage";
import { useRealCallStore, useUserStore } from "@/store";
import { feedbackToast, secondsToMS } from "@/utils/common";
import emitter from "@/utils/events";

import styles from "./realCallsModal.module.scss";

let timer: NodeJS.Timeout;
let initTime = 0;
interface GroupMemberMap {
  [propsName: string]: GroupMemberItem;
}
type MyTrackItem = {
  [Key in Track.Source]?: TrackReference;
};

const RealCallsModal: ForwardRefRenderFunction<OverlayVisibleHandle> = (props, ref) => {
  const { isOverlayOpen, closeOverlay, openOverlay } = useOverlayVisible(ref);
  const { selfInfo, thirdConfig } = useUserStore();
  const { currentCallData, clearCurrentCallData, clearCurrentRoomStatus } =
    useRealCallStore();
  const { sendMessage } = useSendMessage();
  const { currentRolevel } = useCurrentMemberRole();

  const selfUserID = selfInfo.userID;
  const {
    isAnswer: defaultIsAnswer,
    conversation,
    isReceive,
    type: mediaType,
    token,
    isSendMsg,
    userIDs,
  } = currentCallData;
  const [isAnswer, setIsAnswer] = useState(false);
  const [isScale, setIsScale] = useState(false);
  const [isTimerIn, setIsTimerIn] = useState(false);
  const [groupMemberMap, setGroupMemberMap] = useState<GroupMemberMap>();
  const [loading, setLoading] = useState(false);
  const mediaWrapPx = useRef("");

  const isCallVideo = useMemo(() => {
    return mediaType === RealCallsType.Video;
  }, [mediaType]);

  const isGroup = useMemo(() => {
    return Boolean(conversation?.groupID);
  }, [conversation]);

  useEffect(() => {
    setIsAnswer(Boolean(defaultIsAnswer));
  }, [defaultIsAnswer]);

  const handleRoomConnected = async () => {
    if (!isSendMsg) return;
    const { data } = await IMSDK.createCustomMessage({
      data: JSON.stringify({
        type: mediaType,
        status: RealCallsStatus.Call,
        userIDs,
      }),
      extension: "",
      description: "",
    });
    await sendMessage({
      message: data,
    });
  };

  const handleGetUserInfo = async (userIDList: string[]) => {
    if (userIDList.length === 0 || !conversation?.groupID) return;
    const { data } = await IMSDK.getSpecifiedGroupMembersInfo({
      groupID: conversation?.groupID,
      userIDList,
    });
    const map: GroupMemberMap = {};
    data.forEach((v) => {
      const { userID } = v;
      map[userID] = v;
    });
    setGroupMemberMap(map);
  };

  const handleCloseModal = () => {
    closeOverlay();
    setIsScale(false);
    clearCurrentCallData();
    clearCurrentRoomStatus();
    setIsAnswer(false);
    setIsTimerIn(false);
    setGroupMemberMap(undefined);
    clearInterval(timer);
    setTimeout(() => {
      initTime = 0;
    }, 0);
  };

  const MyConference = () => {
    const room = useRoomContext();
    const [fullScreenKey, setFullScreenKey] = useState("");
    const tracks = useTracks();

    const showTracks = useMemo(() => {
      const map: {
        [propName: string]: MyTrackItem;
      } = {};
      tracks.forEach((trackReference) => {
        const identity = trackReference.participant.identity;
        if (!isAnswer && identity !== selfUserID) return;
        if (!map[identity]) {
          map[identity] = {
            [trackReference.source]: trackReference,
          };
        } else {
          map[identity][trackReference.source] = trackReference;
        }
      });
      console.log("xxx", tracks, map);
      return map;
    }, [tracks]);

    const showTracksKeys = useMemo(() => {
      const keys = Object.keys(showTracks);
      const len = keys.length;

      if (isGroup && len !== Object.keys(groupMemberMap || {}).length) {
        handleGetUserInfo(keys);
      }

      if (!isGroup && !fullScreenKey) {
        const otherUserId = keys.find((v) => v !== selfUserID);
        otherUserId && setFullScreenKey(otherUserId);
      }

      if (fullScreenKey) {
        mediaWrapPx.current = isGroup ? "40px" : "";
      } else {
        if (len <= 2) {
          mediaWrapPx.current = isGroup ? "40px" : "";
        } else if (len <= 4) {
          mediaWrapPx.current = "200px";
        } else if (len <= 6) {
          mediaWrapPx.current = "160px";
        } else {
          mediaWrapPx.current = "80px";
        }
      }
      return keys;
    }, [showTracks, fullScreenKey]);

    useEffect(() => {
      const len = showTracksKeys.length;
      len >= 2 && setIsTimerIn(true);
    }, [showTracksKeys]);

    const _handleCloseModal = () => {
      room.disconnect();
      handleCloseModal();
    };
    useEffect(() => {
      emitter.on("CLOSE_CALL_MODAL", _handleCloseModal);
      return () => {
        emitter.off("CLOSE_CALL_MODAL", _handleCloseModal);
      };
    }, []);

    const handleScale = () => {
      setIsScale(true);
      closeOverlay();
    };

    const handleInvite = () => {
      emitter.emit("OPEN_CHOOSE_MODAL", {
        type: "INVITE_TO_CALL",
        extraData: JSON.stringify({
          type: "invite",
          disabledUserID: showTracksKeys,
        }),
      });
    };

    return (
      <>
        <div className={String(styles["header_container"])}>
          <img
            className="cursor-pointer"
            src={scale_icon}
            alt=""
            onClick={handleScale}
            width="24"
          />
          <div className="mx-auto pt-2">
            <div className="text-3xl">{conversation?.showName}</div>
            <CallTimeWrap isTimeIn={isTimerIn} isReceive={isReceive}></CallTimeWrap>
          </div>
          {isGroup && (
            <img
              className="cursor-pointer"
              src={invite_icon}
              width="24"
              onClick={handleInvite}
            />
          )}
        </div>
        <div
          className={String(styles["room_media_wrap"])}
          style={{
            paddingLeft: mediaWrapPx.current,
            paddingRight: mediaWrapPx.current,
          }}
        >
          {fullScreenKey && showTracks[fullScreenKey] && (
            <MemberItemWrap
              key={fullScreenKey}
              identity={fullScreenKey}
              trackItem={showTracks[fullScreenKey]}
              tracksKeyLen={showTracksKeys.length}
              fullScreenKey={fullScreenKey}
              groupMemberItem={groupMemberMap?.[fullScreenKey]}
              conversation={conversation}
              currentRolevel={currentRolevel}
              mediaType={mediaType}
              setFullScreenKey={setFullScreenKey}
            ></MemberItemWrap>
          )}
          <div
            className={clsx(
              styles["room_media_wrap"],
              fullScreenKey && "max-h-[340px] max-w-[350px]",
            )}
          >
            {showTracksKeys
              .filter((key) => fullScreenKey !== key)
              .map((key) => (
                <MemberItemWrap
                  key={key}
                  identity={key}
                  trackItem={showTracks[key]}
                  tracksKeyLen={showTracksKeys.length}
                  fullScreenKey={fullScreenKey}
                  groupMemberItem={groupMemberMap?.[key]}
                  conversation={conversation}
                  currentRolevel={currentRolevel}
                  mediaType={mediaType}
                  setFullScreenKey={setFullScreenKey}
                ></MemberItemWrap>
              ))}
          </div>
        </div>
        <RoomSetting></RoomSetting>
      </>
    );
  };

  const RoomSetting = () => {
    const room = useRoomContext();
    const { localParticipant } = room;
    const { isCameraEnabled, isMicrophoneEnabled } = localParticipant;

    const handleMicrophone = () => {
      localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    };
    const handleCamera = () => {
      localParticipant.setCameraEnabled(!isCameraEnabled);
    };
    const handleAnswer = () => {
      setIsAnswer(true);
    };
    const handleHungup = async () => {
      // if (loading) return;
      // setLoading(true);
      await room.disconnect();
      handleCloseModal();
      if (!isTimerIn && !isGroup && conversation) {
        if (isReceive) {
          apiCallRefused({
            sendID: conversation.userID,
            conversationID: conversation.conversationID,
          });
          return;
        }
        const { data } = await IMSDK.createCustomMessage({
          data: JSON.stringify({
            type: mediaType,
            status: RealCallsStatus.Cancel,
          }),
          extension: "",
          description: "",
        });
        await sendMessage({
          message: data,
          recvID: conversation?.userID,
          groupID: conversation?.groupID,
        });
      }
      // setLoading(false);
    };

    return (
      <div className={String(styles["setting_container"])}>
        <img
          src={isMicrophoneEnabled ? microphone_active_icon : microphone_icon}
          onClick={() => handleMicrophone()}
          width={50}
        />
        <img
          src={isCameraEnabled ? camera_active_icon : camera_icon}
          onClick={() => handleCamera()}
          width={50}
        />
        {!isAnswer && (
          <img
            className="animate__animated animate__bounce animate__infinite"
            src={answer_icon}
            onClick={() => handleAnswer()}
            width={50}
          />
        )}
        <img src={hungup_icon} onClick={handleHungup} width={50} />
      </div>
    );
  };

  const ScaleContainer = () => {
    const dom = (
      <DraggableWrap rootStyle={{ left: "auto", right: 0, top: "50%" }}>
        <div
          className={`${styles["scale_container"]} ${
            (!isScale || isOverlayOpen) && "!hidden"
          }`}
          onDoubleClick={() => {
            setIsScale(false);
            openOverlay();
          }}
        >
          <img
            width={30}
            src={isCallVideo ? call_video_active : call_audio_active}
            alt=""
          />
          <div className="ml-1">
            <div className="a text-sm">{conversation?.showName}</div>
            <div className="text-xs">
              <CallTimeWrap isTimeIn={isTimerIn} isReceive={isReceive}></CallTimeWrap>
            </div>
          </div>
        </div>
      </DraggableWrap>
    );
    return ReactDOM.createPortal(dom, document.body);
  };

  return (
    <>
      <ScaleContainer></ScaleContainer>
      <DraggableModalWrap
        footer={null}
        title={null}
        centered
        maskClosable={false}
        closeIcon={null}
        open={isOverlayOpen}
        width={isGroup ? 900 : 480}
        ignoreClasses=".ignore_drag"
        className="no-padding-modal"
        destroyOnClose={!isOverlayOpen && !isScale}
      >
        <LiveKitRoom
          className={`ignore_drag ${styles["room_container"]} ${
            isGroup ? styles["group_container"] : styles["alone_container"]
          } no-scrollbar`}
          audio={true}
          video={isCallVideo}
          connect={true}
          token={localStorage.getItem("im-token") || token}
          serverUrl={thirdConfig?.livekit?.url}
          onConnected={handleRoomConnected}
        >
          <MyConference />
        </LiveKitRoom>
      </DraggableModalWrap>
    </>
  );
};

export default memo(forwardRef(RealCallsModal));

const CallTimeWrap = memo((props: { isTimeIn: boolean; isReceive?: boolean }) => {
  const { isTimeIn, isReceive } = props;
  const [callTime, setCallTime] = useState(initTime);

  useEffect(() => {
    if (!isTimeIn) return;
    timer = setInterval(() => {
      setCallTime((val) => {
        initTime = val + 1;
        return val + 1;
      });
    }, 1000);
    return () => {
      setCallTime(0);
      clearInterval(timer);
    };
  }, [isTimeIn]);

  const text = useMemo(() => {
    if (isReceive) {
      return "";
    }
    return "正在等待对方接受邀请...";
  }, []);

  return <>{callTime ? secondsToMS(callTime) : text}</>;
});

interface MemberItemWrapProps {
  identity: string;
  trackItem: MyTrackItem;
  tracksKeyLen: number;
  fullScreenKey: string;
  groupMemberItem?: GroupMemberItem;
  conversation?: ConversationItem;
  currentRolevel: number;
  mediaType: RealCallsType;
  setFullScreenKey: (val: string) => void;
}
const _MemberItemWrap = (props: MemberItemWrapProps) => {
  const {
    identity,
    trackItem,
    tracksKeyLen,
    fullScreenKey,
    groupMemberItem,
    conversation,
    currentRolevel,
    mediaType,
    setFullScreenKey,
  } = props;
  const { selfInfo } = useUserStore();

  const selfUserID = useMemo(() => selfInfo.userID, [selfInfo]);
  const isGroup = useMemo(() => {
    return Boolean(conversation?.groupID);
  }, [conversation]);

  const { camera: cameraTrack, microphone: microphoneTrack } = trackItem;
  const { isCameraEnabled } = cameraTrack?.participant || {};
  const { isMicrophoneEnabled, isSpeaking } = microphoneTrack?.participant || {};
  const isFullScreen = useMemo(() => {
    if (isGroup) {
      return identity === fullScreenKey;
    }
    return identity === (fullScreenKey || selfUserID);
  }, [identity, selfUserID, fullScreenKey, isGroup]);

  const _menuList = useMemo(() => {
    return menuList.filter((v) => {
      switch (v.idx) {
        case 1:
          return groupMemberItem && groupMemberItem.roleLevel < currentRolevel;
      }
    });
  }, [groupMemberItem, currentRolevel]);

  const size = useMemo(() => {
    if (isGroup) {
      if (isFullScreen) return "340px";
      return tracksKeyLen > 2 ? "170px" : "340px";
    }
    return "100%";
  }, [isGroup, tracksKeyLen, isFullScreen]);

  const handleClick = async (idx: menuItemType["idx"]) => {
    if (!conversation) return;
    switch (idx) {
      case 1:
        try {
          await apiCallInviteOrKick({
            userIDs: [identity],
            roomName: conversation.conversationID,
            opType: RealCallOpStatus.Kick,
            type: mediaType,
          });
          feedbackToast({
            msg: `成员 ${groupMemberItem?.nickname} 已被踢出通话`,
          });
        } catch {
          feedbackToast({ msg: `操作失败`, error: "1" });
        }
        break;
    }
  };

  const UserAvatar = memo(({ identity }: { identity: string }) => {
    const isSelf = identity === selfUserID;
    let src = conversation?.faceURL;
    let text = conversation?.showName;
    if (isSelf) {
      src = selfInfo.faceURL;
      text = selfInfo.nickname;
    } else if (isGroup && groupMemberItem) {
      const { faceURL, nickname } = groupMemberItem;
      src = faceURL;
      text = nickname;
    }
    return <OIMAvatar src={src} text={text} size={98}></OIMAvatar>;
  });

  const handleSetFullScreenKey = () => {
    if (isGroup) {
      tracksKeyLen > 2 && setFullScreenKey(identity === fullScreenKey ? "" : identity);
    } else {
      setFullScreenKey(identity);
    }
  };

  return (
    <MyPopover
      menuList={_menuList}
      open={_menuList.length ? undefined : false}
      trigger="contextMenu"
      rootClassName="ignore_drag"
      actionClick={handleClick}
    >
      <div
        className={clsx(
          styles["room_media_item"],
          !isFullScreen && styles["notFullScreen"],
        )}
        onClick={handleSetFullScreenKey}
        style={{
          width: size,
          height: size,
        }}
      >
        {isCameraEnabled ? (
          <VideoTrack {...cameraTrack} />
        ) : (
          <UserAvatar identity={identity}></UserAvatar>
        )}
        {isMicrophoneEnabled && <AudioTrack {...microphoneTrack} />}
        {isGroup && (
          <div className="absolute bottom-0 left-2 flex h-8 items-center">
            <div className="mr-1 text-white">
              {(groupMemberItem && groupMemberItem.nickname) || ""}
            </div>
            {isSpeaking && <img src={speak_icon} alt="" width={26} />}
            {!isMicrophoneEnabled && <img src={disable_microphone} alt="" width={26} />}
          </div>
        )}
      </div>
    </MyPopover>
  );
};
const MemberItemWrap = memo(_MemberItemWrap);

const menuList: menuItemType[] = [
  {
    idx: 1,
    title: "踢出",
    icon: delete_png,
  },
];
