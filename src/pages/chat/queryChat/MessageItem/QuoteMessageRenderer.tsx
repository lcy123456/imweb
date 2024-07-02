import { MessageType } from "open-im-sdk-wasm";
import { FC } from "react";

import { formatEmoji } from "@/utils/emojis";
import emitter from "@/utils/events";
import { formatMessageByType } from "@/utils/imCommon";

import { IMessageItemProps } from ".";
import MediaMessageRender from "./MediaMessageRender";
import styles from "./message-item.module.scss";

const QuoteMessageRenderer: FC<IMessageItemProps> = ({
  message: { quoteElem, atTextElem },
}) => {
  const quoteMessage = quoteElem?.quoteMessage || atTextElem?.quoteMessage;

  const handleClick = () => {
    emitter.emit("CHAT_LIST_SCROLL_TO_MESSAGE", quoteMessage);
  };

  return (
    <>
      {quoteMessage && (
        <div
          className={String(styles["quote-message-container"])}
          onClick={handleClick}
        >
          <div className="relative mr-3 min-h-[32px] w-full border-l-2 border-solid border-[var(--primary)] pl-4 text-xs">
            <div className="font-sMedium text-[var(--primary)]">
              回复 {quoteMessage.senderNickname}
            </div>
            {[MessageType.PictureMessage, MessageType.VideoMessage].includes(
              quoteMessage.contentType,
            ) ? (
              <MediaMessageRender
                message={quoteMessage}
                isSender={false}
                isQuote={true}
              ></MediaMessageRender>
            ) : (
              <div
                className="absolute bottom-0 left-4 right-0 h-4 truncate"
                dangerouslySetInnerHTML={{
                  __html: String(formatEmoji(formatMessageByType(quoteMessage))),
                }}
              ></div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QuoteMessageRenderer;
