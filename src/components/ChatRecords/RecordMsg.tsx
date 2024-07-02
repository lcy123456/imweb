/* eslint-disable prettier/prettier */
import "./index.scss";

import { SearchOutlined } from "@ant-design/icons";
import { useThrottleFn } from "ahooks";
import { Input } from "antd";
import { MessageType } from "open-im-sdk-wasm";
import { MessageItem } from "open-im-sdk-wasm/lib/types/entity";
import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";

import OIMAvatar from "@/components/OIMAvatar";
import { TextMessageTypes } from "@/constants";
import { IMSDK } from "@/layout/MainContentWrap";
import { MessageComponentMap } from "@/pages/chat/queryChat/MessageItem";
import CatchMessageRender from "@/pages/chat/queryChat/MessageItem/CatchMsgRenderer";
import { useContactStore, useConversationStore, useUserStore } from "@/store";
import { formatMessageTime } from "@/utils/imCommon";

interface Props {
  closeModal: () => void;
}
const RecordMsg: FC<Props> = ({ closeModal }) => {
  const { friendList } = useContactStore();
  const navigate = useNavigate();
  const selfUserID = useUserStore((state) => state.selfInfo.userID);
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const [storeRecord, setStoreRecord] = useState<MessageItem[]>([]);
  // 获取聊天记录
  const [keyword, setKeyword] = useState<string>("");

  const { run: seekRecord } = useThrottleFn(
    async () => {
      if (!keyword) return;
      const { data } = await IMSDK.searchLocalMessages({
        conversationID: currentConversation?.conversationID as string,
        keywordList: [keyword],
        messageTypeList: TextMessageTypes as MessageType[],
        searchTimePosition: 0,
        searchTimePeriod: 0,
        pageIndex: 1,
        count: 999,
      });
      // 保存记录
      if (data.totalCount === 0 || !data.searchResultItems) return;
      const arr = data.searchResultItems[0].messageList;
      setStoreRecord(arr);
    },
    { wait: 1000 },
  ) as { run: () => void };

  // 搜索
  const keyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setStoreRecord([]);
    setKeyword(e.target.value);
  };

  useEffect(() => {
    seekRecord();
  }, [keyword]);

  // 页脚部分
  const Footer = () => {
    return (
      <div className="text-center text-xs">
        {storeRecord.length === 0 ? "无更多数据" : ""}
      </div>
    );
  };

  const handleChatRecord = (message: MessageItem) => {
    navigate(`/home/chat/${currentConversation?.conversationID}`, {
      state: {
        message,
      },
    });
    closeModal();
  };

  return (
    <>
      <div className="query-input">
        <Input
          value={keyword}
          placeholder="搜索"
          onChange={keyChange}
          prefix={<SearchOutlined />}
        />
      </div>

      {/* 内容区域 */}
      <div className="m-2 flex-1">
        <Virtuoso
          style={{ width: "100%", height: "100%" }}
          data={storeRecord}
          itemContent={(index, message) => {
            const MessageRenderComponent =
              MessageComponentMap[message.contentType] || CatchMessageRender;

            const friend = friendList.find((v) => v.userID === message.sendID);
            const showName = friend?.remark || message.senderNickname;

            return (
              <div className="itemContent group flex px-3.5 py-2">
                <OIMAvatar src={message.senderFaceUrl} text={showName} size={42} />
                <div className="mx-3 flex-1 overflow-hidden">
                  {/* 名称跟时间 */}
                  <div className="mb-1 flex text-xs" style={{ width: "100%" }}>
                    <div className="truncate text-[var(--sub-text)]">{showName}</div>
                    <div className="ml-2 text-[var(--sub-text)]">
                      {formatMessageTime(message.sendTime, true)}
                    </div>
                    {/* <div className="message-profile">
                    </div> */}
                  </div>
                  {/* 信息 */}
                  <MessageRenderComponent
                    message={message}
                    isSender={message.sendID === selfUserID}
                  />
                </div>
                <div
                  className="invisible cursor-pointer self-center text-sm text-[var(--primary)] group-hover:visible"
                  onClick={() => handleChatRecord(message)}
                >
                  查看上下文
                </div>
              </div>
            );
          }}
          components={{ Footer }}
        />
      </div>
    </>
  );
};

export default RecordMsg;
