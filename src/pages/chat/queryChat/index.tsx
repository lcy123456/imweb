import { InboxOutlined } from "@ant-design/icons";
import { useUnmount } from "ahooks";
import { Layout } from "antd";
import { DragEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import useFavoriteEmoji from "@/hooks/useFavoriteEmoji";
import { useConversationStore, useMessageStore } from "@/store";

import ChatContent from "./ChatContent";
import ChatFooter from "./ChatFooter";
import MultipleActionBar from "./ChatFooter/MultipleActionBar";
import { useFileMessage } from "./ChatFooter/SendActionBar/useFileMessage";
import { useSendMessage } from "./ChatFooter/useSendMessage";
import ChatHeader from "./ChatHeader";
import useConversationState from "./useConversationState";

export const QueryChat = () => {
  const { conversationID } = useParams();
  const { isCheckMode, clearHistoryMessage, updateCheckMode, clearPinnedMessageList } =
    useMessageStore();
  const { updateCurrentConversation, updateQuoteMessage, updateTypingStatus } =
    useConversationStore();
  const { createFileMessage } = useFileMessage();
  const { sendMessage } = useSendMessage();
  const { getFavoriteEmojiList } = useFavoriteEmoji();

  useConversationState();

  const [drapUploadVisible, setDrapUploadVisible] = useState(false);

  useEffect(() => {
    getFavoriteEmojiList();
    return () => {
      useMessageStore.setState(() => ({
        hasEndMore: false,
      }));
      updateCheckMode(false);
      clearHistoryMessage();
      updateQuoteMessage();
      clearPinnedMessageList();
      updateTypingStatus("");
    };
  }, [conversationID]);

  useUnmount(() => {
    updateCurrentConversation();
  });

  const switchFooter = () => {
    if (isCheckMode) {
      return <MultipleActionBar />;
    }
    return <ChatFooter />;
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("Files")) {
      setDrapUploadVisible(true);
    }
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).className.includes("dragLeave")) {
      setDrapUploadVisible(false);
    }
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrapUploadVisible(false);
    const files = [...e.dataTransfer.files];
    files.forEach(async (file) => {
      const message = await createFileMessage(file);
      sendMessage({ message });
    });
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <Layout
      id="chat-container"
      className="relative overflow-hidden bg-[url('@/assets/images/chat_bg.png')]"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {drapUploadVisible && (
        <div
          className="dragLeave absolute inset-0 z-[9999] bg-[rgba(0,0,0,.3)] text-3xl"
          onClick={() => setDrapUploadVisible(false)}
        >
          <div className="pointer-events-none flex h-full flex-col items-center justify-center ">
            <InboxOutlined className="text-[80px] text-[--primary]" />
            <div className=" text-gray-300">拖拽到此处发送文件</div>
          </div>
        </div>
      )}
      <ChatHeader />
      {/* {loading ? <div className="h-full text-center">loading..</div> : <ChatContent />} */}
      <ChatContent key={conversationID} />
      {switchFooter()}
    </Layout>
  );
};
