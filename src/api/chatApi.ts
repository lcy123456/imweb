import { v4 as uuidv4 } from "uuid";

import { API_URL, USER_URL } from "@/config";
import { RealCallOpStatus, RealCallsType } from "@/constants";
import { ExMessageItem } from "@/store";
import { FavoriteEmojiItem } from "@/store/type";
import createAxiosInstance from "@/utils/request";
import { getChatToken, getIMToken } from "@/utils/storage";

import { API } from "./typings";

const request = createAxiosInstance(USER_URL);
const requestApi = createAxiosInstance(API_URL);

export const apiPinnedMessageList = async (params: API.Chat.PinnedListParams) => {
  const token = await getChatToken();
  return request.post<API.PaginationRes<API.Chat.PinnedMessageItem>>(
    "/msg/pin/list",
    params,
    {
      headers: {
        token,
        operationID: uuidv4(),
      },
    },
  );
};

export const apiPinnedMessage = async (params: API.Chat.PinnedParams) => {
  const token = await getChatToken();
  return request.post("/msg/pin", params, {
    headers: {
      token,
      operationID: uuidv4(),
    },
  });
};

export const apiPinnedCancelMessage = async (params: API.Chat.PinnedCencalParams) => {
  const token = await getChatToken();
  return request.post("/msg/pin/cancel", params, {
    headers: {
      token,
      operationID: uuidv4(),
    },
  });
};

export const apiAddCollectMessage = async (params: {
  content: string;
  senderNickname: string;
}) => {
  const token = await getChatToken();
  return request.post("/msg/collect", params, {
    headers: {
      token,
      operationID: uuidv4(),
    },
  });
};

export const apiRemoveCollectMessage = async (params: { id: number }) => {
  const token = await getChatToken();
  return request.post("/msg/collect/cancel", params, {
    headers: {
      token,
      operationID: uuidv4(),
    },
  });
};

export interface CollectMessageItemRes {
  id: number;
  status: number;
  content: string;
  message: ExMessageItem;
  createAt: number;
  senderNickname: string;
}
export const apiGetCollectMessage = async (params: {
  pagination: API.Normal.Pagination;
}) => {
  const token = await getChatToken();
  return request.post<{
    list: CollectMessageItemRes[];
    total: number;
  }>("/msg/collect/list", params, {
    headers: {
      token,
      operationID: uuidv4(),
    },
  });
};

export const apiCreateRoom = async (params: {
  sendID: string;
  recvID: string;
  groupID: string;
  conversationID: string;
  type: RealCallsType;
}) => {
  // const token = (await getChatToken()) as string;
  return requestApi.post<{ token: string }>(
    "/video/create_room_and_get_token",
    params,
    {
      headers: {
        // token,
        operationID: uuidv4(),
      },
    },
  );
};

export const apiGetRoomToken = async (params: {
  recvID: string;
  conversationID: string;
}) => {
  // const token = (await getChatToken()) as string;
  return requestApi.post<{ token: string }>("/video/get_token", params, {
    headers: {
      // token,
      operationID: uuidv4(),
    },
  });
};

export const apiGetRoomStatus = async (params: {
  recvID: string;
  conversationID: string;
}) => {
  // const token = (await getChatToken()) as string;
  return requestApi.post<{ token: string; count: number; type: number }>(
    "/video/get_room_member",
    params,
    {
      headers: {
        // token,
        operationID: uuidv4(),
      },
    },
  );
};

export const apiCallRefused = async (params: {
  sendID: string;
  conversationID: string;
}) => {
  // const token = (await getChatToken()) as string;
  return requestApi.post("/video/single_chat_refused", params, {
    headers: {
      operationID: uuidv4(),
    },
  });
};

export const apiCallInviteOrKick = async (params: {
  userIDs: string[];
  roomName: string;
  opType: RealCallOpStatus;
  type: RealCallsType;
}) => {
  const token = await getIMToken();
  return requestApi.post("/video/signal_invite_or_kick_msg", params, {
    headers: {
      token,
      operationID: uuidv4(),
    },
  });
};

export const apiFavoriteEmojiCollectAdd = async (params: { url: string }) => {
  const token = await getChatToken();
  return request.post("/msg/emoji_collect", params, {
    headers: {
      token,
      operationID: uuidv4(),
    },
  });
};

export const apiFavoriteEmojiCollectCancel = async (params: { id: string }) => {
  const token = await getChatToken();
  return request.post("/msg/emoji_collect/cancel", params, {
    headers: {
      token,
      operationID: uuidv4(),
    },
  });
};

export const apiFavoriteEmojiCollectList = async (params: {
  pagination: API.Normal.Pagination;
}) => {
  const token = await getChatToken();
  return request.post<API.PaginationRes<FavoriteEmojiItem>>(
    "/msg/emoji_collect/list",
    params,
    {
      headers: {
        token,
        operationID: uuidv4(),
      },
    },
  );
};

export const apiSendAdvancedMessage = async (params: {
  recvID: string;
  groupID: string;
  content: string;
}) => {
  return requestApi.post("/msg/send_advmsg", params, {
    headers: {
      operationID: uuidv4(),
    },
  });
};
