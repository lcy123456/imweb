import { MessageStatus } from "open-im-sdk-wasm";
import { WsResponse } from "open-im-sdk-wasm/lib/types/entity";
import { SendMsgParams } from "open-im-sdk-wasm/lib/types/params";
import { useCallback, useRef } from "react";

import { apiUpdateMessage } from "@/api/imApi";
import send_message_music from "@/assets/audio/send_message_music.mp3";
import { IMSDK } from "@/layout/MainContentWrap";
import { ExMessageItem, useConversationStore, useMessageStore } from "@/store";
import { feedbackToast } from "@/utils/common";
import emitter from "@/utils/events";
import { checkCodeStatus } from "@/utils/imCommon";

export type SendMessageParams = Partial<Omit<SendMsgParams, "message">> & {
  message: ExMessageItem;
  needPush?: boolean;
};

export function useSendMessage() {
  const audioEl = useRef<HTMLAudioElement>(new Audio());
  const pushNewMessage = useMessageStore((state) => state.pushNewMessage);
  const updateOneMessage = useMessageStore((state) => state.updateOneMessage);

  const sendMessage = useCallback(
    async ({ recvID, groupID, message, needPush }: SendMessageParams) => {
      if (!message) return;
      const sourceID = recvID || groupID;
      const { currentConversation } = useConversationStore.getState();
      const currentUserID = currentConversation?.userID;
      const currentGroupID = currentConversation?.groupID;
      const inCurrentConversation =
        currentUserID === sourceID || currentGroupID === sourceID || !sourceID;
      needPush = needPush ?? inCurrentConversation;

      if (needPush) {
        pushNewMessage(message);
        emitter.emit("CHAT_LIST_SCROLL_TO_BOTTOM", false);
        audioEl.current.src = send_message_music;
        audioEl.current.currentTime = 0;
        audioEl.current.play();
      }

      const options = {
        recvID: recvID ?? currentUserID ?? "",
        groupID: groupID ?? currentGroupID ?? "",
        message,
      };

      try {
        const { data: successMessage } = await IMSDK.sendMessage(options);
        // console.log("xxx, successMessage", successMessage);
        updateOneMessage(successMessage as ExMessageItem, true);
      } catch (error) {
        // console.log("消息发送异常", error);
        feedbackToast({
          error: "消息发送异常",
          msg: checkCodeStatus((error as WsResponse).errCode),
        });
        updateOneMessage({
          ...message,
          recvID: options.recvID,
          groupID: options.groupID,
          status: MessageStatus.Failed,
        });
        throw new Error("消息发送异常");
      }
    },
    [],
  );

  const sendEditMessage = useCallback(async (message: ExMessageItem) => {
    try {
      await apiUpdateMessage(message);
      // pushNewMessage(message);
    } catch (error) {
      feedbackToast({
        error: error,
        msg: checkCodeStatus((error as WsResponse).errCode),
      });
      throw new Error("消息编辑异常");
    }
  }, []);

  return {
    sendMessage,
    sendEditMessage,
    updateOneMessage,
  };
}
