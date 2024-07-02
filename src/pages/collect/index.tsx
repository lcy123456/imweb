import { useRequest } from "ahooks";
import { Layout } from "antd";
import { MessageType } from "open-im-sdk-wasm";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import { modal } from "@/AntdGlobalComp";
import {
  apiGetCollectMessage,
  apiRemoveCollectMessage,
  CollectMessageItemRes,
} from "@/api/chatApi";
import removeIcon from "@/assets/images/chatFooter/remove.png";
// import search from "@/assets/images/conversation/search.png";
import FlexibleSider from "@/components/FlexibleSider";
// import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import { MessageComponentMap } from "@/pages/chat/queryChat/MessageItem";
import { ExMessageItem } from "@/store";
import { feedbackToast } from "@/utils/common";
import { formatConversionTime } from "@/utils/imCommon";

// import QueryDialog from "../chat/ConversationSider/QueryDialog";
import CatchMessageRender from "../chat/queryChat/MessageItem/CatchMsgRenderer";
import styles from "./collect.module.scss";

export const Collect = () => {
  // const dialogRef = useRef<OverlayVisibleHandle>(null);
  // const handleClick = () => {
  //   dialogRef.current?.openOverlay();
  // };

  const [pageNumber, setPageNumber] = useState(1);
  const [collectList, setCollectList] = useState<CollectMessageItemRes[]>([]);
  const { loading, runAsync } = useRequest(apiGetCollectMessage, {
    manual: true,
  });

  const handleEndReached = useCallback(async () => {
    const res = await runAsync({
      pagination: {
        pageNumber,
        showNumber: 20,
      },
    });
    if (!res.data.list) return true;
    const list = (res.data.list || []).map((v) => {
      const message = JSON.parse(v.content) as ExMessageItem;
      return {
        ...v,
        message: {
          ...message,
          clientMsgID: `${message.clientMsgID}${v.id}`,
        },
      };
    });
    setCollectList([...collectList, ...list]);
    setPageNumber(pageNumber + 1);
  }, [collectList, pageNumber]);

  useEffect(() => {
    handleEndReached();
  }, []);

  const handleRemove = (item: CollectMessageItemRes) => {
    modal.confirm({
      title: "移除收藏",
      content: `确定移除收藏吗？`,
      onOk: async () => {
        try {
          await apiRemoveCollectMessage({
            id: item.id,
          });
          feedbackToast({ msg: "移除成功" });
          const list = collectList.filter((v) => v.id !== item.id);
          const res = await runAsync({
            pagination: {
              pageNumber: pageNumber - 1,
              showNumber: 20,
            },
          });
          const latest = res.data.list?.at(-1);
          const flag = list.some((v) => v.id === latest?.id);
          setCollectList(flag || !latest ? list : [...list, latest]);
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  };

  const mediaList = useMemo(() => {
    return collectList
      .filter((v) => {
        return [MessageType.VideoMessage, MessageType.PictureMessage].includes(
          v.message.contentType,
        );
      })
      .map((v) => ({ ...v.message }));
  }, [collectList]);

  return (
    <Layout className={`${styles.collect_wrap} -ml-[20px] flex-row `}>
      <FlexibleSider
        needHidden={false}
        wrapClassName="top-3 flex flex-col"
        siderResizeClassName="!min-w-[380px]"
      >
        {/* <div
          className="mb-3 ml-4 mr-3 flex h-[40px] cursor-pointer items-center rounded-[40px] bg-gray-100"
          onClick={handleClick}
        >
          <img className="mx-4" width={24} src={search} alt="" />
          <span className="text-base text-gray-400">搜索</span>
        </div> */}
        {collectList.length === 0 && <div className="text-center">暂无收藏记录</div>}
        <Virtuoso
          data={collectList}
          endReached={handleEndReached}
          components={{
            Header: () => {
              return loading ? (
                <div className="h-3 text-center text-white">loading...</div>
              ) : (
                <></>
              );
            },
          }}
          computeItemKey={(_, item) => item.id}
          itemContent={(_, item) => {
            const message = item.message;
            const MessageRenderComponent =
              MessageComponentMap[message.contentType] || CatchMessageRender;
            return (
              <div className="border-b border-[var(--gap-text)] p-3 pl-4">
                <div className="mb-2 flex">
                  <MessageRenderComponent
                    message={message}
                    isSender={false}
                    mediaList={mediaList}
                  />
                  <img
                    className="ml-auto h-fit cursor-pointer"
                    src={removeIcon}
                    alt=""
                    width={18}
                    onClick={() => handleRemove(item)}
                  />
                </div>
                <div className="flex justify-between text-[var(--sub-text)]">
                  <span>{item.senderNickname}</span>
                  <span>{formatConversionTime(item.createAt)}</span>
                </div>
              </div>
            );
          }}
        />

        {/* 搜索弹窗 */}
        {/* <QueryDialog ref={dialogRef} /> */}
      </FlexibleSider>
      <Layout className="bg-[url('@/assets/images/chat_bg.png')]"></Layout>
    </Layout>
  );
};
