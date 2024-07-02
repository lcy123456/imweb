import { SetBurnDurationParams } from "open-im-sdk-wasm/lib/types/params";
import { FC, ReactNode, useState } from "react";

import { burnMenuList } from "@/constants";
import { useConversationSettings } from "@/hooks/useConversationSettings";
import { IMSDK } from "@/layout/MainContentWrap";
import { useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";

import MyPopover, { menuItemType } from "../MyPopover";

interface Props {
  children: ReactNode;
}
const BurnPopover: FC<Props> = (props) => {
  const { currentConversation } = useConversationSettings();
  const { selfInfo } = useUserStore();

  const [burnVisible, setBurnVisible] = useState(false);
  const [burnLoading, setBurnLoading] = useState(false);

  const burnActionClick = async (idx: menuItemType["idx"], menu: menuItemType) => {
    setBurnLoading(true);
    // console.log("xxx", menu);
    if (!currentConversation?.conversationID) return;
    try {
      switch (idx) {
        case -1:
          await IMSDK.setConversationPrivateChat({
            conversationID: currentConversation.conversationID,
            isPrivate: false,
          });
          break;
        default:
          await IMSDK.setConversationPrivateChat({
            conversationID: currentConversation.conversationID,
            isPrivate: true,
          });
          await IMSDK.setConversationBurnDuration({
            conversationID: currentConversation.conversationID,
            burnDuration: idx,
            ex: selfInfo.nickname,
          } as SetBurnDurationParams);
      }
    } catch (error) {
      console.log(error);
      feedbackToast({ error, msg: "设置失败" });
    } finally {
      setBurnLoading(false);
    }
  };
  return (
    <MyPopover
      trigger="hover"
      placement="leftTop"
      open={burnVisible}
      onOpenChange={(vis) => setBurnVisible(vis)}
      actionClick={burnActionClick}
      menuList={burnMenuList}
      loading={burnLoading}
      contentOptions={{ className: "max-h-[200px]" }}
    >
      {props.children}
    </MyPopover>
  );
};

export default BurnPopover;
