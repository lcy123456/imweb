import { SearchOutlined } from "@ant-design/icons";
import { useLatest } from "ahooks";
import { Breadcrumb, Input } from "antd";
import { BreadcrumbItemType } from "antd/es/breadcrumb/Breadcrumb";
import clsx from "clsx";
import { GroupMemberItem } from "open-im-sdk-wasm/lib/types/entity";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Virtuoso } from "react-virtuoso";

import { searchBusinessUserInfo } from "@/api/login";
import friend from "@/assets/images/chooseModal/friend.png";
import group from "@/assets/images/chooseModal/group.png";
import recently from "@/assets/images/chooseModal/recently.png";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import useGroupMembers, { REACH_SEARCH_FLAG } from "@/hooks/useGroupMembers";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import { useContactStore } from "@/store/contact";

import CheckItem, { CheckListItem } from "./CheckItem";
import MenuItem from "./MenuItem";

const menuList = [
  {
    idx: 0,
    title: "最近聊天",
    icon: recently,
  },
  {
    idx: 1,
    title: "我的好友",
    icon: friend,
  },
  {
    idx: 2,
    title: "我的群组",
    icon: group,
  },
];

export type ChooseMenuItem = (typeof menuList)[0];

interface IChooseBoxProps {
  className?: string;
  isCheckInGroup?: boolean;
  notConversation?: boolean;
  showGroupMember?: boolean;
  checkMemberRole?: boolean;
  InviteCallData?: string;
}

export interface ChooseBoxHandle {
  getCheckedList: () => CheckListItem[];
  updatePrevCheckList: (data: CheckListItem[]) => void;
  resetState: () => void;
}

const ChooseBox: ForwardRefRenderFunction<ChooseBoxHandle, IChooseBoxProps> = (
  props,
  ref,
) => {
  const {
    className,
    isCheckInGroup,
    notConversation,
    showGroupMember,
    checkMemberRole,
    InviteCallData,
  } = props;

  const [checkedList, setCheckedList] = useState<CheckListItem[]>([]);
  const latestCheckedList = useLatest(checkedList);

  const [searchState, setSearchState] = useState({
    keywords: "",
    searching: false,
  });

  const memberListRef = useRef<MemberListHandle>(null);
  const commonLeftRef = useRef<MemberListHandle>(null);

  const checkClick = useCallback((data: CheckListItem) => {
    const idx = latestCheckedList.current.findIndex(
      (item) =>
        (item.userID && item.userID === data.userID) ||
        (item.groupID && item.groupID === data.groupID && !showGroupMember),
    );
    if (idx > -1) {
      setCheckedList((state) => {
        const newState = [...state];
        newState.splice(idx, 1);
        return newState;
      });
    } else {
      setCheckedList((state) => [...state, data]);
    }
  }, []);

  const isChecked = useCallback(
    (data: CheckListItem) =>
      checkedList.some(
        (item) =>
          (item.userID && item.userID === data.userID) ||
          (item.groupID && item.groupID === data.groupID && !showGroupMember),
      ),
    [checkedList.length, showGroupMember],
  );

  const resetState = () => {
    setCheckedList([]);
  };

  const updatePrevCheckList = (data: CheckListItem[]) => {
    setCheckedList([...data]);
  };

  const onEnterSearch = () => {
    if (!searchState.keywords) return;
    setSearchState((state) => ({ ...state, searching: true }));
    if (showGroupMember) {
      memberListRef.current?.searchMember(searchState.keywords);
    } else {
      commonLeftRef.current?.searchMember(searchState.keywords);
    }
  };

  useImperativeHandle(ref, () => ({
    getCheckedList: () => checkedList,
    resetState,
    updatePrevCheckList,
  }));

  return (
    <div
      className={clsx(
        "m-4 mb-0 flex h-[480px] rounded-md border border-[var(--gap-text)]",
        className,
      )}
    >
      <div className="flex flex-1 flex-col border-r border-[var(--gap-text)]">
        <div className="px-4 py-2">
          <Input
            value={searchState.keywords}
            allowClear
            onChange={(e) =>
              setSearchState((state) => ({
                searching: e.target.value ? state.searching : false,
                keywords: e.target.value,
              }))
            }
            onPressEnter={onEnterSearch}
            prefix={<SearchOutlined rev={undefined} className="text-[#8e9ab0]" />}
          />
        </div>
        {showGroupMember ? (
          <ForwardMemberList
            ref={memberListRef}
            isChecked={isChecked}
            checkClick={checkClick}
            checkMemberRole={checkMemberRole}
            isSearching={searchState.searching}
            InviteCallData={InviteCallData}
          />
        ) : (
          <ForwardCommonLeft
            ref={commonLeftRef}
            notConversation={notConversation!}
            isCheckInGroup={isCheckInGroup!}
            isChecked={isChecked}
            checkClick={checkClick}
            isSearching={searchState.searching}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="px-4 py-2 font-sMedium">
          已选择
          <span className="text-[var(--primary)]">{` ${checkedList.length} `}</span>项
        </div>
        <div className="mb-3 flex-1 overflow-y-auto">
          {checkedList.map((item) => (
            <CheckItem
              data={item}
              key={item.userID || item.groupID}
              cancelClick={checkClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(forwardRef(ChooseBox));

interface CommonLeftHandle {
  searchMember: (keywords: string) => void;
}
interface CommonLeftProps {
  notConversation: boolean;
  isCheckInGroup: boolean;
  checkClick: (data: CheckListItem) => void;
  isChecked: (data: CheckListItem) => boolean;
  isSearching?: boolean;
}
const CommonLeft: ForwardRefRenderFunction<CommonLeftHandle, CommonLeftProps> = (
  props,
  ref,
) => {
  const { notConversation, isCheckInGroup, checkClick, isChecked, isSearching } = props;
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItemType[]>([]);
  const [checkList, setCheckList] = useState<CheckListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const conversationList = useConversationStore((state) => state.conversationList);
  const currentGroupID = useConversationStore(
    (state) => state.currentConversation?.groupID,
  );
  const friendList = useContactStore((state) => state.friendList);
  const groupList = useContactStore((state) => state.groupList);

  const breadcrumbClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    setBreadcrumb([]);
  };

  const checkInGroup = async (list: CheckListItem[]) => {
    if (!isCheckInGroup || !currentGroupID) {
      return list;
    }
    const tmpList = JSON.parse(JSON.stringify(list)) as CheckListItem[];
    const userIDList = tmpList
      .filter((item) => Boolean(item.userID))
      .map((item) => item.userID!);
    try {
      const { data } = await IMSDK.getSpecifiedGroupMembersInfo({
        groupID: currentGroupID,
        userIDList,
      });
      const inGroupUserIDList = data.map((item) => item.userID);
      tmpList.map((item) => {
        item.disabled = inGroupUserIDList.includes(item.userID!);
      });
    } catch (error) {
      console.log(error);
    }
    return tmpList;
  };

  const menuClick = useCallback(async (idx: number) => {
    const pushItem = {
      title: "",
      className: "text-xs text-[var(--primary)]",
    };
    switch (idx) {
      case 0:
        setCheckList(await checkInGroup(conversationList));
        pushItem.title = "最近聊天";
        break;
      case 1:
        setCheckList(await checkInGroup(friendList));
        pushItem.title = "我的好友";
        break;
      case 2:
        setCheckList(await checkInGroup(groupList));
        pushItem.title = "我的群组";
        break;
      default:
        break;
    }
    setBreadcrumb((state) => [...state, pushItem]);
  }, []);

  const searchMember = async (keyword: string) => {
    setLoading(true);
    setBreadcrumb([]);
    setCheckList([]);
    try {
      const { data: userInfoRes } = await searchBusinessUserInfo(keyword);
      const { total, users } = userInfoRes;
      if (!total) return;
      const { data } = await IMSDK.getUsersInfo(users.map((v) => v.userID));
      setCheckList(
        data.map((v, i) => {
          return {
            ...users[i],
            ...(v.publicInfo || {}),
          };
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => {
    return {
      searchMember,
    };
  });

  if (breadcrumb.length < 1 && !isSearching) {
    return (
      <div className="flex-1 overflow-auto">
        {menuList.map((menu) => {
          if (notConversation && menu.idx !== 1) {
            return null;
          }
          return <MenuItem menu={menu} key={menu.idx} menuClick={menuClick} />;
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {!isSearching && (
        <Breadcrumb
          className="px-4"
          separator=">"
          items={[
            {
              title: "联系人",
              href: "",
              className: "text-xs text-[var(--sub-text)]",
              onClick: breadcrumbClick,
            },
            ...breadcrumb,
          ]}
        />
      )}
      <Virtuoso
        className="h-full flex-1 pb-3"
        data={checkList}
        components={{
          Header: () => {
            if (loading) {
              return <div className="text-center">loading...</div>;
            } else if (checkList.length === 0) {
              return <div className="text-center">搜索结果为空</div>;
            }
            return null;
          },
        }}
        itemContent={(_, item) => (
          <CheckItem
            showCheck
            isChecked={isChecked(item)}
            data={item}
            key={item.userID || item.groupID}
            itemClick={checkClick}
          />
        )}
      />
    </div>
  );
};
const ForwardCommonLeft = memo(forwardRef(CommonLeft));

interface MemberListHandle {
  searchMember: (keywords: string) => void;
}
interface IGroupMemberListProps {
  isSearching?: boolean;
  checkMemberRole?: boolean;
  InviteCallData?: string;
  checkClick: (data: CheckListItem) => void;
  isChecked: (data: CheckListItem) => boolean;
}
const GroupMemberList: ForwardRefRenderFunction<
  MemberListHandle,
  IGroupMemberListProps
> = (props, ref) => {
  const { friendList } = useContactStore();
  const { isSearching, checkMemberRole, InviteCallData, checkClick, isChecked } = props;
  const { currentRolevel } = useCurrentMemberRole();
  const { fetchState, searchMember, getMemberData } = useGroupMembers({
    notRefresh: true,
  });

  const endReached = () => {
    if (fetchState.loading || !fetchState.hasMore) {
      return;
    }
    if (!isSearching) {
      getMemberData();
    } else {
      searchMember(REACH_SEARCH_FLAG);
    }
  };

  const isDisabled = (member: GroupMemberItem) => {
    if (checkMemberRole) {
      return member.roleLevel >= currentRolevel;
    } else if (InviteCallData) {
      const { disabledUserID = [] } = JSON.parse(InviteCallData) as {
        disabledUserID: string[];
      };
      return disabledUserID.includes(member.userID);
    }
    return false;
  };

  useImperativeHandle(ref, () => ({
    searchMember,
  }));

  const dataSource = useMemo(() => {
    const arr = isSearching ? fetchState.searchMemberList : fetchState.groupMemberList;
    return arr.map((v) => {
      const friend = friendList.find((j) => j.userID === v.userID);
      return {
        ...friend,
        ...v,
        groupID: "",
      };
    });
  }, [
    isSearching,
    fetchState.searchMemberList,
    fetchState.groupMemberList,
    friendList,
  ]);

  return (
    <Virtuoso
      className="h-full overflow-x-hidden"
      data={dataSource}
      endReached={endReached}
      components={{
        Header: () =>
          fetchState.loading ? <div className="text-center">loading...</div> : null,
      }}
      itemContent={(_, member) => (
        <CheckItem
          showCheck
          isChecked={isChecked(member)}
          disabled={isDisabled(member)}
          data={member}
          key={member.userID}
          itemClick={checkClick}
        />
      )}
    />
  );
};

const ForwardMemberList = memo(forwardRef(GroupMemberList));
