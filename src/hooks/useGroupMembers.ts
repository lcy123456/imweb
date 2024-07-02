// import { useLatest } from "ahooks";
import { CbEvents } from "open-im-sdk-wasm";
import { GroupMemberItem, WSEvent } from "open-im-sdk-wasm/lib/types/entity";
import { useCallback, useEffect, useRef, useState } from "react";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import { feedbackToast } from "@/utils/common";

export const REACH_SEARCH_FLAG = "LAST_FLAG";

export interface FetchStateType {
  offset: number;
  count: number;
  loading: boolean;
  hasMore: boolean;
  groupMemberList: GroupMemberItem[];
  searchMemberList: GroupMemberItem[];
}

interface UseGroupMembersProps {
  groupID?: string;
  notRefresh?: boolean;
}

export default function useGroupMembers(props?: UseGroupMembersProps) {
  const { groupID, notRefresh } = props ?? {};
  const [fetchState, setFetchState] = useState<FetchStateType>({
    offset: 0,
    count: 20,
    loading: false,
    hasMore: true,
    groupMemberList: [],
    searchMemberList: [],
  });
  // const latestFetchState = useLatest(fetchState);
  const lastKeyword = useRef("");

  const currentConversationGroupID = useConversationStore(
    (state) => state.currentConversation?.groupID,
  );
  const myGroupID = groupID || currentConversationGroupID || "";

  useEffect(() => {
    if (!myGroupID) return;
    const groupMemberInfoChangedHandler = ({ data }: WSEvent<GroupMemberItem>) => {
      // console.log("handleGroupMember", "Changed", data);
      if (data.groupID !== myGroupID) return;
      setFetchState((state) => {
        const idx = state.groupMemberList.findIndex(
          (item) => item.userID === data.userID,
        );
        const newMembers = [...state.groupMemberList];
        newMembers[idx] = data;

        const searchIdx = state.searchMemberList.findIndex(
          (item) => item.userID === data.userID,
        );
        const newSearchMembers = [...state.searchMemberList];
        newSearchMembers[searchIdx] = data;

        return {
          ...state,
          groupMemberList: newMembers,
          searchMemberList: newSearchMembers,
        };
      });
    };

    const handleGroupMemberAdded = ({ data }: WSEvent<GroupMemberItem>) => {
      // console.log("handleGroupMember", "Added", data);
      if (notRefresh || data.groupID !== myGroupID) return;
      setFetchState((state) => ({
        ...state,
        groupMemberList: [...state.groupMemberList, data],
        searchMemberList: [...state.searchMemberList, data],
      }));
    };
    const handleGroupMemberDeleted = ({ data }: WSEvent<GroupMemberItem>) => {
      // console.log("handleGroupMember", "Deleted", data);
      if (notRefresh || data.groupID !== myGroupID) return;
      setFetchState((state) => {
        const list = state.groupMemberList.filter((v) => v.userID !== data.userID);
        const searchList = state.searchMemberList.filter(
          (v) => v.userID !== data.userID,
        );
        return {
          ...state,
          groupMemberList: [...list],
          searchMemberList: [...searchList],
        };
      });
    };

    const setIMListener = () => {
      IMSDK.on(CbEvents.OnGroupMemberInfoChanged, groupMemberInfoChangedHandler);
      IMSDK.on(CbEvents.OnGroupMemberAdded, handleGroupMemberAdded);
      IMSDK.on(CbEvents.OnGroupMemberDeleted, handleGroupMemberDeleted);
      // IMSDK.on(CbEvents.OnJoinedGroupAdded, handleGroupMemberAdded);
    };

    const disposeIMListener = () => {
      IMSDK.off(CbEvents.OnGroupMemberInfoChanged, groupMemberInfoChangedHandler);
      IMSDK.off(CbEvents.OnGroupMemberAdded, handleGroupMemberAdded);
      IMSDK.off(CbEvents.OnGroupMemberDeleted, handleGroupMemberDeleted);
      // IMSDK.off(CbEvents.OnJoinedGroupAdded, handleGroupMemberAdded);
    };
    getMemberData(true);
    setIMListener();
    return () => {
      resetState();
      disposeIMListener();
    };
  }, [myGroupID]);

  const searchMember = useCallback(
    async (keyword: string) => {
      if (fetchState.loading || !myGroupID) return;
      setFetchState((state) => ({
        ...state,
        loading: true,
      }));
      try {
        const { data } = await IMSDK.searchGroupMembers({
          groupID: myGroupID,
          offset: 0,
          count: 99,
          keywordList: [keyword],
          isSearchMemberNickname: true,
          isSearchUserID: false,
        });
        // console.log("search", data);
        setFetchState((state) => ({
          ...state,
          searchMemberList: [...data],
        }));
      } catch (error) {
        feedbackToast({
          msg: "getMemberFailed",
          error,
        });
      }

      setFetchState((state) => ({
        ...state,
        loading: false,
      }));
    },
    [myGroupID, fetchState],
  );

  const getMemberData = useCallback(
    async (refresh = false) => {
      if (!myGroupID) return;

      if ((fetchState.loading || !fetchState.hasMore) && !refresh) return;

      setFetchState((state) => ({
        ...state,
        loading: true,
      }));
      try {
        const { data } = await IMSDK.getGroupMemberList({
          groupID: myGroupID,
          offset: refresh ? 0 : fetchState.offset,
          count: 20,
          filter: 0,
        });
        setFetchState((state) => ({
          ...state,
          groupMemberList: refresh ? data : [...state.groupMemberList, ...data],
          hasMore: data.length === state.count,
          offset: state.count + (refresh ? 0 : state.offset),
        }));
      } catch (error) {
        feedbackToast({
          msg: "getMemberFailed",
          error,
        });
      }
      setFetchState((state) => ({
        ...state,
        loading: false,
      }));
    },
    [myGroupID, fetchState],
  );

  const resetState = () => {
    setFetchState({
      offset: 0,
      count: 20,
      loading: false,
      hasMore: true,
      groupMemberList: [],
      searchMemberList: [],
    });
  };

  return {
    fetchState,
    getMemberData,
    searchMember,
    resetState,
  };
}
