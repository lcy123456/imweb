import { Modal, QRCode } from "antd";
import { forwardRef, ForwardRefRenderFunction, memo } from "react";

import logo from "@/assets/images/logo.png";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { PackageData } from "@/pages/installPackage";

interface Props {
  packageData?: PackageData;
}
const PackageModal: ForwardRefRenderFunction<OverlayVisibleHandle, Props> = (
  props,
  ref,
) => {
  const { packageData } = props;
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  return (
    <Modal
      footer={null}
      title={packageData?.label}
      open={isOverlayOpen}
      onCancel={closeOverlay}
      destroyOnClose
      width={400}
      centered
    >
      <QRCode
        className="m-auto"
        value={packageData?.fileUrl || ""}
        icon={logo}
        size={200}
      ></QRCode>
      <div
        className="mt-2 text-center text-blue-500"
        onClick={() => window.openHttp(packageData?.fileUrl || "")}
      >
        手动跳转
      </div>
    </Modal>
  );
};

export default memo(forwardRef(PackageModal));
