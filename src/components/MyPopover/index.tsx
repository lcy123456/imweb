import { Popover, Spin, Upload, UploadProps } from "antd";
import { PopoverProps } from "antd/lib";
import clsx from "clsx";
import { UploadRequestOption } from "rc-upload/lib/interface";
import { FC, ReactNode } from "react";

import OIMAvatar from "@/components/OIMAvatar";

import styles from "./my_popover.module.scss";

export interface MyPopoverProps extends PopoverProps, PopoverContentProps {
  contentOptions?: {
    className: string;
  };
}

const MyPopover: FC<MyPopoverProps> = (props) => {
  const {
    arrow = false,
    content,
    menuList,
    loading = false,
    contentOptions,
    actionClick,
    fileHandle,
  } = props;

  const _content = content ? (
    content
  ) : (
    <PopoverContent
      {...contentOptions}
      menuList={menuList}
      loading={loading}
      actionClick={actionClick}
      fileHandle={fileHandle}
    />
  );

  return (
    <Popover arrow={arrow} {...props} content={_content}>
      {props.children}
    </Popover>
  );
};

export default MyPopover;

export interface menuItemType {
  idx: number | string;
  title: string;
  text?: string;
  right_title?: string;
  icon?: string;
  active_icon?: string;
  uploadOption?: UploadProps;
  className?: string;
  userID?: string;
  faceURL?: string;
  isAvatar?: boolean;
  right_icon?: ReactNode;
  disabled?: boolean;
  nodeKey?: string;
  children?: MyPopoverProps;
  fn?: () => void;
  [propName: string]: any;
}

interface PopoverContentProps {
  className?: string;
  menuList?: menuItemType[];
  loading?: boolean;
  actionClick?: (idx: menuItemType["idx"], menu: menuItemType) => void | Promise<void>;
  actionRightClick?: (
    idx: menuItemType["idx"],
    menu: menuItemType,
  ) => void | Promise<void>;
  fileHandle?: (options: UploadRequestOption) => void;
}
export const PopoverContent = ({
  className,
  menuList,
  actionClick,
  actionRightClick,
  fileHandle,
  loading = false,
}: PopoverContentProps) => {
  return (
    <div className={clsx(styles.popover_content, className)}>
      <Spin spinning={loading}>
        {menuList?.map((menu) => {
          if (menu.uploadOption) {
            return (
              <Upload
                key={menu.idx}
                className="block"
                showUploadList={false}
                {...menu.uploadOption}
                customRequest={(options: UploadRequestOption) =>
                  fileHandle && fileHandle(options)
                }
              >
                <ContentItem menu={menu} actionClick={actionClick} />
              </Upload>
            );
          } else if (menu.children) {
            return (
              <MyPopover {...menu.children} key={menu.idx}>
                <ContentItem
                  menu={menu}
                  actionClick={actionClick}
                  actionRightClick={actionRightClick}
                />
              </MyPopover>
            );
          }
          return (
            <ContentItem
              key={menu.idx}
              menu={menu}
              actionClick={actionClick}
              actionRightClick={actionRightClick}
            />
          );
        })}
      </Spin>
    </div>
  );
};

interface ContentItemProps {
  menu: menuItemType;
  actionClick?: (idx: menuItemType["idx"], menu: menuItemType) => void;
  actionRightClick?: (idx: menuItemType["idx"], menu: menuItemType) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}
export const ContentItem = (props: ContentItemProps) => {
  const {
    menu,
    actionClick,
    actionRightClick,
    onMouseEnter,
    onMouseLeave,
    onPointerEnter,
    onPointerLeave,
  } = props;
  return (
    <div
      className={clsx(
        `${styles.popover_content_ceil} group`,
        menu.className,
        menu.right_icon && "!pr-2",
        menu.right_title && "justify-between",
        menu.disabled && "!cursor-default text-gray-400",
      )}
      onClick={() => actionClick && !menu.disabled && actionClick(menu.idx, menu)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {menu.icon && (
        <img
          className={`${styles.icon} ${menu.active_icon && "group-hover:hidden"}`}
          src={menu.icon}
        />
      )}
      {menu.active_icon && (
        <img
          className={`${styles.icon} hidden group-hover:inline-block`}
          src={menu.active_icon}
        />
      )}
      {menu.isAvatar && (
        <OIMAvatar src={menu.faceURL} text={menu.title} shape="square" size={24} />
      )}
      <span className="truncate">{menu.title}</span>
      {menu.right_icon && (
        <div
          onClick={(e) => {
            if (actionRightClick) {
              e.stopPropagation();
              actionRightClick(menu.idx, menu);
            }
          }}
          className="ml-auto text-gray-400"
        >
          {typeof menu.right_icon === "string" ? (
            <img src={menu.right_icon} />
          ) : (
            menu.right_icon
          )}
        </div>
      )}
      {menu.right_title && <span>{menu.right_title}</span>}
    </div>
  );
};
