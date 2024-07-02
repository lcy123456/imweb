import { CloseOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { FC, memo } from "react";

import MediaPreviewSwiper from "@/pages/mediaPreview/MediaPreviewSwiper";
import { ExMessageItem } from "@/store";

export interface MediaPreviewParams {
  messageList: ExMessageItem[];
  index: number;
}

interface Props extends MediaPreviewParams {
  closeOverlay: () => void;
}

const MediaPreviewModal: FC<Props> = (props) => {
  const { closeOverlay } = props;

  return (
    <Modal
      title={null}
      footer={null}
      closeIcon={<CloseOutlined className="text-lg font-medium text-gray-400" />}
      open
      centered
      onCancel={closeOverlay}
      width="100%"
      className="no-padding-modal"
    >
      <div className="flex h-[95vh] flex-col bg-black">
        <div className="h-12"></div>
        <MediaPreviewSwiper {...props}></MediaPreviewSwiper>
      </div>
    </Modal>
  );
};

export default memo(MediaPreviewModal);
