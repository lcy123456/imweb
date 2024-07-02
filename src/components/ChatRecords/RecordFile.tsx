import "./index.scss";

import { useThrottleFn } from "ahooks";
import { MessageType } from "open-im-sdk-wasm";
import { MessageItem } from "open-im-sdk-wasm/lib/types/entity";
import React, { useCallback, useEffect, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import { IMSDK } from "@/layout/MainContentWrap";
import FileMessageRenderer from "@/pages/chat/queryChat/MessageItem/FileMessageRenderer";
import { useContactStore, useConversationStore } from "@/store";
import { formatMessageTime } from "@/utils/imCommon";

const RecordMsg: React.FC = () => {
  const { friendList } = useContactStore();
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const [storeRecord, setStoreRecord] = useState<MessageItem[]>([]);
  const count = 50;
  const [pageIndex, setPageIndex] = useState<number>(1);

  // 判断接口数据还有多少条，如果少于50的话就不在请求接口和现实loading - true还有数据，false不需要显示底部组件
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { run: seekRecord } = useThrottleFn(
    async () => {
      const { data } = await IMSDK.searchLocalMessages({
        conversationID: currentConversation?.conversationID as string,
        keywordList: [],
        messageTypeList: [MessageType.FileMessage],
        searchTimePosition: 0,
        searchTimePeriod: 0,
        pageIndex,
        count,
      });
      // console.log("data", data);
      data.totalCount < count && setIsLoading(false); // 判断如果返回数据小于请求当前页的数量的时候返回false
      // 保存记录
      if (data.totalCount === 0 || !data.searchResultItems) return;
      const arr = storeRecord
        ? storeRecord?.concat(data.searchResultItems[0].messageList)
        : data.searchResultItems[0].messageList;
      setStoreRecord(arr);
    },
    { wait: 1000 },
  ) as { run: () => void };

  useEffect(() => {
    seekRecord();
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading) return;
    setPageIndex(pageIndex + 1);
    seekRecord();
  }, [storeRecord]);

  // 页脚部分
  const Footer = () => {
    return isLoading ? (
      <div
        style={{
          padding: "1rem",
          display: "flex",
          justifyContent: "center",
          fontSize: "12px",
        }}
      >
        Loading...
      </div>
    ) : (
      <div
        style={{
          padding: "1rem",
          display: "flex",
          justifyContent: "center",
          fontSize: "12px",
        }}
      >
        已无更多数据
      </div>
    );
  };

  const handleUpdateMessage = (message: MessageItem) => {
    const temp = [...storeRecord];
    const index = temp?.findIndex((v) => v.clientMsgID === message.clientMsgID);
    if (index !== -1) {
      temp[index] = message;
      setStoreRecord(temp);
    }
  };

  return (
    <div className="h-full pb-2">
      <Virtuoso
        style={{ width: "100%", height: "100%" }}
        data={storeRecord}
        endReached={loadMore}
        overscan={20}
        itemContent={(index, message) => {
          const friend = friendList.find((v) => v.userID === message.sendID);
          const showName = friend?.remark || message.senderNickname;
          return (
            <div className="mb-4 px-5">
              <div className="mb-1 flex text-sm text-[var(--sub-text)]">
                <div className="mr-2 max-w-[160px] truncate">{showName}</div>
                <div>{formatMessageTime(message.sendTime, true)}</div>
              </div>
              <FileMessageRenderer
                message={message}
                isChatContainer={true}
                isSender={false}
                updateMessage={handleUpdateMessage}
              />
            </div>
          );
        }}
        components={{ Footer }}
      />
    </div>
  );
};

export default RecordMsg;
