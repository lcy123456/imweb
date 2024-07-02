import { ChooseModalState } from "@/pages/common/ChooseModal";
import mitt from "mitt";
import {
  ConversationItem,
  GroupItem,
  MergeElem,
  MessageItem,
} from "open-im-sdk-wasm/lib/types/entity";
import { CardInfo } from "@/pages/common/UserCardModal";
import { ExMessageItem } from "@/store";
import { CurrentCallData } from "@/store/type";
import { PlayType, RealCallsType } from "@/constants";
import { CreateNotificationType } from "@/hooks/useSystemNotification";
import { EmojiItem } from "./emojis";

type EmitterEvents = {
  TRIGGER_EDITABLEDIV_CHANGE: string;
  OPEN_USER_CARD: OpenUserCardParams;
  OPEN_GROUP_CARD: GroupItem;
  OPEN_CHOOSE_MODAL: ChooseModalState;
  OPEN_MEDIA_PREVIEW: OpenMediaParams;
  CHAT_LIST_SCROLL_TO_BOTTOM: boolean;
  CHAT_LIST_SCROLL_TO_MESSAGE: MessageItem;
  PLAY_MESSAGE_AUDIO: PlayAudioParams;
  ADD_USER_ACCOUNT: null;
  FORCE_UPDATE_IM: null;
  INVITE_CALL_USERID: InviteCallUserID;
  OPEN_CALL_NOTIFY: CurrentCallData;
  CLOSE_CALL_NOTIFY: CurrentCallData;
  OPEN_CALL_MODAL: CurrentCallData;
  SEDN_CALL_MESSAGE: RealCallsType;
  CLOSE_CALL_MODAL: null;
  CHECK_GLOBAL_LOADING: null;
  SYNC_LOAD_MESSAGE_REVERSE: null;
  NOTIFICATION_CLICK: CreateNotificationType;
  AUTO_UPDATER: string;
  EDITOR_INSET_EMOJI: EmojiItem;
  MESSAGE_SAVEAS_FILE: string;
};

export type OpenUserCardParams = {
  userID?: string;
  groupID?: string;
  isSelf?: boolean;
  notAdd?: boolean;
  cardInfo?: CardInfo;
};

export type OpenMediaParams = {
  message: ExMessageItem;
  conversationID?: string;
  mediaList?: ExMessageItem[];
};

export type PlayAudioParams = {
  type: PlayType;
  src?: string;
  conversation?: ConversationItem;
};

export type EditorImgParams = {
  class: string;
  src: string;
  alt: string;
};

export type InviteCallUserID = {
  type: string;
  userIDs: string[];
};

const emitter = mitt<EmitterEvents>();

export default emitter;
