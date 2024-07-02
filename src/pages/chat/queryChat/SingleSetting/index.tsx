import { RightOutlined } from "@ant-design/icons";
import { Button, Divider, Drawer } from "antd";
import { t } from "i18next";
import { MessageReceiveOptType } from "open-im-sdk-wasm";
import { forwardRef, ForwardRefRenderFunction, memo, useMemo } from "react";

import { modal } from "@/AntdGlobalComp";
import BurnPopover from "@/components/BurnPopover";
import OIMAvatar from "@/components/OIMAvatar";
import SettingRow from "@/components/SettingRow";
import { useConversationSettings } from "@/hooks/useConversationSettings";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { useContactStore } from "@/store/contact";
import { feedbackToast } from "@/utils/common";
import emitter from "@/utils/events";

// export interface SingleSettingProps {}

const SingleSetting: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const {
    currentConversation,
    updateConversationPin,
    updateConversationMessageRemind,
    clearConversationMessages,
  } = useConversationSettings();
  const { blackList, friendList } = useContactStore();

  const isBlack = useMemo(() => {
    return blackList.some((black) => currentConversation?.userID === black.userID);
  }, [blackList, currentConversation?.userID]);
  const isFriend = useMemo(() => {
    return friendList.some((v) => currentConversation?.userID === v.userID);
  }, [friendList, currentConversation?.userID]);

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  const updateBlack = async () => {
    if (!currentConversation) return;
    const execFunc = async () => {
      const funcName = isBlack ? "removeBlack" : "addBlack";
      try {
        await IMSDK[funcName](currentConversation?.userID);
      } catch (error) {
        feedbackToast({ error, msg: t("toast.updateBlackStateFailed") });
      }
    };
    if (!isBlack) {
      modal.confirm({
        title: "加入黑名单",
        content: (
          <div className="flex items-baseline">
            <div>确认将好友加入黑名单吗？</div>
            <span className="text-xs text-[var(--sub-text)]">
              将无法接收该好友消息。
            </span>
          </div>
        ),
        onOk: execFunc,
      });
    } else {
      await execFunc();
    }
  };

  const tryUnfriend = () => {
    if (!currentConversation) return;
    modal.confirm({
      title: "解除好友",
      content: "确认解除好友吗？",
      onOk: async () => {
        try {
          await IMSDK.deleteFriend(currentConversation.userID);
        } catch (error) {
          feedbackToast({ error, msg: t("toast.unfriendFailed") });
        }
      },
    });
  };

  const openUserCard = () => {
    emitter.emit("OPEN_USER_CARD", { userID: currentConversation?.userID });
  };

  return (
    <Drawer
      title={"设置"}
      placement="right"
      rootClassName="chat-drawer"
      destroyOnClose
      onClose={closeOverlay}
      open={isOverlayOpen}
      maskClassName="opacity-0"
      maskMotion={{
        visible: false,
      }}
      width={380}
      getContainer={"#chat-container"}
    >
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={openUserCard}
      >
        <div className="flex items-center">
          <OIMAvatar
            src={currentConversation?.faceURL}
            text={currentConversation?.showName}
          />
          <div className="ml-3">{currentConversation?.showName}</div>
        </div>
        <RightOutlined rev={undefined} />
      </div>
      <Divider className="m-0 border-4 border-[#F4F5F7]" />
      <SettingRow
        className="pb-2"
        title={"置顶会话"}
        value={currentConversation?.isPinned}
        tryChange={updateConversationPin}
      />
      <SettingRow
        className="pb-2"
        title={"消息免打扰"}
        value={currentConversation?.recvMsgOpt === MessageReceiveOptType.NotNotify}
        tryChange={(checked) =>
          updateConversationMessageRemind(checked, MessageReceiveOptType.NotNotify)
        }
      />
      {/* <SettingRow
        className="pb-2"
        title={"屏蔽该会话"}
        value={currentConversation?.recvMsgOpt === MessageReceiveOptType.NotReceive}
        tryChange={(checked) =>
          updateConversationMessageRemind(checked, MessageReceiveOptType.NotReceive)
        }
      /> */}
      <SettingRow title={"加入黑名单"} value={isBlack} tryChange={updateBlack} />
      <Divider className="m-0 border-4 border-[#F4F5F7]" />
      <BurnPopover>
        <div>
          <SettingRow className="cursor-pointer" title={"自动删除信息"}>
            <RightOutlined rev={undefined} />
          </SettingRow>
        </div>
      </BurnPopover>
      <SettingRow
        className="cursor-pointer"
        title={"清空聊天记录"}
        rowClick={clearConversationMessages}
      >
        <RightOutlined rev={undefined} />
      </SettingRow>

      <div className="flex-1" />
      {isFriend && (
        <div className="flex w-full justify-center pb-3 pt-24">
          <Button type="primary" danger onClick={tryUnfriend}>
            解除好友
          </Button>
        </div>
      )}
    </Drawer>
  );
};

export default memo(forwardRef(SingleSetting));
