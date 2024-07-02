import { Popover } from "antd";
import { GroupItem } from "open-im-sdk-wasm/lib/types/entity";
import { useCallback, useRef, useState } from "react";

import add_friend from "@/assets/images/conversation/add_friend.png";
import add_friend_active from "@/assets/images/conversation/add_friend_active.png";
import add_group from "@/assets/images/conversation/add_group.png";
import add_group_active from "@/assets/images/conversation/add_group_active.png";
import create_group from "@/assets/images/conversation/create_group.png";
import create_group_active from "@/assets/images/conversation/create_group_active.png";
import show_more from "@/assets/images/conversation/show_more.png";
import MyPopover, { menuItemType } from "@/components/MyPopover";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import { CardInfo } from "@/pages/common/UserCardModal";
import emitter from "@/utils/events";

import SearchUserOrGroup from "./SearchUserOrGroup";

const AddActionIcon = () => {
  const searchModalRef = useRef<OverlayVisibleHandle>(null);

  const [actionVisible, setActionVisible] = useState(false);
  const [isSearchGroup, setIsSearchGroup] = useState(false);

  const openUserCardWithData = useCallback((cardInfo: CardInfo) => {
    searchModalRef.current?.closeOverlay();
    emitter.emit("OPEN_USER_CARD", { userID: cardInfo.userID, cardInfo });
  }, []);

  const openGroupCardWithData = useCallback((group: GroupItem) => {
    searchModalRef.current?.closeOverlay();
    emitter.emit("OPEN_GROUP_CARD", group);
  }, []);

  const actionClick = (idx: menuItemType["idx"]) => {
    switch (idx) {
      case 0:
      case 1:
        setIsSearchGroup(Boolean(idx));
        searchModalRef.current?.openOverlay();
        break;
      case 2:
        emitter.emit("OPEN_CHOOSE_MODAL", { type: "CRATE_GROUP" });
        break;
      case 3:
        break;
      default:
        break;
    }
    setActionVisible(false);
  };

  return (
    <div className="absolute bottom-5 right-5 z-20 ">
      <MyPopover
        placement="top"
        open={actionVisible}
        onOpenChange={(vis) => setActionVisible(vis)}
        menuList={actionMenuList}
        actionClick={actionClick}
      >
        <img className="cursor-pointer" width={46} src={show_more} alt="" />
      </MyPopover>
      <SearchUserOrGroup
        ref={searchModalRef}
        isSearchGroup={isSearchGroup}
        openUserCardWithData={openUserCardWithData}
        openGroupCardWithData={openGroupCardWithData}
      />
    </div>
  );
};

export default AddActionIcon;

const actionMenuList: menuItemType[] = [
  {
    idx: 0,
    title: "添加好友",
    icon: add_friend,
    active_icon: add_friend_active,
  },
  {
    idx: 1,
    title: "添加群组",
    icon: add_group,
    active_icon: add_group_active,
  },
  {
    idx: 2,
    title: "创建群组",
    icon: create_group,
    active_icon: create_group_active,
  },
];
