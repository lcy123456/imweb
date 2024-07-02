import { message, Spin } from "antd";
import { useMemo, useState } from "react";

import { apiAddCollectMessage } from "@/api/chatApi";
import cancelIcon from "@/assets/images/chatFooter/cancel.png";
import forwardIcon from "@/assets/images/chatFooter/forward.png";
import removeIcon from "@/assets/images/chatFooter/remove.png";
import collectIcon from "@/assets/images/messageMenu/collect.png";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useMessageStore, useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";
import emitter from "@/utils/events";
import { formatMessageByType, isGroupSession } from "@/utils/imCommon";

import styles from "./chat-footer.module.scss";

const multipleActionList = [
  {
    title: "收藏",
    icon: collectIcon,
    idx: 3,
  },
  {
    title: "合并转发",
    icon: forwardIcon,
    idx: 1,
  },
  {
    title: "删除",
    icon: removeIcon,
    idx: 2,
  },
];

const MultipleActionBar = () => {
  const [loading, setLoading] = useState(false);
  const selfInfo = useUserStore((state) => state.selfInfo);
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const historyMessageList = useMessageStore((state) => state.historyMessageList);
  const updateCheckMode = useMessageStore((state) => state.updateCheckMode);
  const deleteOneMessage = useMessageStore((state) => state.deleteOneMessage);

  const actionClick = async (idx: number) => {
    if (checkedMessageList.length === 0) {
      message.error("消息不能为空");
      return;
    }
    let flag = true;
    switch (idx) {
      case 1:
        emitter.emit("OPEN_CHOOSE_MODAL", {
          type: "FORWARD_MESSAGE",
          extraData: await getMergeMessage(),
        });
        break;
      case 2:
        flag = checkedMessageList.some((v) => v.sendID !== selfInfo.userID);
        if (currentConversation?.groupID && flag) {
          feedbackToast({
            msg: "暂不支持删除其他人的消息",
            error: "暂不支持删除其他人的消息",
          });
          return;
        }
        await batchDeleteMessage();
        break;
      case 3:
        handleCollect();
        break;
      default:
        break;
    }
    updateCheckMode(false);
  };

  const batchDeleteMessage = async () => {
    if (!currentConversation) return;
    setLoading(true);
    const messageList = checkedMessageList;

    try {
      await Promise.all(
        messageList.map(async (message) => {
          try {
            await IMSDK.deleteMessage({
              clientMsgID: message.clientMsgID,
              conversationID: currentConversation.conversationID,
            });
          } catch (error) {
            await IMSDK.deleteMessageFromLocalStorage({
              clientMsgID: message.clientMsgID,
              conversationID: currentConversation.conversationID,
            });
            throw new Error("deleteMessage error");
          }
        }),
      );
      messageList.forEach((message) => deleteOneMessage(message.clientMsgID));
    } catch (error) {
      feedbackToast({ msg: "部分消息删除失败", error: "部分消息删除失败" });
    }
    setLoading(false);
  };

  const getMergeMessage = async () => {
    const messageList = checkedMessageList.map((v) => ({ ...v, ex: "{}" }));
    const summaryList = messageList
      .slice(0, 4)
      .map((message) => `${message.senderNickname}：${formatMessageByType(message)}`);
    return (
      await IMSDK.createMergerMessage({
        messageList,
        summaryList,
        title: `${
          isGroupSession(currentConversation?.conversationType)
            ? ""
            : `${selfInfo.nickname}与`
        }${currentConversation?.showName}的聊天记录`,
      })
    ).data;
  };

  const handleCollect = async () => {
    if (!currentConversation) return;
    const message = await getMergeMessage();
    try {
      await apiAddCollectMessage({
        content: JSON.stringify(message),
        senderNickname: currentConversation.groupID
          ? currentConversation.showName
          : message.senderNickname,
      });
      feedbackToast({ msg: "收藏成功" });
    } catch (error) {
      feedbackToast({ error });
    }
  };

  const checkedMessageList = useMemo(() => {
    return historyMessageList.filter((message) => message.checked);
  }, [historyMessageList]);

  return (
    <Spin spinning={loading}>
      <div
        className={`${styles["chat-width"]} flex h-[56px] items-center rounded-xl bg-[var(--chat-bubble)] px-5`}
      >
        <img
          className="mr-8 cursor-pointer"
          onClick={() => updateCheckMode(false)}
          width={24}
          src={cancelIcon}
          title="关闭"
        />

        <div className="mr-auto">已选择{checkedMessageList.length}条信息</div>

        {multipleActionList.map((action) => (
          <img
            className="mr-8 cursor-pointer last:mr-0"
            key={action.title}
            onClick={() => actionClick(action.idx)}
            width={24}
            src={action.icon}
            title={action.title}
          />
        ))}
      </div>
    </Spin>
  );
};

export default MultipleActionBar;
