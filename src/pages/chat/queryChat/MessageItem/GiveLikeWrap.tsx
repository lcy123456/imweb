import clsx from "clsx";
import { useMemo, useState } from "react";

import { apiGiveLikeMessage } from "@/api/imApi";
import { useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";
import { likeEmojis } from "@/utils/emojis";

import { IMessageItemProps } from ".";
import SendTimeWrap from "./SendTimeWrap";

export interface GiveLikeItem {
  key: string;
  uid: string;
  time: number;
}
interface Props extends IMessageItemProps {
  hasTimeWrap?: boolean;
}
const GiveLikeWrap = (props: Props) => {
  const { message, hasTimeWrap } = props;
  const { selfInfo } = useUserStore();

  const giveLikeList = useMemo(() => {
    const { ex } = message;
    const { giveLike } = JSON.parse(ex || "{}") as { giveLike?: GiveLikeItem[] };
    const res: {
      [key: string]: GiveLikeItem[];
    } = {};
    giveLike?.reduce((pre, item) => {
      if (!pre[item.key]) {
        pre[item.key] = [];
      }
      pre[item.key].push(item);
      return pre;
    }, res);
    return res;
  }, [message.ex]);

  const handleClick = async (emoji: string | undefined) => {
    if (!emoji) return;
    try {
      await apiGiveLikeMessage({
        ...message,
        emoji: emoji,
      });
    } catch (error) {
      feedbackToast({ error, msg: "消息点赞异常" });
    }
  };

  return Object.keys(giveLikeList).length > 0 ? (
    <div className="mt-1 flex">
      {Object.keys(giveLikeList).map((v) => {
        const likeEmoji = likeEmojis.find((j) => j.context === v);
        const isSelfLike = giveLikeList[v].some((j) => j.uid === selfInfo.userID);
        return (
          <div
            className={clsx(
              "mr-2 flex h-[22px] cursor-pointer items-center",
              "rounded-full bg-[#008dff]  px-1",
              isSelfLike ? "" : "bg-opacity-10",
            )}
            key={v}
            onClick={() => handleClick(likeEmoji?.context)}
          >
            <img src={likeEmoji?.src} alt="" width={16} />
            <span className={clsx("mx-1", isSelfLike ? "text-white" : "text-gray-600")}>
              {giveLikeList[v].length}
            </span>
          </div>
        );
      })}
      {hasTimeWrap && (
        <SendTimeWrap {...props} className="invisible ml-2"></SendTimeWrap>
      )}
    </div>
  ) : (
    <></>
  );
};

export default GiveLikeWrap;
