import { ReloadOutlined, RightOutlined } from "@ant-design/icons";
import { Badge, Divider, Layout, Popover, Spin, Upload } from "antd";
import clsx from "clsx";
import { MessageReceiveOptType } from "open-im-sdk-wasm";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  UNSAFE_NavigationContext,
  useLocation,
  useNavigate,
  useResolvedPath,
} from "react-router-dom";
import { v4 as uuidV4 } from "uuid";

import { modal } from "@/AntdGlobalComp";
import {
  apiConversationFolderUpdate,
  apiSetConversation,
  ConversationFolderItem,
} from "@/api/imApi";
import { updateBusinessUserInfo } from "@/api/login";
import delete_icon from "@/assets/images/chatHeader/delete.png";
import edit_icon from "@/assets/images/messageMenu/edit.png";
import edit_active from "@/assets/images/messageMenu/edit_active.png";
import archive_active from "@/assets/images/nav/archive_active.png";
import archive_icon from "@/assets/images/nav/archive_icon.png";
import archive_more from "@/assets/images/nav/archive_more.png";
import archive_more_active from "@/assets/images/nav/archive_more_active.png";
import add_account_icon from "@/assets/images/nav/nav_add_account.png";
import nav_archive_icon from "@/assets/images/nav/nav_archive.png";
import nav_archive_active from "@/assets/images/nav/nav_archive_active.png";
import account_icon from "@/assets/images/nav/nav_bar_account.png";
import account_active from "@/assets/images/nav/nav_bar_account_active.png";
import contact_icon from "@/assets/images/nav/nav_bar_contact.png";
import contact_icon_active from "@/assets/images/nav/nav_bar_contact_active.png";
import message_icon from "@/assets/images/nav/nav_bar_message.png";
import message_icon_active from "@/assets/images/nav/nav_bar_message_active.png";
import collect from "@/assets/images/nav/nav_collect.png";
import collect_active from "@/assets/images/nav/nav_collect_active.png";
import remove_account_icon from "@/assets/images/nav/nav_remove_account.png";
import change_avatar from "@/assets/images/profile/change_avatar.png";
import MyPopover, { menuItemType } from "@/components/MyPopover";
import OIMAvatar from "@/components/OIMAvatar";
import useMoreAccount from "@/hooks/useMoreAccount";
import { useContactStore, useConversationStore, useUserStore } from "@/store";
import { MoreAccountItem } from "@/store/type";
import { feedbackToast, getFileType } from "@/utils/common";
import emitter from "@/utils/events";
import { setIMProfile } from "@/utils/storage";

import { OverlayVisibleHandle } from "../../hooks/useOverlayVisible";
import { IMSDK } from "../MainContentWrap";
import About from "./About";
import styles from "./left-nav-bar.module.scss";
import PersonalSettings from "./PersonalSettings";

const { Sider } = Layout;

const NavList = [
  {
    icon: message_icon,
    icon_active: message_icon_active,
    title: "消息",
    path: "/home/chat",
  },
  {
    icon: contact_icon,
    icon_active: contact_icon_active,
    title: "通讯录",
    path: "/home/contact",
  },
  {
    icon: collect,
    icon_active: collect_active,
    title: "收藏",
    path: "/home/collect",
  },
];

type NavItemType = (typeof NavList)[0];

const NavItem = ({ nav }: { nav: NavItemType }) => {
  const { icon, icon_active, path } = nav;
  const { unReadCount, currentConversationFolder, updateCurrentConversationFolder } =
    useConversationStore();

  const resolvedPath = useResolvedPath(path);
  const { navigator } = React.useContext(UNSAFE_NavigationContext);
  const toPathname = navigator.encodeLocation
    ? navigator.encodeLocation(path).pathname
    : resolvedPath.pathname;
  const locationPathname = location.pathname;
  let isActive = false;
  if (!currentConversationFolder) {
    isActive =
      locationPathname === toPathname ||
      (locationPathname.startsWith(toPathname) &&
        locationPathname.charAt(toPathname.length) === "/") ||
      location.hash.startsWith(`#${toPathname}`);
  }

  const unHandleFriendApplicationCount = useContactStore(
    (state) => state.unHandleFriendApplicationCount,
  );
  const unHandleGroupApplicationCount = useContactStore(
    (state) => state.unHandleGroupApplicationCount,
  );

  const tryNavigate = () => {
    if (isActive) return;
    // TODO 从其他页面跳转回到chat页面时，保持回话（如果存在）
    if (path === "/home/chat") {
      !location.href.includes("/home/chat") && navigator.push(path);
    } else {
      navigator.push(path);
    }
    updateCurrentConversationFolder(undefined);
  };

  const getBadge = () => {
    if (path === "/home/chat") {
      return unReadCount;
    }
    if (path === "/home/contact") {
      return unHandleFriendApplicationCount + unHandleGroupApplicationCount;
    }
    return 0;
  };

  return (
    <Badge
      size="small"
      count={getBadge()}
      style={{ backgroundColor: "#52c41a" }}
      offset={[-5, 4]}
    >
      <div
        className={clsx(
          "mb-5 flex h-[52px] w-12 cursor-pointer flex-col items-center justify-center",
        )}
        onClick={tryNavigate}
      >
        <img width={24} src={isActive ? icon_active : icon} alt="" />
        {/* <div
          className={clsx(
            "mt-1 font-sMedium text-xs",
            isActive ? "text-[var(--primary)]" : "text-gray-400",
          )}
        >
          {title}
        </div> */}
      </div>
    </Badge>
  );
};

const profileMenuList = [
  {
    title: "我的信息",
    gap: true,
    idx: 0,
  },
  {
    title: "账号设置",
    gap: true,
    idx: 1,
  },
  {
    title: "安装指引",
    gap: false,
    idx: 4,
  },
  {
    title: "关于我们",
    gap: false,
    idx: 2,
  },
  {
    title: "退出登录",
    gap: false,
    idx: 3,
  },
];

const LeftNavBar = memo(() => {
  const aboutRef = useRef<OverlayVisibleHandle>(null);
  const personalSettingsRef = useRef<OverlayVisibleHandle>(null);
  const [showProfile, setShowProfile] = useState(false);
  const selfInfo = useUserStore((state) => state.selfInfo);
  const userLogout = useUserStore((state) => state.userLogout);
  const updateSelfInfo = useUserStore((state) => state.updateSelfInfo);
  const { conversationFolder } = useConversationStore();

  const profileMenuClick = (idx: number) => {
    switch (idx) {
      case 0:
        emitter.emit("OPEN_USER_CARD", { isSelf: true });
        break;
      case 1:
        personalSettingsRef.current?.openOverlay();
        break;
      case 2:
        aboutRef.current?.openOverlay();
        break;
      case 3:
        tryLogout();
        break;
      case 4:
        const url = `${import.meta.env.VITE_SERVE_ORIGIN}/#/installPackage`;
        window.openHttp(url);
        break;
      default:
        break;
    }
    setShowProfile(false);
  };

  const tryLogout = () => {
    modal.confirm({
      title: "退出登录",
      content: "确认退出登录当前账号吗？",
      onOk: async () => {
        try {
          await userLogout();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  };

  const customUpload = async ({ file }: { file: File }) => {
    try {
      const {
        data: { url },
      } = await IMSDK.uploadFile({
        name: file.name,
        contentType: getFileType(file.name),
        uuid: uuidV4(),
        file,
      });
      const newInfo = {
        faceURL: url,
        userID: selfInfo.userID,
      };
      await updateBusinessUserInfo(newInfo);
      updateSelfInfo(newInfo);
    } catch (error) {
      feedbackToast({ error: "修改头像失败！" });
    }
  };

  const ProfileContent = useMemo(
    () => (
      <div className="relative w-72 px-2.5 pb-3 pt-5.5">
        <div className="mb-4.5 ml-3 flex items-center">
          <Upload
            accept="image/*"
            showUploadList={false}
            customRequest={customUpload as any}
          >
            <div className={styles["avatar-wrapper"]}>
              <OIMAvatar src={selfInfo.faceURL} text={selfInfo.nickname} />
              <div className={styles["mask"]}>
                <img src={change_avatar} width={19} alt="" />
              </div>
            </div>
          </Upload>
          <div className="flex-1 overflow-hidden">
            <div className="mb-1 text-base font-medium">{selfInfo.nickname}</div>
          </div>
        </div>
        <ReloadOutlined
          className="absolute right-4 top-4 cursor-pointer text-base text-gray-300 transition hover:rotate-180"
          title="刷新"
          onClick={() => window.location.reload()}
        />
        {profileMenuList.map((menu) => (
          <div key={menu.idx}>
            <div
              className="flex cursor-pointer items-center justify-between rounded-md px-3 py-4 hover:bg-[var(--primary-active)]"
              onClick={() => profileMenuClick(menu.idx)}
            >
              <div>{menu.title}</div>
              <RightOutlined rev={undefined} />
            </div>
            {menu.gap && (
              <div className="px-3">
                <Divider className="my-1.5 border-[var(--gap-text)]" />
              </div>
            )}
          </div>
        ))}
      </div>
    ),
    [selfInfo],
  );

  const folderNav = useMemo(() => {
    return conversationFolder.slice(0, 3);
  }, [conversationFolder]);

  return (
    <Sider
      className="no-mobile z-10 mr-[20px] dark:!bg-[#141414]"
      width={60}
      theme="light"
      style={{ boxShadow: "0px 0px 20px 0px rgba(0,0,0,0.08)" }}
    >
      <div className="mt-3 flex h-full flex-col items-center">
        <Popover
          content={ProfileContent}
          trigger="click"
          placement="rightBottom"
          overlayClassName="profile-popover"
          title={null}
          arrow={false}
          open={showProfile}
          onOpenChange={(val) => setShowProfile(val)}
        >
          <OIMAvatar
            className="mb-6 cursor-pointer"
            src={selfInfo.faceURL}
            text={selfInfo.nickname}
            shape="square"
            size={44}
          />
        </Popover>

        <div className="flex flex-1 flex-col">
          {NavList.map((nav) => (
            <NavItem nav={nav} key={nav.path} />
          ))}
          {folderNav.map((v) => (
            <FolderItem {...v} key={v.id} type="nav" />
          ))}
          {conversationFolder.length > 3 && <MoreFolder></MoreFolder>}

          <MoreAccount></MoreAccount>
        </div>
      </div>
      <PersonalSettings ref={personalSettingsRef} />
      <About ref={aboutRef} />
    </Sider>
  );
});

export default LeftNavBar;

const MoreFolder = memo(() => {
  const { conversationFolder, conversationList, currentConversationFolder } =
    useConversationStore();
  const [open, setShowOpen] = useState(false);

  const _conversationFolder = conversationFolder.slice(3);
  const hasActive = _conversationFolder.some(
    (v) => v.id === currentConversationFolder?.id,
  );

  const archiveList = useMemo(() => {
    const archiveIds = _conversationFolder.map((v) => v.id);
    return conversationList.filter(({ attachedInfo }) => {
      const tempAttachedInfo = JSON.parse(attachedInfo || "{}") as {
        archive_id: number;
      };
      return archiveIds.includes(tempAttachedInfo.archive_id);
    });
  }, [conversationList, _conversationFolder]);

  const unReadCount = useMemo(() => {
    return archiveList
      .filter((v) => v.recvMsgOpt === MessageReceiveOptType.Nomal)
      .reduce((count, item) => {
        return item.unreadCount + count;
      }, 0);
  }, [archiveList]);

  const Content = useMemo(() => {
    return (
      <div className="no-scrollbar flex max-h-[200px] max-w-[256px] flex-wrap justify-evenly overflow-auto pt-4">
        {_conversationFolder.map((v) => (
          <FolderItem {...v} key={v.id} parentSetOpen={setShowOpen}></FolderItem>
        ))}
        {_conversationFolder.length > 4 && (
          <>
            <div className="h-0 w-[64px]"></div>
            <div className="h-0 w-[64px]"></div>
            <div className="h-0 w-[64px]"></div>
          </>
        )}
      </div>
    );
  }, [_conversationFolder]);

  return (
    <MyPopover
      content={Content}
      placement="rightBottom"
      open={open}
      onOpenChange={(val) => setShowOpen(val)}
      destroyTooltipOnHide
    >
      <Badge
        count={unReadCount}
        className="group mb-5 flex w-12 cursor-pointer flex-col items-center justify-center"
        size="small"
        style={{ backgroundColor: "#52c41a" }}
        offset={[-5, 4]}
      >
        <img
          className="group-hover:hidden"
          width={24}
          src={hasActive ? archive_more_active : archive_more}
          alt=""
        />
        <img
          className="hidden group-hover:block"
          width={24}
          src={archive_more_active}
          alt=""
        />
      </Badge>
    </MyPopover>
  );
});

interface FolderItemProps extends ConversationFolderItem {
  type?: string;
  parentSetOpen?: (val: boolean) => void;
}
const FolderItem = (props: FolderItemProps) => {
  const { id, name, type, parentSetOpen } = props;
  const navigate = useNavigate();
  const {
    conversationList,
    currentConversationFolder,
    updateCurrentConversationFolder,
    updateConversationFolder,
  } = useConversationStore();
  const { selfInfo } = useUserStore();

  const [open, setOpen] = useState(false);

  const isNav = type === "nav";
  const isActive = currentConversationFolder?.id === id;
  const icon = isNav ? nav_archive_icon : archive_icon;
  const active_icon = isNav ? nav_archive_active : archive_active;

  const archiveList = useMemo(() => {
    return conversationList.filter(({ attachedInfo }) => {
      const tempAttachedInfo = JSON.parse(attachedInfo || "{}") as {
        archive_id: number;
      };
      return tempAttachedInfo.archive_id === id;
    });
  }, [conversationList]);

  const unReadCount = useMemo(() => {
    return archiveList
      .filter((v) => v.recvMsgOpt === MessageReceiveOptType.Nomal)
      .reduce((count, item) => {
        return item.unreadCount + count;
      }, 0);
  }, [archiveList]);

  const tryNavigate = () => {
    if (isActive) return;
    updateCurrentConversationFolder(props);
    !location.href.includes("/home/chat") && navigate("/home/chat");
  };

  const actionClick = (idx: menuItemType["idx"]) => {
    switch (idx) {
      case "01":
        emitter.emit("OPEN_CHOOSE_MODAL", {
          type: "UPDATE_ARCHIVE",
          extraData: {
            folderParams: props,
            archiveList,
          },
        });
        break;
      case "02":
        handleDelete();
        break;
    }
    parentSetOpen?.(false);
    setOpen(false);
  };

  const handleDelete = () => {
    modal.confirm({
      title: "删除分组",
      content: `确定删除分组 ${name} 吗？`,
      onOk: async () => {
        try {
          const params = {
            ...props,
            state: -1,
          } as ConversationFolderItem;
          await apiConversationFolderUpdate(params);
          updateConversationFolder(params);
          id === currentConversationFolder?.id &&
            updateCurrentConversationFolder(undefined);

          const conversations = conversationList.filter((v) => {
            const tempAttachedInfo = JSON.parse(v.attachedInfo || "{}");
            return tempAttachedInfo.archive_id === params.id;
          });
          const promiseArr = conversations.map((v) => {
            const tempAttachedInfo = JSON.parse(v.attachedInfo || "{}");
            return apiSetConversation({
              userIDs: [selfInfo.userID],
              conversation: {
                conversationID: v.conversationID,
                conversationType: v.conversationType,
                groupID: v.groupID,
                attachedInfo: JSON.stringify({
                  ...tempAttachedInfo,
                  archive_id: -1,
                }),
              },
            });
          });
          await Promise.all(promiseArr);
          feedbackToast({ msg: "删除分组成功" });
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  };

  return (
    <MyPopover
      placement="right"
      open={open}
      onOpenChange={(val) => setOpen(val)}
      trigger="contextMenu"
      menuList={[
        { idx: "01", title: "编辑分组", icon: edit_icon, active_icon: edit_active },
        { idx: "02", title: "删除分组", icon: delete_icon },
      ]}
      actionClick={actionClick}
    >
      <Badge
        count={unReadCount}
        size="small"
        style={{ backgroundColor: "#52c41a" }}
        offset={[-5, 0]}
        className={clsx(
          "cursor-pointer",
          isNav ? "mb-5 h-[52px] w-12" : "mx-1 mb-4 w-14",
        )}
      >
        <div
          onClick={tryNavigate}
          className="group flex flex-col items-center justify-center"
        >
          <img
            className="group-hover:hidden"
            src={isActive ? active_icon : icon}
            width={isNav ? 24 : 30}
          />
          <img
            className="hidden group-hover:block"
            width={isNav ? 24 : 30}
            src={active_icon}
          />
          <span
            className={clsx(
              "mt-1 w-full truncate text-center font-sMedium",
              "group-hover:text-[var(--primary)]",
              isNav && "text-gray-400",
              isActive && "!text-[var(--primary)]",
            )}
          >
            {name}
          </span>
        </div>
      </Badge>
    </MyPopover>
  );
};

const MoreAccount = memo(() => {
  const [showAccount, setShowAccount] = useState(false);
  const moreAccountData = useMoreAccount({
    isGetUnreadCount: true,
  });
  return (
    <MyPopover
      content={
        <AccountContent
          setShowAccount={setShowAccount}
          {...moreAccountData}
        ></AccountContent>
      }
      placement="topLeft"
      open={showAccount}
      onOpenChange={(val) => setShowAccount(val)}
    >
      <Badge
        count={moreAccountData.unreadCountTotal}
        className="group mb-5 mt-auto flex h-[52px] w-12 cursor-pointer flex-col items-center justify-center"
        size="small"
        style={{ backgroundColor: "#52c41a" }}
        offset={[-5, 4]}
      >
        <img className="group-hover:hidden" width={24} src={account_icon} alt="" />
        <img
          className="hidden group-hover:block"
          width={24}
          src={account_active}
          alt=""
        />
      </Badge>
    </MyPopover>
  );
});
interface AccountContentProps extends ReturnType<typeof useMoreAccount> {
  setShowAccount: (val: boolean) => void;
}
const AccountContent = (props: AccountContentProps) => {
  const {
    setShowAccount,
    showMoreAccount,
    checkLogin,
    updateAccount,
    removeAccount,
    unreadCountMap,
  } = props;
  const { connectState, selfInfo, userLogout } = useUserStore();
  const navigate = useNavigate();
  const [accountLoading, setAccountLoading] = useState(false);

  useEffect(() => {
    const { isLogining, isConnecting, isSyncing } = connectState;
    setAccountLoading(isLogining || isConnecting || isSyncing);
  }, [connectState]);

  const handleClick = async (item: MoreAccountItem) => {
    setShowAccount(false);
    setAccountLoading(true);
    try {
      await userLogout(false);
      if (!item) return;
      const data = await checkLogin(item);
      const { chatToken, imToken, userID } = data.data;
      setIMProfile({ chatToken, imToken, userID });
      emitter.emit("FORCE_UPDATE_IM", null);
      navigate("/home/chat", {
        replace: true,
      });
    } finally {
      setAccountLoading(false);
    }
  };
  const handleRemove = (item: MoreAccountItem) => {
    setShowAccount(false);
    modal.confirm({
      title: "移除账号",
      content: `确认移除账号${item.nickname}吗？`,
      onOk: () => {
        if (!item.userID) return;
        removeAccount(item.userID);
      },
    });
  };
  const handleAdd = () => {
    setShowAccount(false);
    emitter.emit("ADD_USER_ACCOUNT", null);
  };

  useEffect(() => {
    selfInfo.userID && updateAccount({ userID: selfInfo.userID, params: selfInfo });
  }, [selfInfo]);

  return (
    <div className={String(styles["account-content"])}>
      <Spin spinning={showMoreAccount.length > 0 && accountLoading}>
        {showMoreAccount.map((v) => {
          const unreadCount = unreadCountMap?.[v.userID];
          return (
            <div key={v.userID}>
              <div
                onClick={() => handleClick(v)}
                className={`${styles["account-item"]} h-14 px-2 `}
              >
                <Badge
                  count={unreadCount?.count || 0}
                  size="small"
                  style={{ backgroundColor: "#52c41a" }}
                >
                  <OIMAvatar size={36} src={v.faceURL} text={v.nickname} />
                </Badge>
                <div className="mx-2 truncate">{v.nickname}</div>
                <img
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(v);
                  }}
                  className="ml-auto"
                  src={remove_account_icon}
                  width="19"
                />
              </div>
              <Divider className="my-0" />
            </div>
          );
        })}
      </Spin>
      {showMoreAccount.length < 3 && (
        <div
          onClick={handleAdd}
          className={`${styles["account-item"]} h-12 justify-center  text-[var(--primary)] `}
        >
          <img src={add_account_icon} alt="" width="19" />
          <span className="ml-4">添加账号</span>
        </div>
      )}
    </div>
  );
};
