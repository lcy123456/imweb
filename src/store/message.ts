import { t } from "i18next";
import { MessageItem } from "open-im-sdk-wasm/lib/types/entity";
import { create } from "zustand";

import { apiPinnedMessageList } from "@/api/chatApi";
import { IMSDK } from "@/layout/MainContentWrap";
import { feedbackToast } from "@/utils/common";
import emitter from "@/utils/events";
import { idsGetConversationID, isEditMessage, isLikeMessage } from "@/utils/imCommon";

import { useConversationStore } from "./conversation";
import { MessageStore } from "./type";

const GET_HISTORY_MESSAGE_COUNT = 40;

export interface ExType {
  checked?: boolean;
  errCode?: number;
}

export type ExMessageItem = MessageItem & ExType;

export const useMessageStore = create<MessageStore>()((set, get) => ({
  historyMessageList: [],
  pinnedMessageList: [],
  lastMinSeq: 0,
  hasMore: true,
  hasEndMore: false,
  isCheckMode: false,
  getHistoryMessageListApi: async (loadMore = false) => {
    const { currentConversation } = useConversationStore.getState();
    const conversationID = currentConversation?.conversationID;
    if (!conversationID) return;
    try {
      const prevList = [...get().historyMessageList];
      const { data } = await IMSDK.getAdvancedHistoryMessageList({
        count: GET_HISTORY_MESSAGE_COUNT,
        lastMinSeq: loadMore ? get().lastMinSeq : 0,
        startClientMsgID: loadMore ? prevList[0]?.clientMsgID : "",
        conversationID,
      });
      const { lastMinSeq, isEnd, messageList } = data;
      const tempConversationID = messageList[0]
        ? idsGetConversationID(messageList[0])
        : "";
      if (
        tempConversationID !==
        useConversationStore.getState().currentConversation?.conversationID
      )
        return;
      console.log("historyMessageList", get().historyMessageList, data);
      const seq = messageList[0].seq;
      set(() => ({
        lastMinSeq: seq,
        hasMore: seq !== 1, // !isEnd && messageList.length === GET_HISTORY_MESSAGE_COUNT,
        historyMessageList: [...messageList, ...(loadMore ? prevList : [])],
      }));
      return data;
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getHistoryMessageFailed") });
      return false;
    }
  },
  getHistoryMessageListReverseApi: async (params) => {
    const { currentConversation } = useConversationStore.getState();
    const { conversationID, latestMsg } = currentConversation || {};
    if (!conversationID) return;
    try {
      const prevList = [...get().historyMessageList];
      const lastMsg = get().historyMessageList.at(-1);
      const { data } = await IMSDK.getAdvancedHistoryMessageListReverse({
        conversationID,
        startClientMsgID: params ? params.clientMsgID : lastMsg?.clientMsgID || "",
        lastMinSeq: params ? params.seq : lastMsg?.seq || 0,
        count: GET_HISTORY_MESSAGE_COUNT,
      });
      const { lastMinSeq, isEnd, messageList } = data;
      const tempConversationID = messageList[0]
        ? idsGetConversationID(messageList[0])
        : "";
      if (
        tempConversationID !==
        useConversationStore.getState().currentConversation?.conversationID
      )
        return;
      console.log(
        "historyMessageListReverse",
        // get().historyMessageList,
        data,
      );
      const maxReg = (JSON.parse(latestMsg || "{}") as ExMessageItem).seq;
      set(() => ({
        lastMinSeq,
        hasEndMore: messageList[0].seq !== maxReg, // !isEnd && messageList.length === GET_HISTORY_MESSAGE_COUNT,
        historyMessageList: [...prevList, ...messageList],
      }));
      return data;
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getHistoryMessageFailed") });
      return false;
    }
  },
  pushNewMessage: (message: ExMessageItem) => {
    const { hasEndMore, historyMessageList } = get();
    if (hasEndMore) return;

    set(() => ({ historyMessageList: [...historyMessageList, message] }));
  },
  updateOneMessage: (message: ExMessageItem, fromSuccessCallBack = false) => {
    const tmpList = [...get().historyMessageList];
    const idx = tmpList.findIndex((msg) => msg.clientMsgID === message.clientMsgID);
    if (idx < 0) {
      return;
    }
    tmpList[idx] = { ...tmpList[idx], ...message };
    set(() => ({ historyMessageList: tmpList }));
  },
  deleteOneMessage: (clientMsgID: string) => {
    const tmpList = get().historyMessageList;
    const idx = tmpList.findIndex((msg) => msg.clientMsgID === clientMsgID);
    if (idx < 0) {
      return;
    }
    tmpList.splice(idx, 1);
    set(() => ({ historyMessageList: [...tmpList] }));
  },
  clearHistoryMessage: () => {
    set(() => ({ historyMessageList: [] }));
  },
  updateCheckMode: (isCheckMode: boolean) => {
    if (!isCheckMode) {
      const tmpList = [...get().historyMessageList].map((message) => {
        message.checked = false;
        return message;
      });
      set(() => ({ historyMessageList: tmpList }));
    }
    set(() => ({ isCheckMode }));
  },
  getPinnedMessageList: async (init = false) => {
    const { currentConversation } = useConversationStore.getState();
    const conversationID = currentConversation?.conversationID;
    if (!conversationID) return;
    const { data } = await apiPinnedMessageList({
      conversationID,
      pagination: {
        pageNumber: 1,
        showNumber: 99,
      },
    });
    set(() => ({
      pinnedMessageList: data.list || [],
    }));
    if (init && data.list && data.list.length !== 0) {
      setTimeout(() => {
        emitter.emit("CHAT_LIST_SCROLL_TO_BOTTOM", false);
      }, 200);
    }
  },
  clearPinnedMessageList: () => {
    set(() => ({
      pinnedMessageList: [],
    }));
  },
}));
