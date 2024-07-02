import { ArrowLeftOutlined } from "@ant-design/icons";
import { useMemo, useRef } from "react";
import { useMatches } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";

import search from "@/assets/images/conversation/search.png";
import FlexibleSider from "@/components/FlexibleSider";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import { useConversationStore } from "@/store";

import ConversationItem from "./ConversationItem";
import QueryDialog from "./QueryDialog";

const ConversationSider = () => {
  const matches = useMatches();
  const {
    conversationList,
    conversationFolder,
    currentConversationFolder,
    updateCurrentConversationFolder,
  } = useConversationStore();

  const inConversation = useMemo(() => {
    return Boolean(matches[matches.length - 1].params.conversationID);
  }, [matches]);

  const dialogRef = useRef<OverlayVisibleHandle>(null);

  const handleClickSearch = () => {
    dialogRef.current?.openOverlay();
  };

  const archiveList = useMemo(() => {
    return conversationList.filter(({ attachedInfo }) => {
      const tempAttachedInfo = JSON.parse(attachedInfo || "{}") as {
        archive_id: number;
      };
      return tempAttachedInfo.archive_id === currentConversationFolder?.id;
    });
  }, [conversationList, currentConversationFolder]);

  const notArchiveList = useMemo(() => {
    const folderIds = conversationFolder.map((v) => v.id);
    return conversationList.filter(({ attachedInfo }) => {
      const tempAttachedInfo = JSON.parse(attachedInfo || "{}") as {
        archive_id: number;
      };
      return !folderIds.includes(tempAttachedInfo.archive_id);
    });
  }, [conversationList, conversationFolder]);

  const tryBack = () => {
    updateCurrentConversationFolder(undefined);
  };

  return (
    <>
      <FlexibleSider
        needHidden={inConversation}
        wrapClassName="top-3 flex flex-col"
        showAddIcon
      >
        <div className="mb-3 ml-4 mr-3 flex">
          {currentConversationFolder && (
            <ArrowLeftOutlined className="mr-2 cursor-pointer" onClick={tryBack} />
          )}
          <div
            className="flex h-[40px] flex-1 cursor-pointer items-center rounded-[40px] bg-gray-100"
            onClick={handleClickSearch}
          >
            <img className="mx-4" width={24} src={search} alt="" />
            <span className="text-base text-gray-400">搜索</span>
          </div>
        </div>
        <div className="flex flex-1 flex-nowrap">
          <Virtuoso
            className={`${
              currentConversationFolder && "-translate-x-full"
            } w-full shrink-0 transition-transform`}
            data={notArchiveList}
            itemContent={(_, conversation) => (
              <ConversationItem conversation={conversation} />
            )}
            tabIndex={undefined}
          />
          <Virtuoso
            className={`${
              currentConversationFolder && "-translate-x-full"
            } w-full shrink-0 transition-transform`}
            data={archiveList}
            itemContent={(_, conversation) => (
              <ConversationItem conversation={conversation} />
            )}
            tabIndex={undefined}
          />
        </div>
      </FlexibleSider>
      <QueryDialog
        ref={dialogRef}
        archiveList={currentConversationFolder ? archiveList : undefined}
      />
    </>
  );
};

export default ConversationSider;
