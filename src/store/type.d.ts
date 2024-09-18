import {
  BlackUserItem,
  ConversationItem,
  FriendApplicationItem,
  FriendUserItem,
  GroupApplicationItem,
  GroupItem,
  GroupMemberItem,
  MessageItem,
  PublicUserItem,
  SelfUserInfo,
} from "open-im-sdk-wasm/lib/types/entity";

import { ConversationFolderItem } from "@/api/imApi";
import { BusinessUserInfo } from "@/api/login";
import { API } from "@/api/typings";
import { RealCallsStatus, RealCallsType, ReceiveMessageMusicType } from "@/constants";

import { ExMessageItem } from "./message";

export interface UserStore {
  connectState: ConnectState;
  selfInfo: BusinessUserInfo;
  appConfig: AppConfig;
  appVersionConfig: AppVersionConfig;
  packVersion: string;
  appSettings: AppSettings;
  thirdConfig: ThirdConfigRes;
  moreAccount: MoreAccount;
  receiveMessageMusicKey: ReceiveMessageMusicType;
  favoriteEmojiList: FavoriteEmojiItem[];
  updateConnectState: (data: ConnectState) => void;
  updateSelfInfo: (info: Partial<BusinessUserInfo>) => void;
  getSelfInfoByReq: () => Promise<void>;
  getAppConfigByReq: () => Promise<void>;
  getThirdConfig: () => Promise<void>;
  updateAppVersionConfig: (config: AppVersionConfig) => void;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  userLogout: (isToLogin?: boolean) => Promise<void>;
  forceLogout: () => void;
  clearLoginInfo: (isToLogin?: boolean) => Promise<void>;
  updateMoreAccount: (val: MoreAccount) => void;
  updateReceiveMessageMusicKey: (val: ReceiveMessageMusicType) => void;
  updateFavoriteEmojiList: (val: FavoriteEmojiItem[]) => void;
  updatePackVersion: () => void;
}

export interface ConnectState {
  isSyncing: boolean;
  isLogining: boolean;
  isConnecting: boolean;
}

export interface AppConfig {
  discoverPageURL: string;
  ordinaryUserAddFriend: number;
  allowSendMsgNotFriend: number;
  needInvitationCodeRegister: number;
}

export interface AppVersionConfig {
  fileUrl: string;
  patchUrl: string;
  version: string;
  updateLog: string;
  platform: number;
}

export interface AppSettings {
  locale: LocaleString;
  closeAction: "miniSize" | "quit";
}

export interface ThirdConfigRes {
  gif: {
    url: string;
    apiKey: string;
  };
  livekit: {
    url: string;
  };
  oss: {
    url: string;
  };
}

export interface FavoriteEmojiItem {
  id: string;
  url: string;
}

export type LocaleString = "zh-CN" | "en";

export interface MoreAccountItem extends API.Login.LoginParams, PublicUserItem {}
export type MoreAccount = MoreAccountItem[];

export type ConversationListUpdateType = "push" | "filter";

export type CurrentCallData = {
  type: RealCallsType;
  status?: RealCallsStatus;
  conversation?: ConversationItem;
  isReceive?: boolean;
  isAnswer?: boolean;
  token?: string;
  isSendMsg?: boolean;
  userIDs?: string[];
};

export type CurrentRoomStatus = {
  count: number;
  token: string;
  type: RealCallsType;
};

export interface ConversationStore {
  conversationList: ConversationItem[];
  currentConversation?: ConversationItem;
  currentConversationUser?: BusinessUserInfo;
  unReadCount: number;
  currentGroupInfo?: GroupItem;
  currentMemberInGroup?: GroupMemberItem;
  quoteMessage?: MessageItem;
  isEditQuoteMessage: boolean;
  typingStatus: string;
  conversationFolder: ConversationFolderItem[];
  currentConversationFolder?: ConversationFolderItem;
  getConversationListByReq: (isOffset?: boolean) => Promise<boolean>;
  updateConversationList: (
    list: ConversationItem[],
    type: ConversationListUpdateType,
  ) => void;
  delConversationByCID: (conversationID: string) => void;
  // getCurrentConversationByReq: (conversationID?: string) => Promise<void>;
  updateCurrentConversation: (conversation?: ConversationItem) => void;
  getUnReadCountByReq: () => Promise<void>;
  updateUnReadCount: (count: number) => void;
  getCurrentGroupInfoByReq: (groupID: string) => Promise<void>;
  updateCurrentGroupInfo: (groupInfo: GroupItem) => void;
  getCurrentMemberInGroupByReq: (groupID: string) => Promise<void>;
  tryUpdateCurrentMemberInGroup: (member: GroupMemberItem) => void;
  updateQuoteMessage: (message?: MessageItem, isEdit?: boolean) => void;
  clearConversationStore: () => void;
  updateTypingStatus: (val: string) => void;
  getConversationFolder: () => void;
  updateConversationFolder: (item: ConversationFolderItem) => void;
  updateCurrentConversationFolder: (item?: ConversationFolderItem) => void;
}

export interface RealCallStore {
  currentCallData: CurrentCallData;
  currentRoomStatus: CurrentRoomStatus;
  updateCurrentCallData: (params: CurrentCallData) => void;
  clearCurrentCallData: () => void;
  updateCurrentRoomStatus: (params: CurrentRoomStatus) => void;
  clearCurrentRoomStatus: () => void;
}

export interface MessageStore {
  historyMessageList: ExMessageItem[];
  pinnedMessageList: API.Chat.PinnedMessageItem[];
  lastMinSeq: number;
  hasMore: boolean;
  hasEndMore: boolean;
  isCheckMode: boolean;
  getHistoryMessageListApi: (loadMore?: boolean, count?: number) => Promise<unknown>;
  getHistoryMessageListReverseApi: (
    params?: historyMessageListReverseApiParams,
  ) => Promise<unknown>;
  pushNewMessage: (message: ExMessageItem) => void;
  updateOneMessage: (message: ExMessageItem, fromSuccessCallBack?: boolean) => void;
  deleteOneMessage: (clientMsgID: string) => void;
  clearHistoryMessage: () => void;
  updateCheckMode: (isCheckMode: boolean) => void;
  getPinnedMessageList: (init?: boolean) => Promise<void>;
  clearPinnedMessageList: () => void;
}

export interface IAdvancedMessageRes {
  lastMinSeq: number;
  isEnd: boolean;
  messageList: ExMessageItem[];
}

export interface historyMessageListReverseApiParams {
  clientMsgID: string;
  seq: number;
}

export interface ContactStore {
  friendList: FriendUserItem[];
  blackList: BlackUserItem[];
  groupList: GroupItem[];
  recvFriendApplicationList: FriendApplicationItem[];
  sendFriendApplicationList: FriendApplicationItem[];
  recvGroupApplicationList: GroupApplicationItem[];
  sendGroupApplicationList: GroupApplicationItem[];
  unHandleFriendApplicationCount: number;
  unHandleGroupApplicationCount: number;
  getFriendListByReq: () => Promise<void>;
  setFriendList: (list: FriendUserItem[]) => void;
  updateFriend: (friend: FriendUserItem, remove?: boolean) => void;
  pushNewFriend: (friend: FriendUserItem) => void;
  getBlackListByReq: () => Promise<void>;
  updateBlack: (black: BlackUserItem, remove?: boolean) => void;
  pushNewBlack: (black: BlackUserItem) => void;
  getGroupListByReq: () => Promise<void>;
  setGroupList: (list: GroupItem[]) => void;
  updateGroup: (group: GroupItem, remove?: boolean) => void;
  pushNewGroup: (group: GroupItem) => void;
  getRecvFriendApplicationListByReq: () => Promise<void>;
  updateRecvFriendApplication: (application: FriendApplicationItem) => void;
  getSendFriendApplicationListByReq: () => Promise<void>;
  updateSendFriendApplication: (application: FriendApplicationItem) => void;
  getRecvGroupApplicationListByReq: () => Promise<void>;
  updateRecvGroupApplication: (application: GroupApplicationItem) => void;
  getSendGroupApplicationListByReq: () => Promise<void>;
  updateSendGroupApplication: (application: GroupApplicationItem) => void;
  updateUnHandleFriendApplicationCount: (num: number) => void;
  updateUnHandleGroupApplicationCount: (num: number) => void;
  clearContactStore: () => void;
}
