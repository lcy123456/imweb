import { FC, useMemo, useRef } from "react";

import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import MergeMessageModal from "@/pages/common/MergeMessageModal";
import { formatMessageByType } from "@/utils/imCommon";

import { IMessageItemProps } from ".";

const MergeMessageRenderer: FC<IMessageItemProps> = ({ message }) => {
  const { title, multiMessage, abstractList } = message.mergeElem;
  const _abstractList = useMemo((): string[] => {
    let list: string[] = [];
    if (abstractList) {
      list = abstractList;
    } else if (multiMessage.length > 0) {
      list = multiMessage
        .slice(0, 4)
        .map((v) => `${v.senderNickname}：${formatMessageByType(v)}`);
    }
    return list;
  }, []);

  const mergeModalRef = useRef<OverlayVisibleHandle>(null);
  const handleClick = () => {
    mergeModalRef.current?.openOverlay();
  };

  return (
    <div className="merge_message_container w-60 cursor-pointer rounded-md bg-[var(--chat-bubble)]">
      <div onClick={handleClick}>
        <div className="border-b border-[var(--gap-text)] px-4 py-2.5">{title}</div>
        <ul className="px-4 py-2.5 text-xs text-[var(--sub-text)]">
          {_abstractList.map((item, idx) => (
            <li className="mb-2 truncate last:mb-0" key={idx}>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <MergeMessageModal ref={mergeModalRef} {...message.mergeElem}></MergeMessageModal>
    </div>
  );
};

export default MergeMessageRenderer;
