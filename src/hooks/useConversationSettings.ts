import { App } from "antd";
import { t } from "i18next";
import { MessageReceiveOptType } from "open-im-sdk-wasm";
import { useCallback } from "react";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useMessageStore } from "@/store";
import { feedbackToast } from "@/utils/common";

export function useConversationSettings() {
  const { modal } = App.useApp();

  const currentGroupInfo = useConversationStore.getState().currentGroupInfo;
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const clearHistoryMessage = useMessageStore((state) => state.clearHistoryMessage);

  const updateConversationPin = useCallback(
    async (isPinned: boolean) => {
      if (!currentConversation) return;

      try {
        await IMSDK.pinConversation({
          conversationID: currentConversation.conversationID,
          isPinned,
        });
      } catch (error) {
        feedbackToast({ error, msg: t("toast.pinConversationFailed") });
      }
    },
    [currentConversation?.conversationID],
  );

  const updateConversationMessageRemind = useCallback(
    async (checked: boolean, option: MessageReceiveOptType) => {
      if (!currentConversation) return;

      try {
        await IMSDK.setConversationRecvMessageOpt({
          conversationID: currentConversation.conversationID,
          opt: checked ? option : MessageReceiveOptType.Nomal,
        });
      } catch (error) {
        feedbackToast({ error, msg: t("toast.setConversationRecvMessageOptFailed") });
      }
    },
    [currentConversation?.conversationID],
  );

  const clearConversationMessages = useCallback(() => {
    if (!currentConversation) return;
    modal.confirm({
      title: "清空聊天记录",
      content: "确认清空聊天记录吗？",
      onOk: async () => {
        try {
          await IMSDK.clearConversationAndDeleteAllMsg(
            currentConversation.conversationID,
          );
          clearHistoryMessage();
        } catch (error) {
          feedbackToast({ error, msg: t("toast.clearConversationMessagesFailed") });
        }
      },
    });
  }, [currentConversation?.conversationID]);
  const changeGroupMute = useCallback(() => {
    if (!currentConversation) return;
    IMSDK.changeGroupMute({
      groupID: currentConversation.groupID,
      isMute: currentGroupInfo?.status !== 3,
    });
  }, [currentConversation?.conversationID]);

  return {
    currentConversation,
    updateConversationPin,
    updateConversationMessageRemind,
    clearConversationMessages,
    changeGroupMute,
  };
}
