import { CloseOutlined, RightOutlined } from "@ant-design/icons";
import { Divider, Modal } from "antd";
import { forwardRef, ForwardRefRenderFunction, memo } from "react";

import logo from "@/assets/images/logo_name_blue.png";
import { useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";

import { OverlayVisibleHandle, useOverlayVisible } from "../../hooks/useOverlayVisible";

const About: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (_, ref) => {
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  return (
    <Modal
      title={null}
      footer={null}
      closable={false}
      open={isOverlayOpen}
      centered
      onCancel={closeOverlay}
      maskStyle={{
        opacity: 0,
        transition: "none",
      }}
      width={360}
      className="no-padding-modal"
      maskTransitionName=""
    >
      <AboutContent closeOverlay={closeOverlay} />
    </Modal>
  );
};

export default memo(forwardRef(About));

export const AboutContent = ({ closeOverlay }: { closeOverlay: () => void }) => {
  const { packVersion } = useUserStore();
  const handleCheckAppVersion = async () => {
    const res = await window.checkClientVersion();
    if (res) {
      closeOverlay();
    } else {
      feedbackToast({
        msg: "已经是最新版本",
      });
    }
  };

  return (
    <div className="bg-[var(--chat-bubble)]">
      <div className="app-drag flex items-center justify-between bg-[var(--gap-text)] p-5">
        <span className="text-base font-medium">关于我们</span>
        <CloseOutlined
          className="app-no-drag cursor-pointer text-[#8e9aaf]"
          rev={undefined}
          onClick={closeOverlay}
        />
      </div>
      <div className="flex flex-col items-center justify-center">
        <img className="mb-2 mt-7" width={140} src={logo} alt="" />
        <div className="mb-5 font-sBold text-[var(--primary)]">
          {window.electronAPI ? packVersion : import.meta.env.VITE_WEB_VERSION}
        </div>
      </div>

      <Divider className="border-1 m-0 border-[var(--gap-text)]" />

      {window.electronAPI && (
        <div
          className="flex cursor-pointer items-center justify-between px-6 py-4"
          onClick={handleCheckAppVersion}
        >
          <div className="text-base">检查新版本</div>
          <RightOutlined rev={undefined} />
        </div>
      )}
    </div>
  );
};
