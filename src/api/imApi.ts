import {
  ConversationItem,
  GroupMemberItem,
  MessageItem,
} from "open-im-sdk-wasm/lib/types/entity";
import { v4 as uuidv4 } from "uuid";

import { API_URL, USER_URL } from "@/config";
import createAxiosInstance from "@/utils/request";
import { getChatToken, getIMUserID } from "@/utils/storage";

import { API } from "./typings";

const request = createAxiosInstance(API_URL);
const requestUser = createAxiosInstance(USER_URL);

interface UserOnlineState {
  platformID: number;
  status: 0 | 1;
  userID: string;
}

export const getUserOnlineStatus = async (userIDs: string[]) =>
  request.post<{ statusList: UserOnlineState[] }>(
    "/user/get_users_status",
    {
      userID: await getIMUserID(),
      userIDs,
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );

export const apiGetGroupMemberList = async (params: {
  groupID: string;
  pagination: API.Normal.Pagination;
}) =>
  request.post<API.PaginationMemberRes<GroupMemberItem>>(
    "/group/get_group_member_list",
    params,
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );

export interface UnreadMessageRes {
  count: number;
  [propsName: string]: { count: number } | number;
}
export const apiGetUnreadMsgCount = async (params: { userID: string[] }) => {
  return request.post<UnreadMessageRes>("/msg/get_unread_msg_count", params, {
    headers: {
      operationID: uuidv4(),
    },
  });
};

export const apiUpdateMessage = async (params: MessageItem) => {
  return request.post("/msg/update_msg", params, {
    headers: {
      operationID: uuidv4(),
    },
  });
};

interface GetMessageByIdReq {
  sendID: string;
  groupID: string;
  clientMsgID: string;
}
export const apiGetMessageById = async (params: GetMessageByIdReq) => {
  return request.post<{
    chatLogs: MessageItem[];
  }>("/msg/get_msg_id", params, {
    headers: {
      operationID: uuidv4(),
    },
  });
};

interface GiveLikeEmojiReq {
  clientMsgID: string;
  serverMsgID: string;
  sendID: string;
  recvID: string;
  groupID: string;
  emoji: string;
}
export const apiGiveLikeMessage = async (params: GiveLikeEmojiReq) => {
  return request.post("/msg/give_like_emoji", params, {
    headers: {
      operationID: uuidv4(),
    },
  });
};

interface ConversationProps {
  userIDs: string[];
  conversation: Pick<
    ConversationItem,
    "conversationID" | "conversationType" | "groupID" | "attachedInfo"
  >;
}
export const apiSetConversation = (params: ConversationProps) => {
  return request.post("/conversation/set_conversations", params, {
    headers: {
      operationID: uuidv4(),
    },
  });
};

export interface ConversationFolderItem {
  id: number;
  name: string;
  state: -1 | 0;
}
export const apiConversationFolderCreate = async (params: { name: string }) => {
  const token = await getChatToken();
  return requestUser.post<ConversationFolderItem>("/conversation/folder", params, {
    headers: {
      token,
      operationID: uuidv4(),
    },
  });
};

type ConversationFolderUpdateProps = ConversationFolderItem & {
  state?: -1 | 0;
};
export const apiConversationFolderUpdate = async (
  params: ConversationFolderUpdateProps,
) => {
  const token = await getChatToken();
  return requestUser.post("/conversation/folder/update", params, {
    headers: {
      token,
      operationID: uuidv4(),
    },
  });
};

export const apiConversationFolder = async (params: {
  pagination: API.Normal.Pagination;
}) => {
  const token = await getChatToken();
  return requestUser.post<API.PaginationRes<ConversationFolderItem>>(
    "/conversation/folder/list",
    params,
    {
      headers: {
        token,
        operationID: uuidv4(),
      },
    },
  );
};
