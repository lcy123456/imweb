import "xgplayer/dist/index.min.css";
import "swiper/scss";
import "swiper/scss/navigation";
import "swiper/scss/virtual";

import {
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import clsx from "clsx";
import { MessageType } from "open-im-sdk-wasm";
import {
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  WheelEvent,
} from "react";
import { Navigation, Virtual } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import { v4 as uuidv4 } from "uuid";
import Player from "xgplayer";

import MyPopover, { menuItemType } from "@/components/MyPopover";
import { MediaPreviewParams } from "@/pages/common/MediaPreviewModal";
import { ExMessageItem } from "@/store";
import { downloadFileApi, handleCopyImage } from "@/utils/common";
import { formatMessageFileUrl } from "@/utils/imCommon";

import styles from "./index.module.scss";

let timer: NodeJS.Timeout;

const SwiperWrap = (props: MediaPreviewParams) => {
  const { messageList, index } = props;

  const swiperRef = useRef<SwiperClass>(null);
  const mediaItemRefs = useRef<{
    [propsName: string]: MediaItemImperative;
  }>({});

  const activeIndex = useRef(index);

  const getMediaItemRefs = (clientMsgID: string, ele: MediaItemImperative) => {
    mediaItemRefs.current[clientMsgID] = ele;
  };

  const onSlideChange = (swiper: SwiperClass) => {
    activeIndex.current = swiper.activeIndex;
    for (const key in mediaItemRefs.current) {
      mediaItemRefs.current[key].onSlideChange();
    }
  };

  const [show, setShow] = useState(true);
  useEffect(() => {
    const handleInit = () => {
      clearTimeout(timer);
      setShow(false);
      timer = setTimeout(() => {
        setShow(true);
      }, 100);
    };
    const handleKeydown = (e: KeyboardEvent) => {
      switch (e.keyCode) {
        case 37:
          swiperRef.current.slidePrev();
          break;
        case 39:
          swiperRef.current.slideNext();
          break;
      }
    };
    window.addEventListener("resize", handleInit);
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("resize", handleInit);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  useEffect(() => {
    if (!swiperRef.current || index === activeIndex.current) return;
    activeIndex.current = index;
    swiperRef.current.slideTo(index, 300);
  }, [messageList]);

  return show ? (
    <Swiper
      initialSlide={index}
      className="w-full flex-1 overflow-hidden"
      modules={[Navigation, Virtual]}
      navigation
      virtual
      onSwiper={(swiper: SwiperClass) => {
        swiperRef.current = swiper;
      }}
      onSlideChange={onSlideChange}
    >
      {messageList.map((v, i) => {
        return (
          <SwiperSlide
            key={v.clientMsgID}
            className="!flex items-center justify-center px-14"
            virtualIndex={i}
          >
            <div className="media-wrap relative h-full w-full">
              <MediaItem
                message={v}
                index={i}
                ref={(ele) => ele && getMediaItemRefs(v.clientMsgID, ele)}
              ></MediaItem>
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  ) : (
    <></>
  );
};

export default SwiperWrap;

interface MediaItemProps {
  message: ExMessageItem;
  index: number;
}
interface MediaItemImperative {
  onSlideChange: () => void;
}
const MediaItem = forwardRef<MediaItemImperative, MediaItemProps>((props, ref) => {
  const { message, index } = props;
  const imgWrapRef = useRef<ImgWrapImperative>(null);

  const isVideoMessage = message.contentType === MessageType.VideoMessage;

  const sourceUrl = useMemo(() => {
    return formatMessageFileUrl(
      isVideoMessage
        ? message.videoElem.videoUrl
        : message.pictureElem.sourcePicture.url,
    );
  }, [message.videoElem, message.pictureElem]);

  const [actionVisible, setActionVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [player, setPlayer] = useState<Player>();
  const [imgSize, setImgSize] = useState({
    width: "auto",
    height: "auto",
    wrapWidth: "auto",
    wrapHeight: "auto",
  });

  useEffect(() => {
    isVideoMessage ? handleVideoParams() : handleImgParams();
  }, [message.clientMsgID]);

  const handleVideoParams = () => {
    const player = new Player({
      id: `video_player${index}`,
      url: sourceUrl,
      width: "100%",
      height: "100%",
      lang: "zh",
      download: true,
    });
    setPlayer(player);
  };

  const handleImgParams = () => {
    const { offsetWidth, offsetHeight } = document.querySelector(
      ".media-wrap",
    ) as HTMLDivElement;
    const { width, height } = message.pictureElem.sourcePicture;
    const _offsetHeight = offsetHeight - 200;
    const ratioX = width / offsetWidth;
    const ratioY = height / _offsetHeight;
    let imgSize = { width: "", height: "" };
    if (ratioX < 1 && ratioY < 1) {
      imgSize = {
        width: `${width}px`,
        height: `${height}px`,
      };
    } else if (ratioX >= ratioY) {
      imgSize = {
        width: `${offsetWidth}px`,
        height: `${height / ratioX}px`,
      };
    } else {
      imgSize = {
        width: `${width / ratioY}px`,
        height: `${_offsetHeight}px`,
      };
    }
    setImgSize({
      ...imgSize,
      wrapWidth: `${offsetWidth}px`,
      wrapHeight: `${offsetHeight}px`,
    });
  };

  const onSlideChange = () => {
    player?.paused || player?.pause();
    imgWrapRef.current?.handleReset();
  };

  const actionClick = (idx: menuItemType["idx"]) => {
    setLoading(true);
    switch (idx) {
      case 1:
        downloadFileApi({
          filename: sourceUrl.split("/").at(-1) || uuidv4(),
          fileUrl: sourceUrl,
          onDone: downloadDone,
        });
        break;
      case 2:
        handleCopyImage(sourceUrl);
        break;
      default:
        break;
    }
    setActionVisible(false);
  };

  const downloadDone = () => {
    setLoading(false);
  };

  useImperativeHandle(ref, () => {
    return {
      onSlideChange,
    };
  });

  if (isVideoMessage) {
    return <div id={`video_player${index}`} className="swiper-no-swiping"></div>;
  }
  return (
    <ImgWrap
      ref={imgWrapRef}
      src={sourceUrl}
      {...imgSize}
      actionVisible={actionVisible}
      setActionVisible={setActionVisible}
      actionClick={actionClick}
    ></ImgWrap>
  );
});

interface ImgProps {
  src: string;
  width: string;
  height: string;
  wrapWidth: string;
  wrapHeight: string;
  actionVisible: boolean;
  setActionVisible: (val: boolean) => void;
  actionClick: (idx: menuItemType["idx"], menu: menuItemType) => void;
}
interface ImgWrapImperative {
  handleReset: () => void;
}
const _ImgWrap: ForwardRefRenderFunction<ImgWrapImperative, ImgProps> = (
  props,
  ref,
) => {
  const {
    src,
    width,
    height,
    wrapWidth,
    wrapHeight,
    actionVisible,
    setActionVisible,
    actionClick,
  } = props;
  const widthNum = myParseInt(width);
  const heightNum = myParseInt(height);
  const wrapWidthNum = myParseInt(wrapWidth);
  const wrapHeightNum = myParseInt(wrapHeight);

  const [init, setInit] = useState(false);
  const [origin, setOrigin] = useState({
    originX: 0,
    originY: 0,
  });
  const [move, setMove] = useState({
    moveX: 0,
    moveY: 0,
  });
  const [transition, setTransition] = useState("");
  const [scale, setScale] = useState(1);
  const [reverseX, setReverseX] = useState(false);
  const [reverseY, setReverseY] = useState(false);
  const [rotate, setRotate] = useState(0);

  const handleInitOrigin = (init?: boolean) => {
    const originX = (wrapWidthNum - widthNum) / 2;
    const originY = (wrapHeightNum - heightNum) / 2;
    setOrigin({ originX, originY });
    if (init) {
      setTimeout(() => {
        setInit(true);
      }, 50);
    }
  };

  useEffect(() => {
    handleInitOrigin(true);
  }, [widthNum, heightNum, wrapWidthNum, wrapHeightNum]);

  const translate = useMemo(() => {
    const { originX, originY } = origin;
    const { moveX, moveY } = move;
    const x = originX + moveX;
    const y = originY + moveY;
    return `translate(${x}px, ${y}px)`;
  }, [origin, move]);
  const handleWheel = (e: WheelEvent<HTMLImageElement>) => {
    const isToTop = e.deltaY <= 0;
    const newScale = scale + (isToTop ? 0.3 : -0.3);
    setScale(Math.min(5, Math.max(0.5, newScale)));
    !isToTop && handleInitOrigin();
  };

  const handleMouseDown = (e1: React.MouseEvent<HTMLImageElement>) => {
    setTransition("");
    let _move = { moveX: 0, moveY: 0 };
    document.onmousemove = (e2: MouseEvent) => {
      const moveX = e2.pageX - e1.pageX;
      const moveY = e2.pageY - e1.pageY;
      _move = { moveX, moveY };
      setMove(_move);
    };
    document.onmouseup = () => {
      const { originX, originY } = origin;
      const { moveX, moveY } = _move;
      let x = originX + moveX;
      let y = originY + moveY;

      const showWidth = widthNum * scale;
      const showHeight = heightNum * scale;

      if (showWidth > wrapWidthNum) {
        x = Math.min((showWidth - widthNum) / 2, x);
        x = Math.max((showWidth - widthNum) / 2 - (showWidth - wrapWidthNum), x);
      } else {
        x = (wrapWidthNum - widthNum) / 2;
      }
      if (showHeight > wrapHeightNum) {
        y = Math.min((showHeight - heightNum) / 2, y);
        y = Math.max((showHeight - heightNum) / 2 - (showHeight - wrapHeightNum), y);
      } else {
        y = (wrapHeightNum - heightNum) / 2;
      }
      setOrigin({ originX: x, originY: y });
      setMove({ moveX: 0, moveY: 0 });
      setTransition("transform 0.3s");
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  const handleReset = () => {
    handleInitOrigin();
    setScale(1);
    setReverseX(false);
    setReverseY(false);
    setRotate(0);
  };

  useImperativeHandle(ref, () => {
    return {
      handleReset,
    };
  });

  return init ? (
    <>
      <MyPopover
        trigger="contextMenu"
        placement="right"
        open={actionVisible}
        onOpenChange={(vis) => setActionVisible(vis)}
        menuList={actionImageMenuList}
        actionClick={actionClick}
      >
        <img
          src={src}
          className="swiper-no-swiping cursor-pointer select-none"
          style={{
            width,
            height,
            transform: `${translate} scale(${(reverseX ? -1 : 1) * scale}, ${
              (reverseY ? -1 : 1) * scale
            }) rotate(${rotate}deg)`,
            transition: transition,
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
        />
      </MyPopover>
      <div
        className={styles["operation-wrap"]}
        onClick={() => setTransition("transform 0.3s")}
      >
        <SwapOutlined
          className={`${styles["icon"]} rotate-90`}
          onClick={() => setReverseX(!reverseX)}
        />
        <SwapOutlined
          className={styles["icon"]}
          onClick={() => setReverseY(!reverseY)}
        />
        <RotateLeftOutlined
          className={styles["icon"]}
          onClick={() => setRotate(rotate + 90)}
        />
        <RotateRightOutlined
          className={styles["icon"]}
          onClick={() => setRotate(rotate - 90)}
        />
        <ZoomOutOutlined
          className={clsx(styles["icon"], scale <= 0.5 ? "text-gray-400" : "")}
          onClick={() => handleWheel({ deltaY: 100 } as WheelEvent<HTMLImageElement>)}
        />
        <ZoomInOutlined
          className={clsx(styles["icon"], scale >= 5 ? "text-gray-400" : "")}
          onClick={() => handleWheel({ deltaY: -100 } as WheelEvent<HTMLImageElement>)}
        />
      </div>
    </>
  ) : (
    <></>
  );
};
const ImgWrap = forwardRef(_ImgWrap);

const actionImageMenuList: menuItemType[] = [
  {
    idx: 1,
    title: "图片另存为...",
  },
  {
    idx: 2,
    title: "复制图片",
  },
];

const myParseInt = (str: string, radix = 10) => parseInt(str, radix);
