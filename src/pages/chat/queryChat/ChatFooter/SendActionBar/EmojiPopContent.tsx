import { CloseOutlined, LoadingOutlined, SearchOutlined } from "@ant-design/icons";
import { useDebounce } from "ahooks";
import { Divider, Input, Spin } from "antd";
import { chunk } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import { getGifsSearchApi, GifOriginal, GifSearchItem } from "@/api";
import emoji_pop from "@/assets/images/chatFooter/emoji_pop.png";
import emoji_pop_active from "@/assets/images/chatFooter/emoji_pop_active.png";
import favorite from "@/assets/images/chatFooter/favorite.png";
import favorite_active from "@/assets/images/chatFooter/favorite_active.png";
import search_icon from "@/assets/images/conversation/search.png";
import empty from "@/assets/images/searchModal/empty.png";
import MyImage from "@/components/MyImage";
import useFavoriteEmoji from "@/hooks/useFavoriteEmoji";
import { feedbackToast } from "@/utils/common";
import emojis from "@/utils/emojis";
import emitter from "@/utils/events";
import { formatMessageFileUrl } from "@/utils/imCommon";

type EmojiItem = (typeof emojis)[0];

interface Props {
  handleSendGif?: (val: GifOriginal) => void;
  sendLoading?: boolean;
}
const EmojiPopContent = ({ handleSendGif, sendLoading }: Props) => {
  const [menuIndex, setMenuIndex] = useState(0);

  const handleEmojiClick = (emoji: EmojiItem) => {
    emitter.emit("EDITOR_INSET_EMOJI", emoji);
  };

  return (
    <div className="flex h-[440px] w-[500px] flex-col">
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform"
          style={{ transform: `translateX(-${menuIndex * 100}%)` }}
        >
          {/* <SearchGifPane
            handleSendGif={handleSendGif}
            sendLoading={sendLoading}
          ></SearchGifPane> */}
          <EmojiTabPane handleEmojiClick={handleEmojiClick} />
          {/* <SearchGifPane
            handleSendGif={handleSendGif}
            sendLoading={sendLoading}
            isFavorite={true}
          ></SearchGifPane> */}
        </div>
      </div>
      <Divider className="border-1 m-0 border-[var(--gap-text)]" />
      <div className="flex items-center px-4 py-2">
        {menuList.map((v, index) => {
          return (
            <div
              className={`px-2 py-1 ${
                menuIndex === index && "bg-[rgba(0,0,0,0.05)]"
              } rounded-md`}
              key={v.key}
              onClick={() => setMenuIndex(index)}
            >
              <img
                className=" cursor-pointer"
                width={26}
                src={menuIndex === index ? v.active_icon : v.icon}
              ></img>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmojiPopContent;

const menuList = [
  // {
  //   key: "search",
  //   icon: search_icon,
  //   active_icon: search_icon,
  // },
  {
    key: "emoji",
    icon: emoji_pop,
    active_icon: emoji_pop_active,
  },
  // {
  //   key: "favorite",
  //   icon: favorite,
  //   active_icon: favorite_active,
  // },
];

const EmojiTabPane = ({
  handleEmojiClick,
}: {
  handleEmojiClick: (emoji: EmojiItem) => void;
}) => (
  <div className="grid h-fit max-h-full min-w-full grid-cols-10 overflow-auto p-5">
    {emojis.map((emoji) => (
      <div
        className="flex cursor-pointer items-center justify-center hover:bg-[rgba(0,0,0,0.05)]"
        key={emoji.context}
        onClick={() => handleEmojiClick(emoji)}
      >
        <img
          src={emoji.src}
          alt={emoji.context}
          width="30px"
          height="30px"
          className="mb-1"
        />
      </div>
    ))}
  </div>
);

const searchLimit = 25;
interface SearchGifPaneProps {
  handleSendGif?: (val: GifOriginal) => void;
  sendLoading?: boolean;
  isFavorite?: boolean;
}
const SearchGifPane = ({
  handleSendGif,
  sendLoading,
  isFavorite,
}: SearchGifPaneProps) => {
  const { favoriteEmojiList, removeFavoriteEmoji } = useFavoriteEmoji();
  const [keyword, setKeyword] = useState("");
  const throttledKeyword = useDebounce(keyword, { wait: 500 });

  const [gifList, setGifList] = useState<GifSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const isEnd = useRef(false);

  useEffect(() => {
    isEnd.current = false;
    handleSearch(true);
    // if (throttledKeyword) {
    // } else {
    //   setGifList([]);
    // }
  }, [throttledKeyword]);

  useEffect(() => {
    if (isFavorite) {
      setGifList(
        favoriteEmojiList.map((v) => {
          const fileUrl = formatMessageFileUrl(v.url);
          return {
            id: v.id,
            images: {
              original: {
                url: fileUrl,
              },
              preview_gif: {
                url: fileUrl,
              },
            },
          };
        }),
      );
      return;
    }
  }, [isFavorite, favoriteEmojiList]);

  const handleSearch = async (init = false) => {
    if (isEnd.current || isFavorite) return;
    setLoading(true);
    const { data: res } = await getGifsSearchApi({
      q: throttledKeyword || "搞笑",
      limit: searchLimit,
      offset: init ? 0 : gifList.length,
    });
    const { meta, data, pagination } = res;
    if (meta.status !== 200) {
      feedbackToast({
        error: "搜索异常，请联系工作人员",
        msg: "搜索异常，请联系工作人员",
      });
      return;
    }
    setLoading(false);
    isEnd.current = searchLimit !== pagination.count;
    setGifList((val) => [...(init ? [] : val), ...data]);
  };

  const loadMore = useCallback(() => {
    handleSearch();
    return false;
  }, [gifList]);

  const showGifList = useMemo(() => chunk(gifList, 4), [gifList]);

  return (
    <div className="relative flex h-full min-w-full flex-col overflow-auto p-5">
      {isFavorite ? null : (
        <Input
          className="mb-5"
          value={keyword}
          placeholder="搜索"
          onChange={(e) => setKeyword(e.target.value)}
          prefix={<SearchOutlined />}
        />
      )}
      {showGifList.length === 0 ? (
        <img className="self-center" width={160} src={empty}></img>
      ) : (
        <Virtuoso
          className="no-scrollbar flex-1"
          data={showGifList}
          endReached={isFavorite ? undefined : loadMore}
          itemContent={(_, gifItem) => (
            <div className="mb-3 flex h-[100px] flex-wrap justify-between">
              {gifItem.map((v) => {
                return (
                  <div className="relative" key={v.id}>
                    <MyImage
                      width={100}
                      height={100}
                      src={v.images.preview_gif.url}
                      className="cursor-pointer"
                      onClick={() => handleSendGif?.(v.images.original)}
                    />
                    {isFavorite && (
                      <CloseOutlined
                        className="absolute right-0 top-0 text-lg text-gray-400 hover:text-black"
                        onClick={() => removeFavoriteEmoji(v.id)}
                      />
                    )}
                  </div>
                );
              })}
              <div className="h-0 w-[100px]"></div>
              <div className="h-0 w-[100px]"></div>
              <div className="h-0 w-[100px]"></div>
              <div className="h-0 w-[100px]"></div>
            </div>
          )}
          components={{
            Footer: () => (
              <div className="text-center">
                {loading && <LoadingOutlined className="text-xl" />}
              </div>
            ),
          }}
        />
      )}
      {sendLoading && (
        <Spin className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)]"></Spin>
      )}
    </div>
  );
};
