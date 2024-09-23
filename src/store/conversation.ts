import { t } from "i18next";
import {
  ConversationItem,
  GroupItem,
  GroupMemberItem,
  MessageItem,
} from "open-im-sdk-wasm/lib/types/entity";
import { create } from "zustand";

import { apiConversationFolder, ConversationFolderItem } from "@/api/imApi";
import { getBusinessUserInfo } from "@/api/login";
import { IMSDK } from "@/layout/MainContentWrap";
import { feedbackToast, sortByChinesePinyin } from "@/utils/common";
import { conversationSort, isGroupSession } from "@/utils/imCommon";

import { ConversationListUpdateType, ConversationStore } from "./type";
import { useUserStore } from "./user";

export const useConversationStore = create<ConversationStore>()((set, get) => ({
  conversationList: [],
  currentConversation: undefined,
  currentConversationUser: undefined,
  unReadCount: 0,
  currentGroupInfo: undefined,
  currentMemberInGroup: undefined,
  quoteMessage: undefined,
  isEditQuoteMessage: false,
  typingStatus: "",
  conversationFolder: [],
  currentConversationFolder: undefined,
  getConversationListByReq: async (isOffset?: boolean) => {
    let tmpConversationList = [] as ConversationItem[];
    try {
      const { data } = await IMSDK.getConversationListSplit({
        offset: isOffset ? get().conversationList.length : 0,
        count: 200,
      });
      console.log("getConversationList", data);
      tmpConversationList = data;
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getConversationFailed") });
      return true;
    }
    set((state) => ({
      conversationList: [
        ...(isOffset ? state.conversationList : []),
        ...tmpConversationList,
      ],
    }));
    return tmpConversationList.length === 20;
  },
  updateConversationList: (
    list: ConversationItem[],
    type: ConversationListUpdateType,
  ) => {
    const { conversationList, currentConversation, updateCurrentConversation } = get();
    const idx = list.findIndex(
      (c) => c.conversationID === currentConversation?.conversationID,
    );
    if (idx > -1) updateCurrentConversation(list[idx]);

    if (type === "filter") {
      set((state) => ({
        conversationList: conversationSort([...list, ...state.conversationList]),
      }));
      return;
    }
    let filterArr: ConversationItem[] = [];
    const chids = list.map((ch) => ch.conversationID);
    filterArr = conversationList.filter((tc) => !chids.includes(tc.conversationID));

    set(() => ({ conversationList: conversationSort([...list, ...filterArr]) }));
  },
  delConversationByCID: (conversationID: string) => {
    const tmpConversationList = get().conversationList;
    const idx = tmpConversationList.findIndex(
      (cve) => cve.conversationID === conversationID,
    );
    if (idx < 0) {
      return;
    }
    tmpConversationList.splice(idx, 1);
    set(() => ({ conversationList: [...tmpConversationList] }));
  },
  updateCurrentConversation: (conversation?: ConversationItem) => {
    if (!conversation) {
      set(() => ({
        currentConversation: undefined,
        quoteMessage: undefined,
        currentGroupInfo: undefined,
        currentMemberInGroup: undefined,
      }));
      return;
    }
    const prevConversation = get().currentConversation;
    getBusinessUserInfo([conversation.userID]).then((res) => {
      console.log("getBusinessUserInfo--getBusinessUserInfo", res);
      const { data } = res;
      const { users } = data;
      set(() => ({
        currentConversationUser: users ? users[0] : undefined,
      }));
    });

    console.log("prevConversation:::", prevConversation);

    const toggleNewConversation =
      conversation.conversationID !== prevConversation?.conversationID;
    if (toggleNewConversation && isGroupSession(conversation.conversationType)) {
      get().getCurrentGroupInfoByReq(conversation.groupID);
      get().getCurrentMemberInGroupByReq(conversation.groupID);
    }
    set(() => ({ currentConversation: { ...conversation } }));
  },
  getUnReadCountByReq: async () => {
    try {
      const { data } = await IMSDK.getTotalUnreadMsgCount();
      window.electronAPI?.ipcInvoke("updateBadge", { count: data });
      set(() => ({ unReadCount: data }));
    } catch (error) {
      console.error(error);
    }
  },
  updateUnReadCount: (count: number) => {
    window.electronAPI?.ipcInvoke("updateBadge", { count });
    set(() => ({ unReadCount: count }));
  },
  getCurrentGroupInfoByReq: async (groupID: string) => {
    let groupInfo: GroupItem;
    try {
      const { data } = await IMSDK.getSpecifiedGroupsInfo([groupID]);
      groupInfo = data[0];
      console.info(`getCurrentGroupInfoByReq: ${groupInfo.groupID}`);
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getGroupInfoFailed") });
      return;
    }
    set(() => ({ currentGroupInfo: { ...groupInfo } }));
  },
  updateCurrentGroupInfo: (groupInfo: GroupItem) => {
    set(() => ({ currentGroupInfo: { ...groupInfo } }));
  },
  getCurrentMemberInGroupByReq: async (groupID: string) => {
    let memberInfo: GroupMemberItem;
    const selfID = useUserStore.getState().selfInfo.userID;
    try {
      const { data } = await IMSDK.getSpecifiedGroupMembersInfo({
        groupID,
        userIDList: [selfID],
      });
      memberInfo = data[0];
      console.info(`getCurrentMemberInGroupByReq`, memberInfo);
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getGroupMemberFailed") });
      return;
    }
    set(() => ({ currentMemberInGroup: { ...memberInfo } }));
  },
  tryUpdateCurrentMemberInGroup: (member: GroupMemberItem) => {
    const currentMemberInGroup = get().currentMemberInGroup;
    if (
      member.groupID === currentMemberInGroup?.groupID &&
      member.userID === currentMemberInGroup?.userID
    ) {
      set(() => ({ currentMemberInGroup: { ...member } }));
    }
  },
  updateQuoteMessage: (message?: MessageItem, isEdit = false) => {
    set(() => ({ quoteMessage: message, isEditQuoteMessage: isEdit }));
  },
  clearConversationStore: () => {
    set(() => ({
      conversationList: [],
      currentConversation: undefined,
      currentConversationUser: undefined,
      unReadCount: 0,
      currentGroupInfo: undefined,
      currentMemberInGroup: undefined,
      quoteMessage: undefined,
      isEditQuoteMessage: false,
      conversationFolder: [],
    }));
  },
  updateTypingStatus: (val) => {
    set(() => ({
      typingStatus: val,
    }));
  },
  getConversationFolder: async () => {
    const res = await apiConversationFolder({
      pagination: {
        pageNumber: 1,
        showNumber: 100,
      },
    });
    set({
      conversationFolder: sortByChinesePinyin(res.data.list || [], "name"),
    });
  },
  updateConversationFolder: (item: ConversationFolderItem) => {
    const tmpList = [...get().conversationFolder];
    const isRemove = item.state === -1;
    const idx = tmpList.findIndex((f) => f.id === item.id);
    if (idx < 0) {
      tmpList.push(item);
    } else if (isRemove) {
      tmpList.splice(idx, 1);
    } else {
      tmpList[idx] = { ...item };
    }
    set({ conversationFolder: sortByChinesePinyin(tmpList, "name") });
  },
  updateCurrentConversationFolder: (item?: ConversationFolderItem) => {
    set({
      currentConversationFolder: item,
    });
  },
}));
