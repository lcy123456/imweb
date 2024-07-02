import "../conPage.scss";

import dayjs from "dayjs";
import { SessionType } from "open-im-sdk-wasm";
import {
  FriendUserItem,
  GroupItem,
  MessageItem,
  SearchMessageResultItem,
} from "open-im-sdk-wasm/lib/types/entity";
import { GetOneConversationParams } from "open-im-sdk-wasm/lib/types/params";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import empty from "@/assets/images/searchModal/empty.png";
import OIMAvatar from "@/components/OIMAvatar";
import { IMSDK } from "@/layout/MainContentWrap";
import { useContactStore, useConversationStore } from "@/store";
import { formatMessageByType } from "@/utils/imCommon";

import { RecordList } from "../QueryDialog";

interface Props {
  recordData: RecordList[];
  activeKey: string;
  setActiveKey: (val: string) => void;
  closeModal: () => void;
}
const Comprehensive = (props: Props) => {
  const { friendList } = useContactStore();
  const { recordData, activeKey, setActiveKey, closeModal } = props;
  const navigate = useNavigate();
  const { updateCurrentConversation } = useConversationStore();
  // 右侧聊天记录信息
  const [rightRecord, setRightRecord] = useState<SearchMessageResultItem | null>(null);

  const [recordList, setRecordList] = useState<RecordList[]>(recordData);

  useEffect(() => {
    switch (activeKey) {
      case "1":
        setRecordList(recordData);
        break;
      case "2":
        setRecordList(recordData.filter((val) => val.type === "Contact"));
        break;
      case "3":
        setRecordList(recordData.filter((val) => val.type === "Group"));
        break;
      case "4":
        setRecordList(recordData.filter((val) => val.type === "Record"));
        break;
      default:
        break;
    }
    if (activeKey !== "4") {
      setRightRecord(null);
      setActiveId("");
    }
  }, [activeKey, recordData]);

  // 选中聊天记录高亮，然后展示聊天内容
  const [activeId, setActiveId] = useState<string>("");

  // 选择聊天纪律
  const handleSel = async (item: RecordList["list"][0], val: RecordList) => {
    if (item.messageCount) {
      const _item = item as SearchMessageResultItem;
      setActiveKey("4");
      setActiveId(_item.conversationID);
      setRightRecord(_item);
      return;
    }
    let _item;
    setActiveId("");

    let params: GetOneConversationParams = { sessionType: 0, sourceID: "" };
    switch (val.type) {
      case "Contact":
        _item = item as FriendUserItem;
        params = {
          sessionType: SessionType.Single,
          sourceID: _item.userID,
        };
        break;
      case "Group":
        _item = item as GroupItem;
        params = {
          sessionType: SessionType.WorkingGroup,
          sourceID: _item.groupID,
        };
        break;
      default:
        break;
    }

    const { data } = await IMSDK.getOneConversation(params);
    if (!data) return;
    updateCurrentConversation({ ...data });
    navigate(`/home/chat/${data.conversationID}`);
    // 关闭弹窗
    closeModal();
  };

  const handleChatRecord = async (message: MessageItem) => {
    if (!rightRecord) return;
    const { data } = await IMSDK.getMultipleConversation([rightRecord?.conversationID]);
    const conversation = data[0];
    updateCurrentConversation(conversation);
    navigate(`/home/chat/${conversation.conversationID}`, {
      state: {
        message,
      },
    });
    closeModal();
  };
  const getMessageContent = (message: MessageItem) => {
    if (!message) return "";
    const text = formatMessageByType(message);
    const regWithoutHtml = /(<([^>]+)>)/gi;
    return text.replace(regWithoutHtml, "");
  };

  return (
    <div className="r-content">
      {recordList.length > 0 ? (
        recordList.map((val) => {
          return (
            <div className={`${activeKey === "4" && "r-flex"} records`} key={val.type}>
              {activeKey === "1" && (
                <div className="r-title px-3.5 pb-1">{val.title}</div>
              )}
              <div className={`r-list`}>
                {val.list.map((item, index) => {
                  const showName =
                    item.showName || item.remark || item.nickname || item.groupName;
                  const isGroup = item.conversationID
                    ? item.conversationType !== SessionType.Single
                    : Boolean(item.groupID);
                  return (
                    <div
                      className={`${
                        activeId === item?.conversationID && "r-sel"
                      } r-item rounded-md px-3.5 py-3`}
                      key={index}
                      onClick={() => handleSel(item, val)}
                    >
                      <OIMAvatar
                        src={item.faceURL}
                        isgroup={isGroup}
                        text={showName}
                        size={42}
                      />
                      <div className="ml-3 overflow-hidden">
                        <div className="r-name mb-1 truncate ">{showName}</div>
                        {val.type === "Record" && (
                          <div className="r-chat truncate text-xs">
                            {item.messageCount && item.messageCount > 1
                              ? `${item.messageCount}条相关聊天记录`
                              : `${item.messageList?.[0]?.senderNickname}：${
                                  item.messageList &&
                                  getMessageContent(item.messageList?.[0])
                                }`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {activeKey === "4" && (
                <div className="r-right-record">
                  <div className={`r-list`}>
                    {rightRecord?.messageList?.map((message: MessageItem, i) => {
                      const friend = friendList.find(
                        (v) => v.userID === message.sendID,
                      );
                      const showName = friend?.remark || message.senderNickname;
                      return (
                        <div
                          className="r-item rounded-md px-3.5 py-3"
                          key={i}
                          onClick={() => handleChatRecord(message)}
                        >
                          <OIMAvatar
                            src={message.senderFaceUrl}
                            text={showName}
                            size={42}
                          ></OIMAvatar>
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="r-name mb-1 flex items-center justify-between">
                              <div className="truncate">{showName}</div>
                              <div className="ml-1 text-xs text-gray-400">
                                {dayjs(message.sendTime).format("YYYY/MM/DD")}
                              </div>
                            </div>
                            <div className="r-chat truncate text-xs">
                              {getMessageContent(message)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="noData">
          <img src={empty} alt="" />
          <div className="prompt">没有更多搜索结果</div>
        </div>
      )}
    </div>
  );
};

export default Comprehensive;
