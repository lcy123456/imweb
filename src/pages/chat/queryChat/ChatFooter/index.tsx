import { useLatest } from "ahooks";
import clsx from "clsx";
import { GroupMemberItem } from "open-im-sdk-wasm/lib/types/entity";
import { memo, useEffect, useMemo, useRef, useState } from "react";

import cancelPng from "@/assets/images/chatFooter/cancel.png";
import reply_active from "@/assets/images/chatFooter/reply_active.png";
import edit_active from "@/assets/images/messageMenu/edit_active.png";
import OIMAvatar from "@/components/OIMAvatar";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import useGroupMembers from "@/hooks/useGroupMembers";
import { IMSDK } from "@/layout/MainContentWrap";
import {
  ExMessageItem,
  useContactStore,
  useConversationStore,
  useUserStore,
} from "@/store";
import { formatEmoji } from "@/utils/emojis";
import { formatMessageByType } from "@/utils/imCommon";

import styles from "./chat-footer.module.scss";
import SendActionBar from "./SendActionBar";
import { useFileMessage } from "./SendActionBar/useFileMessage";
import SendEditor, { SendEditorHandle } from "./SendEditor";
import SendRecordAudio from "./SendRecordAudio";
import { useSendMessage } from "./useSendMessage";

const ChatFooter = () => {
  const { selfInfo } = useUserStore();
  const { fetchState, searchMember } = useGroupMembers();
  const groupMemberList = fetchState.searchMemberList.filter(
    (v) => v.userID !== selfInfo.userID,
  );
  const { quoteMessage, isEditQuoteMessage, updateQuoteMessage, currentConversation } =
    useConversationStore();
  const [html, setHtml] = useState("");

  const editorRef = useRef<SendEditorHandle>(null);

  const { createFileMessage } = useFileMessage();
  const { sendMessage } = useSendMessage();
  const [isRecordAudio, setIsRecordAudio] = useState(false);
  const [isRecordCancel, setIsRecordCancel] = useState(false);
  const [atActionBarVisible, setAtActionBarVisible] = useState(false);
  const [atFilterText, setAtFilterText] = useState("");

  useEffect(() => {
    if (quoteMessage) {
      if (isEditQuoteMessage) {
        const html = formatMessageByType(quoteMessage, "atHtml");
        editorRef.current?.setEditorHtml(html);
      } else {
        setTimeout(() => {
          editorRef.current?.setEditorFocus();
        }, 0);
      }
    }
    return () => {
      isEditQuoteMessage && editorRef.current?.setEditorHtml("");
    };
  }, [quoteMessage, isEditQuoteMessage]);

  useEffect(() => {
    const text = atFilterText.slice(1);
    searchMember(text);
  }, [atFilterText]);

  const getTypingMessage = async (msgTip: string) => {
    if (!currentConversation?.userID) return;
    const { data } = await IMSDK.typingStatusUpdate<ExMessageItem>({
      recvID: currentConversation.userID,
      msgTip,
    });
    sendMessage({
      message: data,
    });
  };

  const handleClickAtMember = (params: AtMemberItemType) => {
    editorRef.current?.clickAtMember(params);
  };

  const removeAtParams = () => {
    editorRef.current?.removeAtParams();
  };

  const handleSend = () => {
    editorRef.current?.enterToSend();
  };

  return (
    <footer
      className={`${styles["chat-width"]} relative rounded-xl bg-white py-[5px] pl-4 pr-2`}
    >
      <AtActionBar
        visible={atActionBarVisible}
        setVisible={setAtActionBarVisible}
        removeAtParams={removeAtParams}
        groupMemberList={groupMemberList}
        atFilterText={atFilterText}
        clickAtMember={handleClickAtMember}
      ></AtActionBar>
      {quoteMessage && (
        <div className={`${styles["quote-wrap"]} flex h-12 items-center`}>
          <img width={24} src={isEditQuoteMessage ? edit_active : reply_active} />
          <div className="mx-4 h-3/5 w-[2px] bg-[var(--primary)]"></div>
          <div className="text-xs">
            <div className="mb-1 font-sMedium text-[var(--primary)]">
              {isEditQuoteMessage ? "编辑消息" : `回复 ${quoteMessage.senderNickname}`}
            </div>
            <div
              className="line-clamp-1 break-all"
              dangerouslySetInnerHTML={{
                __html: formatEmoji(formatMessageByType(quoteMessage)),
              }}
            ></div>
          </div>
          <img
            className="ml-auto mr-2 cursor-pointer"
            width={20}
            src={cancelPng}
            onClick={() => updateQuoteMessage()}
          />
        </div>
      )}
      <div className="flex items-end">
        <SendActionBar
          sendMessage={sendMessage}
          createFileMessage={createFileMessage}
        />
        {isRecordAudio ? (
          <div
            className="ml-4 h-[40px] flex-1 self-center 
            bg-gray-50 pl-2 leading-[40px] text-[var(--sub-text)] 
            hover:bg-blue-300"
            onMouseEnter={() => setIsRecordCancel(true)}
            onMouseLeave={() => setIsRecordCancel(false)}
          >
            录音中...划入此处取消发送
          </div>
        ) : (
          <SendEditor
            ref={editorRef}
            setParentHtml={setHtml}
            atFilterText={atFilterText}
            setAtFilterText={setAtFilterText}
            atActionBarVisible={atActionBarVisible}
            setAtActionBarVisible={setAtActionBarVisible}
            getTypingMessage={getTypingMessage}
          />
        )}
        <div
          className={clsx(
            "h-[46px] w-[46px] cursor-pointer bg-center bg-no-repeat ",
            "bg-[url('@/assets/images/chatFooter/send_btn.png')] bg-[length:24px_24px]",
            "hover:bg-[url('@/assets/images/chatFooter/send_btn_active.png')] hover:bg-[length:46px_46px]",
            !html && "hidden",
          )}
          onClick={handleSend}
        ></div>
        <SendRecordAudio
          wrapClassName={String(html && "hidden")}
          sendMessage={sendMessage}
          createFileMessage={createFileMessage}
          isRecordAudio={isRecordAudio}
          isRecordCancel={isRecordCancel}
          setIsRecordAudio={setIsRecordAudio}
          setIsRecordCancel={setIsRecordCancel}
          getTypingMessage={getTypingMessage}
        ></SendRecordAudio>
      </div>
    </footer>
  );
};

export default memo(ChatFooter);

const atBoxH = 300;
const atLineH = 54;
export const AtAllId = "999999999";
export interface AtMemberItemType {
  userID: string;
  faceURL: string;
  nickname: string;
  nameUrl?: string;
}
interface AtActionBarProps {
  visible: boolean;
  setVisible: (val: boolean) => void;
  removeAtParams: () => void;
  atFilterText: string;
  clickAtMember: (val: AtMemberItemType) => void;
  groupMemberList: GroupMemberItem[];
}
const AtActionBar = (props: AtActionBarProps) => {
  const { friendList } = useContactStore();
  const {
    visible,
    setVisible,
    removeAtParams,
    atFilterText,
    clickAtMember,
    groupMemberList,
  } = props;
  const { isOwner, isAdmin } = useCurrentMemberRole();

  const [preIndex, setPreIndex] = useState(0);
  const atBoxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textWidthRef = useRef<HTMLSpanElement>(null);

  const showAtList = useMemo(() => {
    setPreIndex(0);
    const arr = groupMemberList.map((v) => ({
      userID: v.userID,
      faceURL: v.faceURL,
      nickname: v.nickname,
    }));
    if (isOwner || isAdmin) {
      const all = {
        userID: AtAllId,
        faceURL: "",
        nickname: "모두", // 所有人
      };
      const text = atFilterText.slice(1);
      all.nickname.includes(text) && arr.unshift(all);
    }
    return arr;
  }, [groupMemberList, isOwner, isAdmin, atFilterText]);

  useEffect(() => {
    setVisible(atFilterText.includes("@") && showAtList.length !== 0);
  }, [showAtList, atFilterText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;

      switch (e.keyCode) {
        case 38:
          setPreIndex((val) => {
            const index = Math.max(val - 1, 0);
            handleScrollToIndex(index);
            return index;
          });
          e.preventDefault();
          break;
        case 40:
          setPreIndex((val) => {
            const index = Math.min(val + 1, showAtList.length - 1);
            handleScrollToIndex(index);
            return index;
          });
          e.preventDefault();
          break;
        case 13:
          if (e.shiftKey) return;
          handleClickMember(preIndex);
          break;
      }
    };
    const handleScrollToIndex = (index: number) => {
      if (!atBoxRef.current) return;
      if ((index + 1) * atLineH > atBoxH + (atBoxRef.current.scrollTop || 0)) {
        atBoxRef.current.scrollTop = (index + 1) * atLineH - atBoxH;
      } else if (index * atLineH < (atBoxRef.current.scrollTop || 0)) {
        atBoxRef.current.scrollTop = index * atLineH;
      }
    };
    const handleClick = () => {
      removeAtParams();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClick);
    };
  }, [visible, preIndex, showAtList]);

  const handleClickMember = (index: number) => {
    const member = showAtList[index];
    if (!member) return;
    // const friend = friendList.find((j) => j.userID === member.userID);
    // const nickname = friend?.remark || member.nickname;
    clickAtMember({
      ...member,
      nickname: member.nickname,
    });
  };

  return (
    <div
      ref={atBoxRef}
      className={clsx(
        "absolute bottom-full left-0 w-full",
        "overflow-auto rounded-xl bg-white",
        visible ? "h-fit" : "h-0",
      )}
      style={{ maxHeight: `${atBoxH}px` }}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {showAtList.map((v, index) => {
        const friend = friendList.find((j) => j.userID === v.userID);
        const showName = friend?.remark || v.nickname;

        return (
          <div
            key={v.userID}
            className={clsx(
              "flex cursor-pointer items-center px-4 hover:bg-gray-100",
              preIndex === index && "bg-gray-100",
            )}
            style={{ height: `${atLineH}px` }}
            onClick={() => handleClickMember(index)}
          >
            <OIMAvatar
              src={v.faceURL}
              text={v.userID === AtAllId ? "全部" : showName}
              size={38}
            ></OIMAvatar>
            <span className="ml-2 font-sBold">{showName}</span>
          </div>
        );
      })}
      <div className="invisible absolute -bottom-[1000px] -left-[1000px]">
        <canvas ref={canvasRef}></canvas>
        <span ref={textWidthRef} className="text-base"></span>
      </div>
    </div>
  );
};
