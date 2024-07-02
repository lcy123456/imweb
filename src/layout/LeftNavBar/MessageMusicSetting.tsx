import { CloseOutlined } from "@ant-design/icons";
import { Modal, Radio } from "antd";
import { forwardRef, ForwardRefRenderFunction, memo, useRef } from "react";

import { receiveMessageMusicMap, ReceiveMessageMusicType } from "@/constants";
import { useUserStore } from "@/store";

import { OverlayVisibleHandle, useOverlayVisible } from "../../hooks/useOverlayVisible";

const MessageMusicSetting: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const { receiveMessageMusicKey, updateReceiveMessageMusicKey } = useUserStore();
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const audioEl = useRef<HTMLAudioElement>(new Audio());

  const onMusicChange = (key: ReceiveMessageMusicType) => {
    audioEl.current.src = receiveMessageMusicMap[key];
    audioEl.current.currentTime = 0;
    audioEl.current.play();
    updateReceiveMessageMusicKey(key);
  };

  return (
    <Modal
      title={null}
      footer={null}
      closable={false}
      open={isOverlayOpen}
      onCancel={closeOverlay}
      centered
      destroyOnClose
      mask={false}
      width={420}
      className="no-padding-modal"
    >
      <div className="flex h-[468px] flex-col bg-[var(--chat-bubble)]">
        <div className="app-drag flex items-center justify-between p-5">
          <span className="text-base font-medium">消息提示音</span>
          <CloseOutlined
            className="app-no-drag cursor-pointer text-[#8e9aaf]"
            rev={undefined}
            onClick={closeOverlay}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {Object.keys(receiveMessageMusicMap).map((key, index) => {
            const isChecked = key === receiveMessageMusicKey;
            return (
              <div
                onClick={() => onMusicChange(key as ReceiveMessageMusicType)}
                key={key}
                className={`flex cursor-pointer px-5 py-2.5 hover:bg-gray-100 ${
                  isChecked && "bg-gray-100"
                }`}
              >
                <div className="flex-1">提示音0{index + 1}</div>
                <Radio checked={isChecked}></Radio>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default memo(forwardRef(MessageMusicSetting));
