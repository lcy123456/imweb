import { useThrottleFn } from "ahooks";
import { GroupAtType } from "open-im-sdk-wasm";
import { useEffect } from "react";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";

export default function useConversationState() {
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );

  useEffect(() => {
    checkConversationState();
    return () => {
      checkConversationState();
    };
  }, [
    currentConversation?.conversationID,
    currentConversation?.groupAtType,
    currentConversation?.unreadCount,
  ]);

  useEffect(() => {
    document.addEventListener("visibilitychange", checkConversationState);
    return () => {
      document.removeEventListener("visibilitychange", checkConversationState);
    };
  }, [currentConversation?.conversationID]);

  const { run: checkConversationState } = useThrottleFn(
    () => {
      if (!currentConversation || document.visibilityState === "hidden") return;

      if (currentConversation.unreadCount > 0) {
        IMSDK.markConversationMessageAsRead(currentConversation.conversationID);
      }
      if (currentConversation.groupAtType !== GroupAtType.AtNormal) {
        IMSDK.resetConversationGroupAtType(currentConversation.conversationID);
      }
    },
    { wait: 2000 },
  );
}
