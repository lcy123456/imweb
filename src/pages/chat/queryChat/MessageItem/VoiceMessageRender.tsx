import clsx from "clsx";
import { FC, useEffect, useMemo, useRef, useState } from "react";

import pause_audio_wave from "@/assets/images/messageItem/pause_audio_wave.png";
import pause_record_audio from "@/assets/images/messageItem/pause_record_audio.png";
import play_audio_wave from "@/assets/images/messageItem/play_audio_wave.gif";
import play_record_audio from "@/assets/images/messageItem/play_record_audio.png";
import { PlayType } from "@/constants";
import { secondsToMS } from "@/utils/common";
// import VoiceIcon from "@/svg/VoiceIcon";
import emitter, { PlayAudioParams } from "@/utils/events";
import { formatMessageFileUrl } from "@/utils/imCommon";

import { IMessageItemProps } from ".";
import styles from "./message-item.module.scss";
import SendTimeWrap from "./SendTimeWrap";

const VoiceMessageRender: FC<IMessageItemProps> = (props) => {
  const { message } = props;
  const { sourceUrl, duration } = message.soundElem;
  const audioEl = useRef<HTMLAudioElement>(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);

  const _sourceUrl = useMemo(() => {
    return formatMessageFileUrl(sourceUrl);
  }, [sourceUrl]);

  const playAudioClick = () => {
    if (audioEl.current.paused) {
      audioEl.current.play();
      setIsPlaying(true);
    } else {
      audioEl.current.pause();
    }
    emitter.emit("PLAY_MESSAGE_AUDIO", {
      type: PlayType.VoiceMessage,
      src: _sourceUrl,
    });
  };

  useEffect(() => {
    audioEl.current.src = _sourceUrl;
    const handlePause = () => {
      setIsPlaying(false);
      audioEl.current.currentTime = 0;
    };
    audioEl.current.onended = handlePause;
    audioEl.current.onpause = handlePause;

    const handlePlaying = ({ type, src }: PlayAudioParams) => {
      if (type === PlayType.VoiceMessage && src !== _sourceUrl) {
        audioEl.current.pause();
      }
    };
    emitter.on("PLAY_MESSAGE_AUDIO", handlePlaying);
    return () => {
      emitter.off("PLAY_MESSAGE_AUDIO", handlePlaying);
    };
  }, [_sourceUrl]);

  return (
    <div
      className={clsx(styles.bubble, "flex h-12 w-48 cursor-pointer items-center")}
      onClick={playAudioClick}
    >
      <img
        className="mr-2 cursor-pointer"
        width={36}
        src={isPlaying ? play_record_audio : pause_record_audio}
        alt=""
      />
      <div>
        <img
          className="mb-1 h-4"
          src={isPlaying ? play_audio_wave : pause_audio_wave}
          alt=""
        />
        <div className="text-sm text-[var(--primary)]">
          {secondsToMS(Math.ceil(duration))}
        </div>
      </div>
      <SendTimeWrap {...props} isAbsoluteTime></SendTimeWrap>
    </div>
  );
};

export default VoiceMessageRender;
