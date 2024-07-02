import "./mergeMessageModal.scss";

import { MessageType } from "open-im-sdk-wasm";
import { MergeElem } from "open-im-sdk-wasm/lib/types/entity";
import { forwardRef, ForwardRefRenderFunction, useMemo } from "react";

import DraggableModalWrap from "@/components/DraggableModalWrap";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { MessageComponentMap } from "@/pages/chat/queryChat/MessageItem";
import CatchMessageRender from "@/pages/chat/queryChat/MessageItem/CatchMsgRenderer";

const MergeMessageModal: ForwardRefRenderFunction<OverlayVisibleHandle, MergeElem> = (
  props,
  ref,
) => {
  const { title, multiMessage } = props;

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  const mediaList = useMemo(() => {
    const res = multiMessage?.filter((v) =>
      [MessageType.VideoMessage, MessageType.PictureMessage].includes(v.contentType),
    );
    return res;
  }, [multiMessage]);

  return (
    <DraggableModalWrap
      footer={null}
      title={<div className="cursor-move">{title}</div>}
      centered
      open={isOverlayOpen}
      onCancel={closeOverlay}
      width={620}
      destroyOnClose={true}
      ignoreClasses=".merge_modal_container"
    >
      <div className={`merge_modal_container max-h-[80vh] overflow-auto`}>
        {multiMessage?.map((v) => {
          const MessageRenderComponent =
            MessageComponentMap[v.contentType] || CatchMessageRender;
          return (
            <div
              key={v.clientMsgID}
              className="flex border-b border-[var(--gap-text)] py-2"
            >
              <div className="flex w-[100px] text-base">
                <span className=" truncate">{v.senderNickname}</span>：
              </div>
              <MessageRenderComponent
                message={v}
                isSender={false}
                mediaList={mediaList}
              ></MessageRenderComponent>
            </div>
          );
        })}
      </div>
    </DraggableModalWrap>
  );
};

export default forwardRef(MergeMessageModal);
