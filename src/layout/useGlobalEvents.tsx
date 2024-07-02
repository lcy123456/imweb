import { useLatest } from "ahooks";
import {
  CbEvents,
  MessageReceiveOptType,
  MessageType,
  SessionType,
} from "open-im-sdk-wasm";
import {
  BlackUserItem,
  ConversationItem,
  FriendApplicationItem,
  FriendUserItem,
  GroupApplicationItem,
  GroupItem,
  GroupMemberItem,
  ReceiptInfo,
  RevokedInfo,
  SelfUserInfo,
  WSEvent,
  WsResponse,
} from "open-im-sdk-wasm/lib/types/entity";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { modal } from "@/AntdGlobalComp";
import { API_URL, WS_URL } from "@/config";
import {
  _CbEvents,
  _MessageType,
  CallMessagetTypes,
  CustomBusinessMessageKeyMap,
  PlayType,
  RealCallsStatus,
  TokenCodeKey,
} from "@/constants";
import { CustomElemData } from "@/pages/chat/queryChat/MessageItem/CustomMessageRenderer";
import {
  ExMessageItem,
  useConversationStore,
  useMessageStore,
  useRealCallStore,
  useUserStore,
} from "@/store";
import { useContactStore } from "@/store/contact";
import { CurrentCallData } from "@/store/type";
import { CustomBusinessMessage } from "@/types/common";
import { feedbackToast } from "@/utils/common";
import emitter from "@/utils/events";
import {
  idsGetConversationID,
  initStore,
  isEditMessage,
  isLikeMessage,
} from "@/utils/imCommon";
import { getIMToken, getIMUserID } from "@/utils/storage";

import { IMSDK } from "./MainContentWrap";

let typingStatusTimer: NodeJS.Timeout;

export function useGlobalEvent() {
  const navigate = useNavigate();
  const [connectState, setConnectState] = useState({
    isSyncing: false,
    isLogining: false,
    isConnecting: false,
  });
  const latestConnectState = useLatest(connectState);
  const [forceUpdateIM, setForceUpdateIM] = useState(0);

  const { updateSelfInfo, clearLoginInfo, updateConnectState, forceLogout } =
    useUserStore();
  const {
    updateTypingStatus,
    updateConversationList,
    updateUnReadCount,
    updateCurrentGroupInfo,
    getCurrentGroupInfoByReq,
    getCurrentMemberInGroupByReq,
    tryUpdateCurrentMemberInGroup,
  } = useConversationStore();
  const { pushNewMessage, updateOneMessage, deleteOneMessage } = useMessageStore();
  const {
    updateFriend,
    pushNewFriend,
    updateBlack,
    pushNewBlack,
    updateGroup,
    pushNewGroup,
    updateRecvFriendApplication,
    updateSendFriendApplication,
    updateRecvGroupApplication,
    updateSendGroupApplication,
  } = useContactStore();

  useEffect(() => {
    setIMListener();
    tryLogin();
    return () => {
      disposeIMListener();
    };
  }, [forceUpdateIM]);

  useEffect(() => {
    const forceUpdate = () => {
      setForceUpdateIM((val) => val + 1);
    };
    emitter.on("FORCE_UPDATE_IM", forceUpdate);
    return () => {
      emitter.off("FORCE_UPDATE_IM", forceUpdate);
    };
  }, []);

  useEffect(() => {
    updateConnectState(connectState);
  }, [connectState]);

  const tryLogin = async () => {
    setConnectState((state) => ({ ...state, isLogining: true }));
    const IMToken = await getIMToken();
    const IMUserID = await getIMUserID();
    if (IMToken && IMUserID) {
      try {
        await IMSDK.login({
          userID: IMUserID,
          token: IMToken,
          platformID: window.electronAPI?.getPlatform() ?? 5,
          apiAddr: API_URL,
          wsAddr: WS_URL,
        });
        initStore();
        console.log("IMSDK login success");
      } catch (error) {
        console.error(error);
        if ((error as WsResponse).errCode !== 10102) {
          clearLoginInfo();
        }
      }
    }
    setConnectState((state) => ({ ...state, isLogining: false }));
  };

  const setIMListener = () => {
    // account
    IMSDK.on(CbEvents.OnSelfInfoUpdated, selfUpdateHandler);
    IMSDK.on(CbEvents.OnConnecting, connectingHandler);
    IMSDK.on(CbEvents.OnConnectFailed, connectFailedHandler);
    IMSDK.on(CbEvents.OnConnectSuccess, connectSuccessHandler);
    IMSDK.on(CbEvents.OnKickedOffline, kickHandler);
    IMSDK.on(CbEvents.OnUserTokenExpired, expiredHandler);
    // sync
    IMSDK.on(CbEvents.OnSyncServerStart, syncStartHandler);
    IMSDK.on(CbEvents.OnSyncServerFinish, syncFinishHandler);
    IMSDK.on(CbEvents.OnSyncServerFailed, syncFailedHandler);
    // message
    IMSDK.on(CbEvents.OnRecvNewMessage, newMessageHandler);
    IMSDK.on(CbEvents.OnRecvNewMessages, newMessageHandler);
    IMSDK.on(CbEvents.OnNewRecvMessageRevoked, revokedMessageHandler);
    IMSDK.on(CbEvents.OnRecvC2CReadReceipt, c2cReadReceiptHandler);
    IMSDK.on(CbEvents.OnRecvGroupReadReceipt, c2cReadGroupReceiptHandler);
    IMSDK.on(_CbEvents.OnMsgDeleted as unknown as CbEvents, deletedMessageHandler);
    IMSDK.on(CbEvents.OnRecvCustomBusinessMessage, customBusinessMessageHandle);
    // conversation
    IMSDK.on(CbEvents.OnConversationChanged, conversationChnageHandler);
    IMSDK.on(CbEvents.OnNewConversation, newConversationHandler);
    IMSDK.on(CbEvents.OnTotalUnreadMessageCountChanged, totalUnreadChangeHandler);
    // friend
    IMSDK.on(CbEvents.OnFriendInfoChanged, friednInfoChangeHandler);
    IMSDK.on(CbEvents.OnFriendAdded, friednAddedHandler);
    IMSDK.on(CbEvents.OnFriendDeleted, friednDeletedHandler);
    // blacklist
    IMSDK.on(CbEvents.OnBlackAdded, blackAddedHandler);
    IMSDK.on(CbEvents.OnBlackDeleted, blackDeletedHandler);
    // group
    IMSDK.on(CbEvents.OnJoinedGroupAdded, joinedGroupAddedHandler);
    IMSDK.on(CbEvents.OnJoinedGroupDeleted, joinedGroupDeletedHandler);
    IMSDK.on(CbEvents.OnGroupInfoChanged, groupInfoChangedHandler);
    IMSDK.on(CbEvents.OnGroupMemberAdded, groupMemberAddedHandler);
    IMSDK.on(CbEvents.OnGroupMemberDeleted, groupMemberDeletedHandler);
    IMSDK.on(CbEvents.OnGroupMemberInfoChanged, groupMemberInfoChangedHandler);
    // application
    IMSDK.on(CbEvents.OnFriendApplicationAdded, friendApplicationProcessedHandler);
    IMSDK.on(CbEvents.OnFriendApplicationAccepted, friendApplicationProcessedHandler);
    IMSDK.on(CbEvents.OnFriendApplicationRejected, friendApplicationProcessedHandler);
    IMSDK.on(CbEvents.OnGroupApplicationAdded, groupApplicationProcessedHandler);
    IMSDK.on(CbEvents.OnGroupApplicationAccepted, groupApplicationProcessedHandler);
    IMSDK.on(CbEvents.OnGroupApplicationRejected, groupApplicationProcessedHandler);
  };

  const selfUpdateHandler = ({ data }: WSEvent<SelfUserInfo>) => {
    updateSelfInfo(data);
  };
  const connectingHandler = () => {
    console.log("connecting...");
    setConnectState((state) => ({ ...state, isConnecting: true }));
  };
  const connectFailedHandler = ({ errCode }: WSEvent) => {
    setConnectState((state) => ({ ...state, isConnecting: true }));
    if (TokenCodeKey.includes(errCode)) {
      feedbackToast({
        msg: "当前登录已过期,请重新登录",
        error: "connectFaile",
        onClose: () => {
          forceLogout();
        },
      });
    }
  };
  const connectSuccessHandler = () => {
    console.log("connect success...");
    setConnectState((state) => ({ ...state, isConnecting: false }));
  };
  const kickHandler = () => tryOut("您的账号已退出,请重新登录");
  const expiredHandler = () => tryOut("当前登录已过期,请重新登录");

  const tryOut = (msg: string) =>
    feedbackToast({
      msg,
      error: "kick or expired",
      onClose: () => {
        clearLoginInfo();
      },
    });

  // sync
  const syncStartHandler = () => {
    setConnectState((state) => ({ ...state, isSyncing: true }));
  };
  const syncFinishHandler = () => {
    setConnectState((state) => ({ ...state, isSyncing: false }));
    emitter.emit("SYNC_LOAD_MESSAGE_REVERSE", null);
  };
  const syncFailedHandler = () => {
    feedbackToast({ msg: "同步失败！", error: "同步失败！" });
    setConnectState((state) => ({ ...state, isSyncing: false }));
  };

  // message
  const newMessageHandler = ({ data }: WSEvent<ExMessageItem | ExMessageItem[]>) => {
    if (latestConnectState.current.isSyncing) return;
    if (!Array.isArray(data)) {
      data = [data];
    }
    console.log("newMessageHandler", data);
    data.forEach((message) => {
      handleNewMessage(message);
    });
  };

  const revokedMessageHandler = ({ data }: WSEvent<RevokedInfo>) => {
    updateOneMessage({
      clientMsgID: data.clientMsgID,
      contentType: MessageType.RevokeMessage,
      notificationElem: {
        detail: JSON.stringify(data),
      },
    } as ExMessageItem);
  };

  const c2cReadReceiptHandler = ({ data }: WSEvent<ReceiptInfo[]>) => {
    if (
      data[0].userID !== useConversationStore.getState().currentConversation?.userID
    ) {
      return;
    }

    data.forEach((item) => {
      item.msgIDList.forEach((msgID) => {
        updateOneMessage({
          clientMsgID: msgID,
          isRead: true,
        } as ExMessageItem);
      });
    });
  };

  const c2cReadGroupReceiptHandler = ({ data }: WSEvent<ReceiptInfo[]>) => {
    console.log("c2cReadGroupReceiptHandler", data);
    const { currentConversation } = useConversationStore.getState();
    if (data[0].groupID !== currentConversation?.groupID) return;

    data.forEach((item) => {
      item.msgIDList?.forEach((msgID) => {
        updateOneMessage({
          clientMsgID: msgID,
          isRead: true,
        } as ExMessageItem);
      });
    });
  };

  const deletedMessageHandler = ({
    data,
  }: WSEvent<ExMessageItem | ExMessageItem[]>) => {
    if (!Array.isArray(data)) {
      data = [data];
    }
    console.log("deletedMessageHandler", data);
    data.forEach((message) => {
      deleteOneMessage(message.clientMsgID);
    });
  };

  const customBusinessMessageHandle = ({ data }: WSEvent<CustomBusinessMessage>) => {
    console.log("customMessageHandler", data);
    const keyToFnMap = {
      [CustomBusinessMessageKeyMap.VideoKick]: handleKickCall,
      [CustomBusinessMessageKeyMap.VideoInvite]: () => handleInviteCall(data.data),
      [CustomBusinessMessageKeyMap.ModifyMessage]: () => handleModifyMessage(data.data),
      [CustomBusinessMessageKeyMap.ReadMsg]: () => handleReadMessage(data.data),
      [CustomBusinessMessageKeyMap.Reload]: () => window.location.reload(),
    };
    keyToFnMap[data.key]?.();
  };

  const notPushType = [MessageType.TypingMessage, MessageType.RevokeMessage];

  const handleNewMessage = (newServerMsg: ExMessageItem) => {
    const { contentType, typingElem } = newServerMsg;
    if (inCurrentConversation(newServerMsg)) {
      const { historyMessageList } = useMessageStore.getState();
      const isExist = historyMessageList.some(
        (v) => v.clientMsgID === newServerMsg.clientMsgID,
      );
      if (!notPushType.includes(contentType) && !isExist) {
        pushNewMessage(newServerMsg);
        emitter.emit("CHAT_LIST_SCROLL_TO_BOTTOM", true);
      } else if (contentType === MessageType.TypingMessage) {
        updateTypingStatus(typingElem.msgTips);
        clearTimeout(typingStatusTimer);
        typingStatusTimer = setTimeout(() => {
          updateTypingStatus("");
        }, 1000);
      }
    }
    !notPushType.includes(contentType) && handlePlayAudio(newServerMsg);
  };

  const inCurrentConversation = (newServerMsg: ExMessageItem) => {
    switch (newServerMsg.sessionType) {
      case SessionType.Single:
        return (
          newServerMsg.sendID ===
            useConversationStore.getState().currentConversation?.userID ||
          (newServerMsg.sendID === useUserStore.getState().selfInfo.userID &&
            newServerMsg.recvID ===
              useConversationStore.getState().currentConversation?.userID)
        );
      case SessionType.Group:
      case SessionType.WorkingGroup:
        return (
          newServerMsg.groupID ===
          useConversationStore.getState().currentConversation?.groupID
        );
      case SessionType.Notification:
        return (
          newServerMsg.sendID ===
          useConversationStore.getState().currentConversation?.userID
        );
      default:
        return false;
    }
  };

  const handlePlayAudio = (message: ExMessageItem) => {
    if (isEditMessage(message) || isLikeMessage(message)) return;
    const conversationID = idsGetConversationID(message);
    const { conversationList } = useConversationStore.getState();
    const { selfInfo } = useUserStore.getState();
    const { currentCallData } = useRealCallStore.getState();

    let conversation = conversationList.find(
      (v) => v.conversationID === conversationID,
    );
    if (!conversation) return;
    conversation = {
      ...conversation,
      latestMsg: JSON.stringify(message),
    };

    let isPlay = false;
    let isCallData: CurrentCallData | undefined;

    const { sendID, contentType, customElem, notificationElem, atTextElem } = message;

    const isSelfSender = sendID === selfInfo.userID;

    if (!isSelfSender) {
      isPlay =
        (contentType === MessageType.AtTextMessage && atTextElem.isAtSelf) ||
        (selfInfo.globalRecvMsgOpt === MessageReceiveOptType.Nomal &&
          conversation.recvMsgOpt === MessageReceiveOptType.Nomal);
    }
    if ([MessageType.CustomMessage, _MessageType.RealCallEnded].includes(contentType)) {
      const data = customElem?.data || notificationElem?.detail || "{}";
      const { type, status, userIDs } = JSON.parse(data) as CustomElemData;
      if (
        isSelfSender &&
        ![
          RealCallsStatus.Success,
          RealCallsStatus.NotRes,
          RealCallsStatus.Reject,
        ].includes(status)
      )
        return;
      if (CallMessagetTypes.includes(type)) {
        isCallData = {
          type,
          status,
          conversation,
          isReceive: true,
          userIDs,
        };
      }
    }
    if (isCallData) {
      const isControlCurrentCall =
        isCallData.conversation?.conversationID ===
        currentCallData.conversation?.conversationID;
      // console.log("isControlCurrentCall", isControlCurrentCall);
      switch (isCallData.status) {
        case RealCallsStatus.Call:
          if (currentCallData.conversation) return;
          isCallData.userIDs?.includes(selfInfo.userID) &&
            emitter.emit("OPEN_CALL_NOTIFY", isCallData);
          break;
        case RealCallsStatus.Reject:
        case RealCallsStatus.Success:
        case RealCallsStatus.Cancel:
        case RealCallsStatus.NotRes:
          emitter.emit("CLOSE_CALL_NOTIFY", isCallData);
          isControlCurrentCall && emitter.emit("CLOSE_CALL_MODAL", null);
          break;
      }
    } else if (isPlay) {
      emitter.emit("PLAY_MESSAGE_AUDIO", {
        type: PlayType.NewMessage,
        conversation,
      });
    }
  };

  const handleKickCall = () => {
    emitter.emit("CLOSE_CALL_MODAL", null);
    modal.info({
      title: "结束通话",
      content: "您已被管理员移除通话",
    });
  };

  const handleInviteCall = (data: string) => {
    const { type, roomName } = JSON.parse(data) as CurrentCallData & {
      roomName: string;
    };
    const { conversationList } = useConversationStore.getState();
    const conversation = conversationList.find((v) => v.conversationID === roomName);
    emitter.emit("OPEN_CALL_NOTIFY", {
      type,
      status: RealCallsStatus.Call,
      isReceive: true,
      conversation,
    });
  };

  const handleModifyMessage = (data: string) => {
    const { clientMsgID, ex, textElem, atTextElem, quoteElem } = JSON.parse(
      data || "{}",
    ) as ExMessageItem;
    if (!clientMsgID) return;
    updateOneMessage({
      clientMsgID,
      ex,
      textElem,
      atTextElem,
      quoteElem,
    } as ExMessageItem);
  };

  const handleReadMessage = (data: string) => {
    if (!data) return;
    const _data = JSON.parse(data) as ReceiptInfo[];
    const { currentConversation } = useConversationStore.getState();
    if (_data[0].groupID !== currentConversation?.groupID) return;

    _data.forEach((item) => {
      item.msgIDList?.forEach((msgID) => {
        updateOneMessage({
          clientMsgID: msgID,
          isRead: true,
        } as ExMessageItem);
      });
    });
  };

  // conversation
  const conversationChnageHandler = ({ data }: WSEvent<ConversationItem[]>) => {
    console.log("conversationChnage", data);
    updateConversationList(data, "filter");
  };
  const newConversationHandler = ({ data }: WSEvent<ConversationItem[]>) => {
    console.log("conversationNew", data);
    updateConversationList(data, "push");
  };
  const totalUnreadChangeHandler = ({ data }: WSEvent<number>) => {
    updateUnReadCount(data);
  };

  // friend
  const friednInfoChangeHandler = ({ data }: WSEvent<FriendUserItem>) => {
    updateFriend(data);
  };
  const friednAddedHandler = ({ data }: WSEvent<FriendUserItem>) => {
    pushNewFriend(data);
  };
  const friednDeletedHandler = ({ data }: WSEvent<FriendUserItem>) => {
    updateFriend(data, true);
  };

  // blacklist
  const blackAddedHandler = ({ data }: WSEvent<BlackUserItem>) => {
    pushNewBlack(data);
  };
  const blackDeletedHandler = ({ data }: WSEvent<BlackUserItem>) => {
    updateBlack(data, true);
  };

  // group
  const joinedGroupAddedHandler = ({ data }: WSEvent<GroupItem>) => {
    if (data.groupID === useConversationStore.getState().currentConversation?.groupID) {
      updateCurrentGroupInfo(data);
    }
    pushNewGroup(data);
  };
  const joinedGroupDeletedHandler = ({ data }: WSEvent<GroupItem>) => {
    if (data.groupID === useConversationStore.getState().currentConversation?.groupID) {
      getCurrentGroupInfoByReq(data.groupID);
      getCurrentMemberInGroupByReq(data.groupID);
    }
    updateGroup(data, true);
  };
  const groupInfoChangedHandler = ({ data }: WSEvent<GroupItem>) => {
    updateGroup(data);
    if (data.groupID === useConversationStore.getState().currentConversation?.groupID) {
      updateCurrentGroupInfo(data);
    }
  };
  const groupMemberAddedHandler = ({ data }: WSEvent<GroupMemberItem>) => {
    if (
      data.groupID === useConversationStore.getState().currentConversation?.groupID &&
      data.userID === useUserStore.getState().selfInfo.userID
    ) {
      getCurrentMemberInGroupByReq(data.groupID);
    }
    console.log("groupMemberAddedHandler");
  };
  const groupMemberDeletedHandler = () => {
    console.log("groupMemberDeletedHandler");
  };
  const groupMemberInfoChangedHandler = ({ data }: WSEvent<GroupMemberItem>) => {
    tryUpdateCurrentMemberInGroup(data);
  };

  //application
  const friendApplicationProcessedHandler = ({
    data,
  }: WSEvent<FriendApplicationItem>) => {
    const isRecv = data.toUserID === useUserStore.getState().selfInfo.userID;
    if (isRecv) {
      updateRecvFriendApplication(data);
    } else {
      updateSendFriendApplication(data);
    }
  };
  const groupApplicationProcessedHandler = ({
    data,
  }: WSEvent<GroupApplicationItem>) => {
    const isRecv = data.userID !== useUserStore.getState().selfInfo.userID;
    if (isRecv) {
      updateRecvGroupApplication(data);
    } else {
      updateSendGroupApplication(data);
    }
  };

  const disposeIMListener = () => {
    IMSDK.off(CbEvents.OnSelfInfoUpdated, selfUpdateHandler);
    IMSDK.off(CbEvents.OnConnecting, connectingHandler);
    IMSDK.off(CbEvents.OnConnectFailed, connectFailedHandler);
    IMSDK.off(CbEvents.OnConnectSuccess, connectSuccessHandler);
    IMSDK.off(CbEvents.OnKickedOffline, kickHandler);
    IMSDK.off(CbEvents.OnUserTokenExpired, expiredHandler);
    // sync
    IMSDK.off(CbEvents.OnSyncServerStart, syncStartHandler);
    IMSDK.off(CbEvents.OnSyncServerFinish, syncFinishHandler);
    IMSDK.off(CbEvents.OnSyncServerFailed, syncFailedHandler);
    // message
    IMSDK.off(CbEvents.OnRecvNewMessage, newMessageHandler);
    IMSDK.off(CbEvents.OnRecvNewMessages, newMessageHandler);
    IMSDK.off(CbEvents.OnNewRecvMessageRevoked, revokedMessageHandler);
    IMSDK.off(CbEvents.OnRecvC2CReadReceipt, c2cReadReceiptHandler);
    IMSDK.off(CbEvents.OnRecvGroupReadReceipt, c2cReadGroupReceiptHandler);
    IMSDK.off(_CbEvents.OnMsgDeleted as unknown as CbEvents, deletedMessageHandler);
    IMSDK.off(CbEvents.OnRecvCustomBusinessMessage, customBusinessMessageHandle);
    // conversation
    IMSDK.off(CbEvents.OnConversationChanged, conversationChnageHandler);
    IMSDK.off(CbEvents.OnNewConversation, newConversationHandler);
    IMSDK.off(CbEvents.OnTotalUnreadMessageCountChanged, totalUnreadChangeHandler);
    // friend
    IMSDK.off(CbEvents.OnFriendInfoChanged, friednInfoChangeHandler);
    IMSDK.off(CbEvents.OnFriendAdded, friednAddedHandler);
    IMSDK.off(CbEvents.OnFriendDeleted, friednDeletedHandler);
    // blacklist
    IMSDK.off(CbEvents.OnBlackAdded, blackAddedHandler);
    IMSDK.off(CbEvents.OnBlackDeleted, blackDeletedHandler);
    // group
    IMSDK.off(CbEvents.OnJoinedGroupAdded, joinedGroupAddedHandler);
    IMSDK.off(CbEvents.OnJoinedGroupDeleted, joinedGroupDeletedHandler);
    IMSDK.off(CbEvents.OnGroupInfoChanged, groupInfoChangedHandler);
    IMSDK.off(CbEvents.OnGroupMemberAdded, groupMemberAddedHandler);
    IMSDK.off(CbEvents.OnGroupMemberDeleted, groupMemberDeletedHandler);
    IMSDK.off(CbEvents.OnGroupMemberInfoChanged, groupMemberInfoChangedHandler);
    // application
    IMSDK.off(CbEvents.OnFriendApplicationAdded, friendApplicationProcessedHandler);
    IMSDK.off(CbEvents.OnFriendApplicationAccepted, friendApplicationProcessedHandler);
    IMSDK.off(CbEvents.OnFriendApplicationRejected, friendApplicationProcessedHandler);
    IMSDK.off(CbEvents.OnGroupApplicationAdded, groupApplicationProcessedHandler);
    IMSDK.off(CbEvents.OnGroupApplicationAccepted, groupApplicationProcessedHandler);
    IMSDK.off(CbEvents.OnGroupApplicationRejected, groupApplicationProcessedHandler);
  };

  return [connectState];
}
