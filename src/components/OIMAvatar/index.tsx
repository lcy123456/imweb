import { Avatar as AntdAvatar, AvatarProps } from "antd";
import clsx from "clsx";
import { CSSProperties, FC, ReactNode, useMemo } from "react";

import ic_avatar_01 from "@/assets/avatar/ic_avatar_01.png";
import ic_avatar_02 from "@/assets/avatar/ic_avatar_02.png";
import ic_avatar_03 from "@/assets/avatar/ic_avatar_03.png";
import ic_avatar_04 from "@/assets/avatar/ic_avatar_04.png";
import ic_avatar_05 from "@/assets/avatar/ic_avatar_05.png";
import ic_avatar_06 from "@/assets/avatar/ic_avatar_06.png";
import ic_avatar_07 from "@/assets/avatar/ic_avatar_07.png";
import ic_avatar_08 from "@/assets/avatar/ic_avatar_08.png";
import ic_avatar_09 from "@/assets/avatar/ic_avatar_09.png";
import ic_avatar_10 from "@/assets/avatar/ic_avatar_10.png";
import ic_avatar_11 from "@/assets/avatar/ic_avatar_11.png";
import ic_avatar_12 from "@/assets/avatar/ic_avatar_12.png";
import ic_avatar_13 from "@/assets/avatar/ic_avatar_13.png";
import ic_avatar_14 from "@/assets/avatar/ic_avatar_14.png";
import ic_avatar_15 from "@/assets/avatar/ic_avatar_15.png";
import ic_avatar_16 from "@/assets/avatar/ic_avatar_16.png";
import ic_avatar_17 from "@/assets/avatar/ic_avatar_17.png";
import ic_avatar_18 from "@/assets/avatar/ic_avatar_18.png";
import ic_avatar_19 from "@/assets/avatar/ic_avatar_19.png";
import ic_avatar_20 from "@/assets/avatar/ic_avatar_20.png";
import default_group from "@/assets/images/contact/my_groups.png";
import { colors } from "@/constants";
import { adjustColor, getFirstCharacter } from "@/utils/common";
import { formatMessageFileUrl } from "@/utils/imCommon";

const avatar: {
  [propsName: string]: string;
} = {
  ic_avatar_01,
  ic_avatar_02,
  ic_avatar_03,
  ic_avatar_04,
  ic_avatar_05,
  ic_avatar_06,
  ic_avatar_07,
  ic_avatar_08,
  ic_avatar_09,
  ic_avatar_10,
  ic_avatar_11,
  ic_avatar_12,
  ic_avatar_13,
  ic_avatar_14,
  ic_avatar_15,
  ic_avatar_16,
  ic_avatar_17,
  ic_avatar_18,
  ic_avatar_19,
  ic_avatar_20,
};

interface IOIMAvatarProps extends AvatarProps {
  src?: string;
  text?: string;
  color?: string;
  bgColor?: string;
  isgroup?: boolean;
  size?: number;
  br?: string;
  style?: CSSProperties;
}

const OIMAvatar: FC<IOIMAvatarProps> = (props) => {
  const {
    src,
    text,
    size = 48,
    color = "#fff",
    bgColor,
    isgroup = false,
    shape = "circle",
    style = {},
  } = props;

  const getAvatarUrl = useMemo((): ReactNode => {
    if (src) {
      return avatar[src] ? avatar[src] : formatMessageFileUrl(src);
    }
    return isgroup ? default_group : undefined;
  }, [src, isgroup]);

  const avatarProps = {
    draggable: false,
    ...props,
    isgroup: undefined,
  };

  const getBgColor = useMemo(() => {
    if (getAvatarUrl) return;
    if (bgColor) return bgColor;
    const hexColor = colors[getFirstCharacter(text || "")] || "#008DFF";
    const rgbaColor = adjustColor(hexColor, 30);
    return `radial-gradient(${hexColor}, ${rgbaColor})`;
  }, [text, getAvatarUrl, bgColor]);

  return (
    <AntdAvatar
      {...avatarProps}
      style={{
        background: getBgColor,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        lineHeight: `${size - 2}px`,
        color,
        borderRadius: shape === "square" ? "14px" : undefined,
        border: 0,
        ...style,
      }}
      className={clsx(
        "text-[22px]",
        {
          "cursor-pointer": Boolean(props.onClick),
        },
        props.className,
      )}
      src={getAvatarUrl}
    >
      {text?.slice(-2)}
    </AntdAvatar>
  );
};

export default OIMAvatar;
