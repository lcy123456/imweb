import { Badge } from "antd";
import clsx from "clsx";
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import group_notifications from "@/assets/images/contact/group_notifications.png";
import my_friends from "@/assets/images/contact/my_friends.png";
import my_groups from "@/assets/images/contact/my_groups.png";
import new_friends from "@/assets/images/contact/new_friends.png";
import search from "@/assets/images/conversation/search.png";
import FlexibleSider from "@/components/FlexibleSider";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import { useContactStore } from "@/store";

import QueryDialog from "../chat/ConversationSider/QueryDialog";

const Links = [
  {
    label: "新的朋友",
    icon: new_friends,
    path: "/home/contact/newFriends",
  },
  {
    label: "群通知",
    icon: group_notifications,
    path: "/home/contact/groupNotifications",
  },
  {
    label: "我的好友",
    icon: my_friends,
    path: "/home/contact",
  },
  {
    label: "我的群组",
    icon: my_groups,
    path: "/home/contact/myGroups",
  },
];

const ContactSider = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unHandleFriendApplicationCount, unHandleGroupApplicationCount } =
    useContactStore();

  const [activePath, setActivePath] = useState(location.pathname);
  const getBadge = (index: number) => {
    if (index === 0) {
      return unHandleFriendApplicationCount;
    }
    if (index === 1) {
      return unHandleGroupApplicationCount;
    }
    return 0;
  };

  const dialogRef = useRef<OverlayVisibleHandle>(null);
  const handleClick = () => {
    dialogRef.current?.openOverlay();
  };

  return (
    <FlexibleSider needHidden={true} wrapClassName="top-3" showAddIcon>
      <div
        className="mb-3 ml-4 mr-3 flex h-[40px] cursor-pointer items-center rounded-[40px] bg-gray-100"
        onClick={handleClick}
      >
        <img className="mx-4" width={24} src={search} alt="" />
        <span className="text-base text-gray-400">搜索</span>
      </div>
      <ul className="h-full">
        {Links.map((item, index) => {
          return (
            <li
              key={item.path}
              className={clsx(
                "flex cursor-pointer items-center rounded-md p-3 pl-4 text-sm hover:bg-[var(--primary-active)]",
                {
                  "bg-[var(--primary-active)]": item.path === activePath,
                },
              )}
              onClick={() => {
                setActivePath(item.path);
                navigate(String(item.path));
              }}
            >
              <img src={item.icon} className="mr-4 rounded-md" width={42} />
              <div className="font-sBold text-base">{item.label}</div>
              <Badge
                className="ml-auto"
                size="small"
                style={{ backgroundColor: "#52c41a" }}
                count={getBadge(index)}
              ></Badge>
            </li>
          );
        })}
      </ul>

      {/* 搜索弹窗 */}
      <QueryDialog ref={dialogRef} />
    </FlexibleSider>
  );
};
export default ContactSider;
