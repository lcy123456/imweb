import { PopoverProps } from "antd";
import { TooltipPlacement } from "antd/es/tooltip";
import clsx from "clsx";
import { UploadRequestOption } from "rc-upload/lib/interface";
import {
  cloneElement,
  memo,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuidV4 } from "uuid";

import { GifOriginal, readerFileApi } from "@/api";
import emoji from "@/assets/images/chatFooter/emoji.png";
import file from "@/assets/images/chatFooter/file.png";
import image from "@/assets/images/chatFooter/image.png";
import more from "@/assets/images/chatFooter/more.png";
import special from "@/assets/images/chatFooter/special.png";
import video from "@/assets/images/chatFooter/video.png";
import MyPopover, { menuItemType } from "@/components/MyPopover";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import { ExMessageItem, useConversationStore, useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";

import { SendMessageParams } from "../useSendMessage";
import EmojiPopContent from "./EmojiPopContent";
import SpecialModal from "./SpecialModal";

const ActionState = {
  emoji: false,
  recorder: false,
  more: false,
};
interface Props {
  sendMessage: (params: SendMessageParams) => Promise<void>;
  createFileMessage: (file: File, duration?: number) => Promise<ExMessageItem>;
}
const SendActionBar = ({ sendMessage, createFileMessage }: Props) => {
  const { selfInfo } = useUserStore();
  const [visibleState, setVisibleState] = useState(ActionState);
  const [sendLoading, setSendLoading] = useState(false);

  const specialModalRef = useRef<OverlayVisibleHandle>(null);

  const menuList: menuItemType[] = useMemo(() => {
    const arr = [
      {
        idx: 1,
        title: "图片",
        icon: image,
        uploadOption: {
          accept: "image/*",
          multiple: true,
        },
      },
      {
        idx: 2,
        title: "视频",
        icon: video,
        uploadOption: {
          accept: !window.electronAPI ? ".mp4" : "video/*",
          multiple: true,
        },
      },
      {
        idx: 3,
        title: "文件",
        icon: file,
        uploadOption: {
          accept: "*",
          multiple: true,
        },
      },
      {
        idx: 4,
        title: "特殊消息",
        icon: special,
      },
    ].filter((v) => {
      if (v.idx === 4 && selfInfo.managerLevel !== 8) {
        return false;
      }
      return true;
    });
    return arr;
  }, [selfInfo.managerLevel]);

  const actionClick = useCallback((idx: menuItemType["idx"]) => {
    switch (idx) {
      case 4:
        specialModalRef.current?.openOverlay();
        break;
    }
    setVisibleState(ActionState);
  }, []);

  const fileHandle = async (options: UploadRequestOption) => {
    const fileEl = options.file as File;

    const message = await createFileMessage(fileEl);
    sendMessage({
      message,
    });
  };
  const handleSendGif = async (original: GifOriginal) => {
    try {
      const { currentConversation } = useConversationStore.getState();
      setSendLoading(true);
      const { data: blob } = await readerFileApi<Blob>(original.url, {
        responseType: "blob",
      });
      const type = original.url.split(".").at(-1);
      const file = new File([blob], `${uuidV4()}.${type}`, {
        type: `image/${type}`,
      });
      // console.log("xxx file", blob, type, file);
      const message = await createFileMessage(file);
      setVisibleState(ActionState);

      sendMessage({
        recvID: currentConversation?.userID,
        groupID: currentConversation?.groupID,
        message,
      });
    } catch {
      feedbackToast({
        error: "表情包发送失败",
        msg: "表情包发送失败",
      });
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="flex h-[46px] items-center">
      {sendActionList.map((action) => {
        const popProps: PopoverProps = {
          placement: action.placement,
          content:
            action.comp &&
            cloneElement(action.comp, {
              handleSendGif: handleSendGif,
              sendLoading: sendLoading,
            }),
          trigger: "click",
          open: visibleState[action.key] && action.showPopover,
          onOpenChange: (val) => {
            setVisibleState((state) => {
              return {
                ...state,
                [action.key]: val,
              };
            });
          },
        };

        return (
          <MyPopover
            {...popProps}
            key={action.key}
            menuList={menuList}
            actionClick={actionClick}
            fileHandle={fileHandle}
          >
            <div className={clsx("mr-4 flex cursor-pointer items-center last:mr-0")}>
              <img src={action.icon} width={20} alt={action.title} />
            </div>
          </MyPopover>
        );
      })}
      <SpecialModal ref={specialModalRef} />
    </div>
  );
};

export default memo(SendActionBar);

interface SendActionItem {
  title: string;
  icon: string;
  key: keyof typeof ActionState;
  comp?: ReactElement;
  placement: TooltipPlacement;
  showPopover: boolean;
}
const sendActionList: SendActionItem[] = [
  //   {
  //     title: "表情",
  //     icon: emoji,
  //     key: "emoji",
  //     comp: <EmojiPopContent />,
  //     placement: "topLeft",
  //     showPopover: true,
  //   },
  {
    title: "更多",
    icon: more,
    key: "more",
    comp: undefined,
    placement: "topLeft",
    showPopover: true,
  },
];
