import { MessageType } from "open-im-sdk-wasm";
import { FC } from "react";
import ReactDOMServer from "react-dom/server";

import { _MessageType } from "@/constants";
import { formatBr, formatHttp } from "@/utils/common";
import { formatEmoji } from "@/utils/emojis";
import { formatAtText } from "@/utils/imCommon";

import { IMessageItemProps } from ".";
import GiveLikeWrap from "./GiveLikeWrap";
import styles from "./message-item.module.scss";
import SendTimeWrap from "./SendTimeWrap";

const TextMessageRender: FC<IMessageItemProps> = (props) => {
  const { message } = props;
  const { textElem, quoteElem, atTextElem, advancedTextElem, contentType } = message;

  const getFormatContent = () => {
    let content = textElem?.content;

    if (contentType === MessageType.QuoteMessage) {
      content = quoteElem.text;
    } else if (
      contentType === (_MessageType.AdvancedMessage as unknown as MessageType)
    ) {
      content = advancedTextElem.text;
    } else if (contentType === MessageType.AtTextMessage) {
      content = formatAtText(atTextElem, "linkHtml");
    }

    content = formatHttp(content);
    content = formatEmoji(content);
    content = formatBr(content);

    const htmlString = ReactDOMServer.renderToString(
      <SendTimeWrap {...props} className="invisible ml-2"></SendTimeWrap>,
    );
    content += htmlString;

    return content;
  };
  const formatContent = getFormatContent();

  return (
    <>
      <div
        className={`${styles.bubble} text-base`}
        dangerouslySetInnerHTML={{ __html: formatContent }}
      ></div>
      <GiveLikeWrap {...props} hasTimeWrap={true}></GiveLikeWrap>
      <SendTimeWrap {...props} isAbsoluteTime></SendTimeWrap>
    </>
  );
};

export default TextMessageRender;
