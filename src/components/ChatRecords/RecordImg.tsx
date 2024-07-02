import "./index.scss";

import { EyeOutlined } from "@ant-design/icons";
import { MessageType } from "open-im-sdk-wasm";
import { MessageItem } from "open-im-sdk-wasm/lib/types/entity";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import emitter from "@/utils/events";
import { formatMessageFileUrl, timeText } from "@/utils/imCommon";

import MyImage from "../MyImage";

interface StoreRecordType {
  titTime: string;
  messageItem: MessageItem[];
}

const count = 50;

const RecordImg = () => {
  const { currentConversation } = useConversationStore();

  const [messageList, setMessageList] = useState<MessageItem[]>([]);

  const pageIndex = useRef(1);
  const [isLoading, setIsLoading] = useState(false);

  const seekRecord = async () => {
    if (isLoading || !currentConversation?.conversationID) return;
    setIsLoading(true);
    try {
      const { data } = await IMSDK.searchLocalMessages({
        conversationID: currentConversation.conversationID,
        keywordList: [""],
        messageTypeList: [MessageType.PictureMessage],
        searchTimePosition: 0,
        searchTimePeriod: 0,
        pageIndex: pageIndex.current,
        count,
      });
      if (data.totalCount === 0 || !data.searchResultItems) return;
      setMessageList([...messageList, ...data.searchResultItems[0].messageList]);
    } finally {
      setIsLoading(false);
    }
  };

  const showRecord = useMemo(() => {
    const arr = [] as StoreRecordType[];
    messageList.forEach((val) => {
      const text = timeText(val.createTime);
      const index = arr.findIndex((v) => v.titTime === text);
      if (index >= 0) {
        arr[index].messageItem.push(val);
      } else {
        arr[arr.length] = { titTime: text, messageItem: [val] };
      }
    });
    return arr;
  }, [messageList]);

  useEffect(() => {
    seekRecord();
  }, []);

  //   触底事件
  const loadMore = useCallback(() => {
    pageIndex.current = pageIndex.current + 1;
    seekRecord();
    return false;
  }, [showRecord]);

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

  const previewInAlbum = (message: MessageItem) => {
    emitter.emit("OPEN_MEDIA_PREVIEW", {
      message,
      mediaList: messageList,
    });
  };

  return (
    <div className="h-full px-5.5 pb-2">
      <Virtuoso
        data={showRecord}
        endReached={loadMore}
        overscan={200}
        itemContent={(_, v) => {
          return (
            <div className="">
              <div className="mb-3">{v.titTime}</div>
              <div className="flex flex-wrap justify-between">
                {v.messageItem.map((message) => {
                  const fileUrl = formatMessageFileUrl(
                    message.pictureElem.sourcePicture.url,
                  );
                  return (
                    <div
                      key={message.clientMsgID}
                      className="mediaWrap"
                      onClick={() => previewInAlbum(message)}
                    >
                      <MyImage width={80} height={80} src={fileUrl} />
                      <div className="previewWrap">
                        <EyeOutlined />
                        <span className="ml-1">预览</span>
                      </div>
                    </div>
                  );
                })}
                <div className="h-0 w-[80px]"></div>
                <div className="h-0 w-[80px]"></div>
                <div className="h-0 w-[80px]"></div>
              </div>
            </div>
          );
        }}
        components={{ Footer }}
      />
    </div>
  );
};

export default RecordImg;
