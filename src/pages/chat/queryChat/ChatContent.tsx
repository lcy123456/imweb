import { useRequest } from "ahooks";
import { Layout } from "antd";
import dayjs from "dayjs";
import { MessageStatus, MessageType, SessionType } from "open-im-sdk-wasm";
import { MessageItem } from "open-im-sdk-wasm/lib/types/entity";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ListRange, Virtuoso, VirtuosoHandle } from "react-virtuoso";

import { apiGetRoomStatus } from "@/api/chatApi";
import { RealCallsStatus, SystemMessageTypes } from "@/constants/im";
import BacktoBottom from "@/pages/chat/queryChat/BacktoBottom";
import {
  ExMessageItem,
  useConversationStore,
  useMessageStore,
  useRealCallStore,
  useUserStore,
} from "@/store";
import {
  CurrentCallData,
  historyMessageListReverseApiParams,
  IAdvancedMessageRes,
} from "@/store/type";
import emitter from "@/utils/events";

import MessageItemRender from "./MessageItem";
import PinnedMessage from "./PinnedMessage";
import SystemNotification from "./SystemNotification";

const START_INDEX = 10000;
const INITIAL_ITEM_COUNT = 40;
let timer: NodeJS.Timeout;
let roomStatusTimer: NodeJS.Timeout;
let recordTimer: NodeJS.Timeout;

const ChatContent = () => {
  const navigate = useNavigate();
  const { conversationID = "" } = useParams();
  const { state } = useLocation() as {
    state?: {
      message: MessageItem;
    };
  };
  const { currentConversation } = useConversationStore();
  const {
    currentCallData,
    currentRoomStatus,
    updateCurrentRoomStatus,
    clearCurrentRoomStatus,
  } = useRealCallStore();
  const selfUserID = useUserStore((state) => state.selfInfo.userID);
  const {
    historyMessageList,
    hasMore: hasMoreMessage,
    hasEndMore: hasEndMoreMessage,
    getHistoryMessageListApi,
    getHistoryMessageListReverseApi,
    clearHistoryMessage,
    getPinnedMessageList,
  } = useMessageStore();
  const isSingle = currentConversation?.conversationType === SessionType.Single;

  const virtuoso = useRef<VirtuosoHandle>(null);

  const [forceUpdate, setForceUpdate] = useState(0);
  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);
  const [initialCount, setInitialCount] = useState(INITIAL_ITEM_COUNT);
  const [scrollMessageId, setScrollMessageId] = useState("");
  const [messageList, setMessageList] = useState<MessageItem[]>([]);
  const isManualUpdate = useRef(false);
  const [showBacktoView, setShowBacktoView] = useState(false);
  const [isGetContext, setIsGetContext] = useState(false);
  const [backtoViewNoRead, setBacktoViewNoRead] = useState(0);
  const latestSucceedMesaage = useRef<MessageItem>();

  const {
    loading: historyMessageLoading,
    runAsync: historyMessageListApiRun,
    cancel: historyMessageCancel,
  } = useRequest(getHistoryMessageListApi, {
    manual: true,
  });
  const {
    loading: historyMessageReverseLoading,
    runAsync: historyMessageListRerverApiRun,
    cancel: historyMessageRerverCancel,
  } = useRequest(getHistoryMessageListReverseApi, {
    manual: true,
  });

  useEffect(() => {
    getPinnedMessageList(true);
    !state?.message && handleGetHistoryMessage(false);
    const handleSyncLoadMessageReverse = () => {
      // console.log("xxx 断线获取数据", latestSucceedMesaage.current);
      // handleGetHistoryMessageReverse(latestSucceedMesaage.current);
      handleReloadMessage();
    };
    emitter.on("SYNC_LOAD_MESSAGE_REVERSE", handleSyncLoadMessageReverse);
    return () => {
      historyMessageCancel();
      historyMessageRerverCancel();
      emitter.off("SYNC_LOAD_MESSAGE_REVERSE", handleSyncLoadMessageReverse);
    };
  }, []);

  useEffect(() => {
    latestSucceedMesaage.current = [...historyMessageList]
      .reverse()
      .find((v) => v.status === MessageStatus.Succeed);
    if (isManualUpdate.current) return;
    // console.log("isManualUpdate 非手动拉取数据");
    setMessageList(historyMessageList);
  }, [historyMessageList]);

  useEffect(() => {
    if (!state?.message) return;
    // console.log("state", state.message);
    clearTimeout(recordTimer);
    recordTimer = setTimeout(() => {
      handleScrollToMessage(state.message);
      navigate(`/home/chat/${conversationID}`, {
        state: undefined,
      });
    }, 500);
  }, [state]);

  useEffect(() => {
    const toBottomHandle = (isReceive: boolean) => {
      if (isReceive && showBacktoView) {
        setBacktoViewNoRead((val) => val + 1);
        return;
      } else if (hasEndMoreMessage) {
        backtoBottomHandle();
        return;
      }
      console.log("toBottomHandle", START_INDEX);
      setTimeout(
        () => {
          virtuoso.current?.scrollToIndex({
            index: START_INDEX,
            behavior: "smooth",
          });
        },
        isReceive ? 500 : 100,
      );
    };
    emitter.on("CHAT_LIST_SCROLL_TO_BOTTOM", toBottomHandle);
    return () => {
      emitter.off("CHAT_LIST_SCROLL_TO_BOTTOM", toBottomHandle);
    };
  }, [showBacktoView, hasEndMoreMessage]);

  const handleGetHistoryMessage = useCallback(async (loadMore = false) => {
    try {
      isManualUpdate.current = true;
      const res = (await historyMessageListApiRun(loadMore)) as IAdvancedMessageRes;
      if (!res) return;
      setMessageList((val) => [...res.messageList, ...(loadMore ? val : [])]);
      const len = res.messageList.length;
      if (loadMore) {
        setFirstItemIndex((val) => val - len);
      }
      return len;
    } finally {
      isManualUpdate.current = false;
    }
  }, []);
  const loadMoreMessage = useCallback(() => {
    if (historyMessageLoading || !hasMoreMessage) return;
    handleGetHistoryMessage(true);
    return false;
  }, [historyMessageLoading, hasMoreMessage, handleGetHistoryMessage]);

  const handleGetHistoryMessageReverse = useCallback(
    async (params?: historyMessageListReverseApiParams) => {
      try {
        isManualUpdate.current = true;
        const res = (await historyMessageListRerverApiRun(
          params,
        )) as IAdvancedMessageRes;
        if (!res) return;
        setMessageList((val) => [...val, ...res.messageList]);
      } finally {
        isManualUpdate.current = false;
      }
    },
    [],
  );
  const loadEndMoreMessage = useCallback(() => {
    console.log("loadEndMoreMessage", historyMessageReverseLoading, hasEndMoreMessage);
    if (isGetContext || historyMessageReverseLoading || !hasEndMoreMessage) return;
    handleGetHistoryMessageReverse();
    return false;
  }, [
    historyMessageReverseLoading,
    hasEndMoreMessage,
    // isBackToBottom,
    handleGetHistoryMessageReverse,
  ]);

  const rangeChanged = (rang: ListRange) => {
    const flag =
      hasEndMoreMessage || rang.endIndex < firstItemIndex + messageList.length - 5;
    setShowBacktoView(flag);
    if (!flag) {
      setBacktoViewNoRead(0);
    }
  };

  useEffect(() => {
    emitter.on("CHAT_LIST_SCROLL_TO_MESSAGE", handleScrollToMessage);
    return () => {
      emitter.off("CHAT_LIST_SCROLL_TO_MESSAGE", handleScrollToMessage);
    };
  }, [messageList]);
  const handleScrollToMessage = (message: MessageItem) => {
    const { clientMsgID } = message;
    const index = messageList.findIndex((v) => v.clientMsgID === clientMsgID);
    if (index === -1) {
      getScrollMessageContext(message);
      return;
    }
    handleScrollMessageId(clientMsgID);
    virtuoso.current?.scrollToIndex({ index, behavior: "smooth" });
  };
  const handleScrollMessageId = (clientMsgID: string) => {
    setScrollMessageId("");
    setTimeout(() => {
      setScrollMessageId(clientMsgID);
    }, 0);
    clearTimeout(timer);
    timer = setTimeout(() => {
      setScrollMessageId("");
    }, 2000);
  };
  const getScrollMessageContext = async (message: MessageItem) => {
    // console.log("getScrollMessageContext");
    setIsGetContext(true);
    clearHistoryMessage();
    setMessageList([]);
    setFirstItemIndex(START_INDEX);
    await handleGetHistoryMessageReverse({
      clientMsgID: message.clientMsgID,
      seq: message.seq,
    });
    const len = await handleGetHistoryMessage(true);
    setInitialCount(len || 0);
    setForceUpdate(Date.now());
    handleScrollMessageId(message.clientMsgID);
    setIsGetContext(false);
  };

  const backtoBottomHandle = () => {
    if (hasEndMoreMessage) {
      handleReloadMessage();
    } else {
      emitter.emit("CHAT_LIST_SCROLL_TO_BOTTOM", false);
    }
  };
  const handleReloadMessage = async () => {
    setInitialCount(INITIAL_ITEM_COUNT);
    setFirstItemIndex(START_INDEX);
    useMessageStore.setState(() => ({
      hasEndMore: false,
    }));
    await handleGetHistoryMessage(false);
    setForceUpdate(Date.now());
  };

  const roomCount = useRef(0);
  const handleGetRoomStatus = () => {
    clearTimeout(roomStatusTimer);
    if (!conversationID || isSingle || !selfUserID) return;
    apiGetRoomStatus({
      recvID: selfUserID,
      conversationID: conversationID,
    }).then(({ data }) => {
      const { count } = data;
      if (count !== roomCount.current) {
        roomCount.current = count;
        updateCurrentRoomStatus(data);
      }
      if (count > 0) {
        roomStatusTimer = setTimeout(handleGetRoomStatus, 2000);
      }
    });
  };
  const handleJoinRealCall = () => {
    emitter.emit("OPEN_CALL_MODAL", {
      type: currentRoomStatus.type,
      conversation: currentConversation,
      token: currentRoomStatus.token,
      isAnswer: true,
      isReceive: true,
    });
  };
  const resetRoomStatus = () => {
    setTimeout(() => {
      handleGetRoomStatus();
    }, 3000);
  };
  useEffect(() => {
    handleGetRoomStatus();
    emitter.on("OPEN_CALL_NOTIFY", resetRoomStatus);
    emitter.on("OPEN_CALL_MODAL", resetRoomStatus);
    return () => {
      clearTimeout(roomStatusTimer);
      clearCurrentRoomStatus();
      emitter.off("OPEN_CALL_NOTIFY", resetRoomStatus);
      emitter.off("OPEN_CALL_MODAL", resetRoomStatus);
    };
  }, []);

  return (
    <Layout.Content className="mx-auto flex w-full flex-col overflow-hidden">
      <PinnedMessage></PinnedMessage>
      {!isSingle && Boolean(currentRoomStatus.count) && currentCallData && (
        <div className="flex h-11 items-center bg-[rgba(0,141,255,0.3)] px-4">
          <div className=" font-sMedium">
            群组视频通话中...
            <div className="font-sMedium text-xs">{currentRoomStatus.count}人</div>
          </div>
          <div
            className="ml-auto cursor-pointer font-sMedium"
            onClick={handleJoinRealCall}
          >
            加入通话
          </div>
        </div>
      )}
      <Virtuoso
        key={forceUpdate}
        className="overflow-x-hidden" // no-scrollbar
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={initialCount - 1}
        ref={virtuoso}
        data={messageList}
        startReached={loadMoreMessage}
        endReached={loadEndMoreMessage}
        rangeChanged={rangeChanged}
        components={{
          Header: () => (
            <div className="h-3 text-center text-white">
              {historyMessageLoading ? "loading..." : ""}
            </div>
          ),
        }}
        computeItemKey={(_, item) => item.clientMsgID}
        itemContent={(_, message) => {
          return (
            <>
              <MsgSendDate message={message}></MsgSendDate>
              <MsgItem
                conversationID={conversationID}
                message={message}
                isSingle={isSingle}
                scrollMessageId={scrollMessageId}
              ></MsgItem>
            </>
          );
        }}
      />
      <BacktoBottom
        show={showBacktoView}
        count={backtoViewNoRead}
        onClick={backtoBottomHandle}
      ></BacktoBottom>
    </Layout.Content>
  );
};

export default ChatContent;

interface MsgItemProps {
  conversationID: string;
  message: MessageItem;
  scrollMessageId: string;
  isSingle: boolean;
}
const MsgItem = memo((props: MsgItemProps) => {
  const selfUserID = useUserStore((state) => state.selfInfo.userID);

  const { message, scrollMessageId } = props;
  const { contentType, customElem } = message;
  const { status } = JSON.parse(customElem?.data || "{}") as CurrentCallData;
  if (SystemMessageTypes.includes(message.contentType)) {
    return <SystemNotification message={message} />;
  } else if (
    contentType === MessageType.CustomMessage &&
    status === RealCallsStatus.Call
  ) {
    return <div className="h-[1px]"></div>;
  }
  const isSender = selfUserID === message.sendID;

  return (
    <MessageItemRender
      {...props}
      isSender={isSender}
      isActive={scrollMessageId === message.clientMsgID}
    />
  );
});

const MsgSendDate = memo(({ message }: { message: ExMessageItem }) => {
  const messageList = useMessageStore((state) => state.historyMessageList);
  const curMsgIndex = messageList.findIndex(
    (v) => v.clientMsgID === message.clientMsgID,
  );
  const lastMsg = messageList[curMsgIndex - 1];
  const lastMsgDate = lastMsg ? dayjs(lastMsg.sendTime).format("YYYY-MM-DD") : "";
  const curMsgDate = dayjs(message.sendTime).format("YYYY-MM-DD");
  if (curMsgIndex === -1 || lastMsgDate === curMsgDate) return null;

  return (
    <div className="h-[28px] text-center">
      <span className="rounded-[28px] bg-[rgba(0,141,255,0.5)] px-2 py-1 leading-[28px] text-white">
        {dayjs(message.sendTime).format("YYYY-MM-DD")}
      </span>
    </div>
  );
});
