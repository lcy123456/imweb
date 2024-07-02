import "./conPage.scss";

import { SearchOutlined } from "@ant-design/icons";
import { useDebounceFn } from "ahooks";
import { Input, InputRef, Modal, Spin, Tabs } from "antd";
import { MessageType } from "open-im-sdk-wasm";
import {
  ConversationItem,
  FriendUserItem,
  GroupItem,
  SearchMessageResultItem,
} from "open-im-sdk-wasm/lib/types/entity";
import {
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { TextMessageTypes } from "@/constants";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { useContactStore } from "@/store/contact";

import Comprehensive from "./components/Comprehensive";

export interface RecordList {
  title: string;
  list: Partial<GroupItem & SearchMessageResultItem & FriendUserItem>[];
  type: string;
}

interface Props {
  archiveList?: ConversationItem[];
}
const QueryDialog: ForwardRefRenderFunction<OverlayVisibleHandle, Props> = (
  props,
  ref,
) => {
  const { archiveList } = props;
  const { friendList, groupList } = useContactStore();

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  const inputRef = useRef<InputRef>(null);
  const [keyword, setKeyword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [recordData, setRecordData] = useState<RecordList[]>([]);

  const afterOpenChange = (isOpen: boolean) => {
    isOpen &&
      inputRef.current!.focus({
        cursor: "end",
      });
  };

  // 筛选联系人
  const showFriendList = useMemo(() => {
    return friendList.filter((v) => {
      const archiveIds = archiveList?.map((v) => v.userID);
      return (
        (v.nickname.includes(keyword) || v.remark.includes(keyword)) &&
        (archiveIds ? archiveIds.includes(v.userID) : true)
      );
    });
  }, [keyword, friendList, archiveList]);

  // 筛选群组
  const showGroupList = useMemo(() => {
    return groupList.filter((v) => {
      const archiveIds = archiveList?.map((v) => v.groupID);
      return (
        v.groupName.includes(keyword) &&
        (archiveIds ? archiveIds.includes(v.groupID) : true)
      );
    });
  }, [groupList, keyword]);

  useEffect(() => {
    requeryData();
  }, [keyword]);

  const { run: requeryData } = useDebounceFn(
    async () => {
      if (keyword === "") {
        return setRecordData([]);
      }
      setLoading(true);
      try {
        // 获取聊天记录
        const params = {
          conversationID: "",
          keywordList: [keyword],
          messageTypeList: TextMessageTypes as MessageType[],
          searchTimePosition: 0,
          searchTimePeriod: 0,
          pageIndex: 1,
          count: 0,
        };
        const res = await IMSDK.searchLocalMessages(params);
        const _list = [];
        if (activeKey === "1" || activeKey === "2") {
          showFriendList.length > 0 &&
            _list.push({
              title: "联系人",
              list: showFriendList,
              type: "Contact",
            });
        }
        if (activeKey === "1" || activeKey === "3") {
          showGroupList.length > 0 &&
            _list.push({
              title: "群聊",
              list: showGroupList,
              type: "Group",
            });
        }
        const archiveIds = archiveList?.map((v) => v.conversationID);
        const searchList =
          res.data.searchResultItems?.filter((v) =>
            archiveIds ? archiveIds.includes(v.conversationID) : true,
          ) || [];
        if (searchList.length > 0) {
          _list.push({
            title: "聊天记录",
            list: searchList,
            type: "Record",
          });
        }

        setRecordData(_list);
      } finally {
        setLoading(false);
      }
    },
    { wait: 500 },
  );

  // tabs页
  const [activeKey, setActiveKey] = useState("1");

  const handleTabChange = (key: string) => {
    setActiveKey(key);
  };

  const handleCancel = () => {
    closeOverlay();
    setKeyword("");
    setActiveKey("1");
  };

  return (
    <>
      <Modal
        open={isOverlayOpen}
        onCancel={handleCancel}
        closeIcon={false}
        footer={null}
        wrapClassName={"z-dialog"}
        width={620}
        afterOpenChange={afterOpenChange}
      >
        <Input
          ref={inputRef}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索"
          prefix={<SearchOutlined />}
        />
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          items={tabItems}
          onChange={handleTabChange}
          indicatorSize={(origin) => origin - 16}
        />
        <Spin spinning={loading} wrapperClassName="flex-1 overflow-hidden">
          <Comprehensive
            recordData={recordData}
            activeKey={activeKey}
            setActiveKey={setActiveKey}
            closeModal={handleCancel}
          />
        </Spin>
      </Modal>
    </>
  );
};

export default forwardRef(QueryDialog);

const tabItems = [
  {
    key: "1",
    label: "综合",
    children: "",
  },
  {
    key: "2",
    label: "联系人",
    children: "",
  },
  {
    key: "3",
    label: "群组",
    children: "",
  },
  {
    key: "4",
    label: "聊天记录",
    children: "",
  },
];
