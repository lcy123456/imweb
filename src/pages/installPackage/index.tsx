import clsx from "clsx";
import { Platform } from "open-im-sdk-wasm";
import { useEffect, useRef, useState } from "react";

import { getPackageApi } from "@/api/packageApi";
import android_icon from "@/assets/images/installPackage/android.png";
import android_active from "@/assets/images/installPackage/android_active.png";
import mac_icon from "@/assets/images/installPackage/mac.png";
import mac_active from "@/assets/images/installPackage/mac_active.png";
import web_icon from "@/assets/images/installPackage/web.png";
import web_active from "@/assets/images/installPackage/web_active.png";
import windows_icon from "@/assets/images/installPackage/windows.png";
import windows_active from "@/assets/images/installPackage/windows_active.png";
import logo from "@/assets/images/logo.png";
import logo_name from "@/assets/images/logo_name_blue.png";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import PackageModal from "@/pages/common/PackageModal";
import { AppVersionConfig } from "@/store/type";

import styles from "./index.module.scss";

const menu = [
  {
    platform: Platform.Windows,
    label: "Windows",
    active_lable: "点击下载",
    icon: windows_icon,
    active_icon: windows_active,
  },
  {
    platform: Platform.MacOSX,
    label: "Mac",
    active_lable: "点击下载",
    icon: mac_icon,
    active_icon: mac_active,
  },
  {
    platform: Platform.Web,
    label: "PC Web",
    active_lable: "点击访问",
    icon: web_icon,
    active_icon: web_active,
  },
  {
    platform: Platform.iOS,
    label: "IOS",
    active_lable: "扫码安装",
    icon: mac_icon,
    active_icon: mac_active,
  },
  {
    platform: Platform.AndroidPad,
    label: "Android",
    active_lable: "扫码安装",
    icon: android_icon,
    active_icon: android_active,
  },
  {
    platform: Platform.Android,
    label: "Google",
    active_lable: "扫码安装",
    icon: android_icon,
    active_icon: android_active,
  },
];
type MenuItem = (typeof menu)[0];
export type PackageData = AppVersionConfig & MenuItem;

export const InstallPackage = () => {
  const [packageData, setPackageData] = useState<AppVersionConfig[]>([]);
  const [currentPackage, setCurrentPackage] = useState<PackageData>();
  const packageModalRef = useRef<OverlayVisibleHandle>(null);

  useEffect(() => {
    getPackageData();
  }, []);

  const getPackageData = async () => {
    const res = await getPackageApi();
    setPackageData(res.data.list);
  };
  const handleClick = (v: MenuItem) => {
    const current = packageData.find((j) => j.platform === v.platform);
    if (!current) return;
    setCurrentPackage({ ...current, ...v });
    switch (current?.platform) {
      case Platform.Web:
      case Platform.Windows:
      case Platform.MacOSX:
        window.open(current.fileUrl, "_blank");
        break;
      default:
        packageModalRef.current?.openOverlay();
    }
  };
  return (
    <div className={styles.installPackage}>
      <img src={logo} alt="" width={118} />
      <img src={logo_name} alt="" width={200} />
      <span className="mb-20 mt-8 text-center text-3xl">
        Online office·Multi-person collaboration·Create an efficient office method
      </span>
      <div className={styles.menuWrap}>
        {menu.map((v, i) => {
          const current = packageData.find((j) => j.platform === v.platform);
          return (
            <div
              key={i}
              className={clsx(styles.menuItem, "group")}
              onClick={() => handleClick(v)}
            >
              <div className="mb-2">
                <img className="group-hover:hidden" src={v.icon} alt="" width={28} />
                <img
                  className="hidden group-hover:block"
                  src={v.active_icon}
                  alt=""
                  width={28}
                />
              </div>
              <div className="group-hover:hidden">{v.label}</div>
              <div className="hidden group-hover:block">{v.active_lable}</div>
              <div className="text-xs">{current?.version}</div>
            </div>
          );
        })}
      </div>
      <PackageModal ref={packageModalRef} packageData={currentPackage}></PackageModal>
    </div>
  );
};
