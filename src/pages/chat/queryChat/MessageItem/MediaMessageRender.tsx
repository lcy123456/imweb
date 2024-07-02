import { MessageType } from "open-im-sdk-wasm";
import { FC, useMemo } from "react";

import play_icon from "@/assets/images/messageItem/play_video.png";
import MyImage from "@/components/MyImage";
import emitter from "@/utils/events";
import { formatMessageFileUrl } from "@/utils/imCommon";

import { IMessageItemProps } from ".";

interface Props extends IMessageItemProps {
  isQuote?: boolean;
}
const MediaMessageRender: FC<Props> = (props) => {
  const { message, mediaList, isQuote } = props;
  const { contentType, videoElem, pictureElem } = message;

  const isVideoMessage = contentType === MessageType.VideoMessage;

  const previewUrl = useMemo(() => {
    return formatMessageFileUrl(
      isVideoMessage ? videoElem.snapshotUrl : pictureElem.sourcePicture.url,
    );
  }, [videoElem, pictureElem]);

  const previewInAlbum = () => {
    emitter.emit("OPEN_MEDIA_PREVIEW", {
      message,
      mediaList,
    });
  };

  return (
    <div
      className="media-container relative min-h-[50px] min-w-[80px] max-w-[200px] cursor-pointer"
      onClick={(e) => {
        isQuote && e.stopPropagation();
        previewInAlbum();
      }}
    >
      <MyImage
        rootClassName="message-image"
        className="max-w-[200px] rounded-md align-middle"
        src={previewUrl}
      ></MyImage>
      {isVideoMessage && (
        <img
          src={play_icon}
          width={40}
          className="play-icon absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          alt="play"
        />
      )}
    </div>
  );
};

export default MediaMessageRender;
