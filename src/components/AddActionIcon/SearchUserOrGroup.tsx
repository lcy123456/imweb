import { CloseOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import { GroupItem, WSEvent } from "open-im-sdk-wasm/lib/types/entity";
import { forwardRef, ForwardRefRenderFunction, memo, useState } from "react";

import { message } from "@/AntdGlobalComp";
import { searchBusinessUserInfo } from "@/api/login";
import DraggableModalWrap from "@/components/DraggableModalWrap";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { CardInfo } from "@/pages/common/UserCardModal";
import { feedbackToast } from "@/utils/common";

interface ISearchUserOrGroupProps {
  isSearchGroup: boolean;
  openUserCardWithData: (data: CardInfo) => void;
  openGroupCardWithData: (data: GroupItem) => void;
}

const SearchUserOrGroup: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  ISearchUserOrGroupProps
> = ({ isSearchGroup, openUserCardWithData, openGroupCardWithData }, ref) => {
  const [keyword, setKeyword] = useState("");
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  const searchData = async () => {
    try {
      if (isSearchGroup) {
        const { data } = await IMSDK.getSpecifiedGroupsInfo([keyword]);
        const groupInfo = data[0];
        if (!groupInfo) {
          message.warning("搜索结果为空！");
          return;
        }
        openGroupCardWithData(groupInfo);
      } else {
        const {
          data: { total, users },
        } = await searchBusinessUserInfo(keyword);
        if (!total) {
          message.warning("搜索结果为空！");
          return;
        }
        const { data } = await IMSDK.getUsersInfo([users[0].userID]);
        const friendInfo = data[0].friendInfo;

        openUserCardWithData({
          ...friendInfo,
          ...users[0],
        });
      }
    } catch (error) {
      if ((error as WSEvent).errCode === 1004) {
        message.warning("搜索结果为空！");
        return;
      }
      feedbackToast({ error });
    }
  };

  return (
    <DraggableModalWrap
      title={null}
      footer={null}
      open={isOverlayOpen}
      closable={false}
      width={332}
      onCancel={closeOverlay}
      maskStyle={{
        opacity: 0,
        transition: "none",
      }}
      afterClose={() => {
        setKeyword("");
      }}
      ignoreClasses=".ignore-drag, .cursor-pointer"
      className="no-padding-modal"
      maskTransitionName=""
    >
      <div className="flex h-12 items-center justify-between bg-[var(--gap-text)] px-5.5">
        <div>{isSearchGroup ? "添加群组" : "添加好友"}</div>
        <CloseOutlined
          className="cursor-pointer text-[#8e9ab0]"
          rev={undefined}
          onClick={closeOverlay}
        />
      </div>
      <div className="ignore-drag">
        <div className="border-b border-[var(--gap-text)] px-5.5 py-6">
          <Input.Search
            className="no-addon-search"
            placeholder="请输入"
            value={keyword}
            addonAfter={null}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={searchData}
          />
        </div>
        <div className="flex justify-end px-5.5 py-2.5">
          <Button className="mr-3 bg-[var(--chat-bubble)] px-6" onClick={closeOverlay}>
            取消
          </Button>
          <Button className="px-6" type="primary" onClick={searchData}>
            确定
          </Button>
        </div>
      </div>
    </DraggableModalWrap>
  );
};

export default memo(forwardRef(SearchUserOrGroup));
