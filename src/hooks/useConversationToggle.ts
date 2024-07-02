import { SessionType } from "open-im-sdk-wasm";
import { GetOneConversationParams } from "open-im-sdk-wasm/lib/types/params";
import { useNavigate } from "react-router-dom";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import { feedbackToast } from "@/utils/common";

export function useConversationToggle() {
  const navigate = useNavigate();

  const conversationID = useConversationStore(
    (state) => state.currentConversation?.conversationID,
  );
  const updateCurrentConversation = useConversationStore(
    (state) => state.updateCurrentConversation,
  );

  const getConversation = async ({
    sourceID,
    sessionType,
  }: GetOneConversationParams) => {
    let conversation = useConversationStore
      .getState()
      .conversationList.find(
        (item) => item.userID === sourceID || item.groupID === sourceID,
      );
    if (!conversation) {
      try {
        conversation = (
          await IMSDK.getOneConversation({
            sourceID,
            sessionType,
          })
        ).data;
      } catch (error) {
        feedbackToast({ error });
      }
    }
    return conversation;
  };

  const toSpecifiedConversation = async (data: GetOneConversationParams) => {
    const conversation = await getConversation(data);
    if (!conversation || conversationID === conversation.conversationID) return;
    updateCurrentConversation({ ...conversation });
    navigate(`/home/chat/${conversation.conversationID}`);
  };

  return {
    toSpecifiedConversation,
  };
}
