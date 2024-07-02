import { CloseOutlined, RightOutlined } from "@ant-design/icons";
import { Checkbox, Divider, Modal, Spin } from "antd";
import { MessageReceiveOptType } from "open-im-sdk-wasm";
import { forwardRef, ForwardRefRenderFunction, memo, useRef } from "react";
import { useMutation } from "react-query";

import { modal } from "@/AntdGlobalComp";
import { errorHandle } from "@/api/errorHandle";
import {
  BusinessAllowType,
  BusinessHiddenPhone,
  BusinessUserInfo,
  updateBusinessUserInfo,
} from "@/api/login";
import i18n from "@/i18n";
import { useMessageStore, useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";

import { OverlayVisibleHandle, useOverlayVisible } from "../../hooks/useOverlayVisible";
import { IMSDK } from "../MainContentWrap";
import BlackList from "./BlackList";
import ChangePassword from "./ChangePassword";
import MessageMusicSetting from "./MessageMusicSetting";

export type LocaleString = "zh-CN" | "en";

const PersonalSettings: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const backListRef = useRef<OverlayVisibleHandle>(null);
  const changePasswordRef = useRef<OverlayVisibleHandle>(null);
  const MessageMusicSettingRef = useRef<OverlayVisibleHandle>(null);

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  return (
    <Modal
      title={null}
      footer={null}
      closable={false}
      open={isOverlayOpen}
      onCancel={closeOverlay}
      centered
      destroyOnClose
      maskStyle={{
        opacity: 0,
        transition: "none",
      }}
      width={600}
      className="no-padding-modal max-w-[70vw]"
      maskTransitionName=""
    >
      <PersonalSettingsContent
        closeOverlay={closeOverlay}
        openBackListOverlay={() => backListRef.current?.openOverlay()}
        openChangePasswordOverlay={() => changePasswordRef.current?.openOverlay()}
        openMessageMusicSettingOverlay={() =>
          MessageMusicSettingRef.current?.openOverlay()
        }
      />
      <BlackList ref={backListRef} />
      <ChangePassword ref={changePasswordRef} />
      <MessageMusicSetting ref={MessageMusicSettingRef} />
    </Modal>
  );
};

export default memo(forwardRef(PersonalSettings));

export const PersonalSettingsContent = ({
  closeOverlay,
  openBackListOverlay,
  openChangePasswordOverlay,
  openMessageMusicSettingOverlay,
}: {
  closeOverlay?: () => void;
  openBackListOverlay?: () => void;
  openChangePasswordOverlay?: () => void;
  openMessageMusicSettingOverlay?: () => void;
}) => {
  const { selfInfo, appSettings, updateAppSettings, updateSelfInfo } = useUserStore();
  const { locale: localeStr, closeAction } = appSettings;
  const clearHistoryMessage = useMessageStore((state) => state.clearHistoryMessage);

  const { isLoading: businessSettingUpdating, mutate: updateBusinessSetting } =
    useMutation(updateBusinessUserInfo, {
      onError: errorHandle,
    });
  const { isLoading: recvMessageOptUpdating, mutate: updateRecvMessageOpt } =
    useMutation((opt: MessageReceiveOptType) => IMSDK.setGlobalRecvMessageOpt(opt), {
      onError: errorHandle,
    });

  const localeChange = (checked: boolean, locale: LocaleString) => {
    if (!checked) return;
    console.log(checked, locale);
    i18n.changeLanguage(locale);
    updateAppSettings({
      locale,
    });
  };

  const closeActionChange = (checked: boolean, action: "miniSize" | "quit") => {
    if (checked) {
      window.electronAPI?.ipcInvoke("setKeyStore", {
        key: "closeAction",
        data: action,
      });
      updateAppSettings({
        closeAction: action,
      });
    }
  };

  const tryClearChatLogs = () => {
    modal.confirm({
      title: "清空聊天记录",
      content: "确认清空所有聊天记录吗？",
      onOk: async () => {
        try {
          await IMSDK.deleteAllMsgFromLocalAndSvr();
          clearHistoryMessage();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  };

  const toMessageMusicSetting = () => {
    openMessageMusicSettingOverlay?.();
  };

  const toBlackList = () => {
    openBackListOverlay?.();
  };

  const toChangePassword = () => {
    openChangePasswordOverlay?.();
  };

  const businessSettingsUpdate = (vaule: boolean, key: keyof BusinessUserInfo) => {
    const updateInfo: Partial<BusinessUserInfo> = {};
    if (key === "globalRecvMsgOpt") {
      updateInfo[key] = vaule
        ? MessageReceiveOptType.NotNotify
        : MessageReceiveOptType.Nomal;
      updateRecvMessageOpt(updateInfo[key]!, {
        onSuccess: () => {
          updateSelfInfo(updateInfo);
        },
      });
      return;
    }
    switch (key) {
      case "allowAddFriend":
        updateInfo[key] = vaule ? BusinessAllowType.NotAllow : BusinessAllowType.Allow;
        break;
      case "isHiddenPhone":
        updateInfo[key] = vaule
          ? BusinessHiddenPhone.hidden
          : BusinessHiddenPhone.NotHidden;
        break;
    }

    updateBusinessSetting(
      {
        userID: selfInfo.userID,
        ...updateInfo,
      },
      {
        onSuccess: () => {
          updateSelfInfo(updateInfo);
        },
      },
    );
  };

  return (
    <div>
      <div className="flex h-12 items-center justify-between bg-[var(--gap-text)] px-7">
        <span className="text-base font-medium">账号设置</span>
        <CloseOutlined
          className="app-no-drag cursor-pointer text-[#8e9aaf]"
          rev={undefined}
          onClick={closeOverlay}
        />
      </div>
      <div className="max max-h-[500px] overflow-y-auto">
        <div className="px-4">
          <div>
            <div className="py-4 text-base font-medium">个人设置</div>
            <div className="mb-4 pl-1">
              <div className="mb-2 font-medium">选择语言</div>
              <div>
                <Checkbox
                  checked={localeStr === "zh-CN"}
                  className="w-36"
                  onChange={(e) => localeChange(e.target.checked, "zh-CN")}
                >
                  简体中文
                </Checkbox>
                {/* <Checkbox
                  checked={localeStr === "en"}
                  onChange={(e) => localeChange(e.target.checked, "en")}
                >
                  English
                </Checkbox> */}
              </div>
            </div>
            {Boolean(window.electronAPI) && (
              <div className="mb-4 pl-1">
                <div className="mb-2 font-medium">点击关闭按钮时的事件</div>
                <div>
                  <Checkbox
                    checked={closeAction === "quit"}
                    className="w-36"
                    onChange={(e) => closeActionChange(e.target.checked, "quit")}
                  >
                    退出应用
                  </Checkbox>
                  <Checkbox
                    checked={closeAction === "miniSize"}
                    onChange={(e) => closeActionChange(e.target.checked, "miniSize")}
                  >
                    最小化托盘
                  </Checkbox>
                </div>
              </div>
            )}
            <div className="mb-4 pl-1">
              <div className="mb-2 font-medium">消息提示</div>
              <Spin spinning={recvMessageOptUpdating}>
                <Checkbox
                  checked={
                    selfInfo.globalRecvMsgOpt === MessageReceiveOptType.NotNotify
                  }
                  onChange={(e) =>
                    businessSettingsUpdate(e.target.checked, "globalRecvMsgOpt")
                  }
                >
                  勿扰模式
                </Checkbox>
              </Spin>
            </div>
            <div className="mb-4 pl-1">
              <div className="mb-2 font-medium">添加好友设置</div>
              <Spin spinning={businessSettingUpdating}>
                <Checkbox
                  checked={selfInfo.allowAddFriend === BusinessAllowType.NotAllow}
                  onChange={(e) =>
                    businessSettingsUpdate(e.target.checked, "allowAddFriend")
                  }
                >
                  禁止添加我为好友
                </Checkbox>
                <Checkbox
                  checked={selfInfo.isHiddenPhone === BusinessHiddenPhone.hidden}
                  onChange={(e) =>
                    businessSettingsUpdate(e.target.checked, "isHiddenPhone")
                  }
                >
                  禁止通过手机号查询我
                </Checkbox>
              </Spin>
            </div>
          </div>
        </div>
        <Divider className="m-0 border-4 border-[var(--gap-text)]" />
        <div
          className="flex h-12 cursor-pointer items-center justify-between px-6"
          onClick={toMessageMusicSetting}
        >
          <div className="text-base font-medium">消息提示音</div>
          <RightOutlined rev={undefined} />
        </div>
        <Divider className="m-0 border-4 border-[var(--gap-text)]" />
        <div
          className="flex h-12 cursor-pointer items-center justify-between px-6"
          onClick={toBlackList}
        >
          <div className="text-base font-medium">通信录黑名单</div>
          <RightOutlined rev={undefined} />
        </div>
        <Divider className="m-0 border-4 border-[var(--gap-text)]" />
        <div
          className="flex h-12 cursor-pointer items-center justify-between px-6"
          onClick={toChangePassword}
        >
          <div className="text-base font-medium">修改密码</div>
          <RightOutlined rev={undefined} />
        </div>
        <Divider className="m-0 border-4 border-[var(--gap-text)]" />
        <div
          className="flex h-12 cursor-pointer items-center px-6"
          onClick={tryClearChatLogs}
        >
          <div className="text-base font-medium text-[var(--warn-text)]">
            清空聊天记录
          </div>
        </div>
        <Divider className="m-0 border-4 border-[var(--gap-text)]" />
      </div>
    </div>
  );
};
