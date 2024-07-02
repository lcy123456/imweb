import { Drawer } from "antd";
import { forwardRef, ForwardRefRenderFunction, memo, useEffect, useState } from "react";

import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { useConversationStore } from "@/store";

import GroupMemberList from "./GroupMemberList";
import GroupMemberListHeader from "./GroupMemberListHeader";
import GroupSettings from "./GroupSettings";

const GroupSetting: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const { currentConversation } = useConversationStore();
  const [isPreviewMembers, setIsPreviewMembers] = useState(false);

  // 判断当前需要展示的群员列表，没值为全部数据，有值为搜索数据，需要在GroupMemberList组件使用
  const [searchKey, setSearchKey] = useState<string>("");

  const modifyState = (text: string) => {
    setSearchKey(text);
  };

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  useEffect(() => {
    if (!isOverlayOpen) {
      setSearchKey("");
    }
  }, [isOverlayOpen]);

  useEffect(() => {
    closeOverlay();
  }, [currentConversation?.conversationID]);

  return (
    <Drawer
      title={
        !isPreviewMembers ? (
          "设置"
        ) : (
          <GroupMemberListHeader
            back2Settings={() => setIsPreviewMembers(false)}
            onModify={modifyState}
          />
        )
      }
      destroyOnClose
      placement="right"
      rootClassName="chat-drawer"
      onClose={closeOverlay}
      afterOpenChange={(visible) => {
        if (!visible) {
          setIsPreviewMembers(false);
        }
      }}
      open={isOverlayOpen}
      maskClassName="opacity-0"
      maskMotion={{
        visible: false,
      }}
      width={380}
      getContainer={"#chat-container"}
    >
      {!isPreviewMembers ? (
        <GroupSettings
          closeOverlay={closeOverlay}
          updateTravel={() => setIsPreviewMembers(true)}
        />
      ) : (
        <GroupMemberList searchKey={searchKey} />
      )}
    </Drawer>
  );
};

export default memo(forwardRef(GroupSetting));
