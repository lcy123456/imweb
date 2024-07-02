import {
  apiFavoriteEmojiCollectAdd,
  apiFavoriteEmojiCollectCancel,
  apiFavoriteEmojiCollectList,
} from "@/api/chatApi";
import { useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";

const useFavoriteEmoji = () => {
  const { favoriteEmojiList, updateFavoriteEmojiList } = useUserStore();

  const addFavoriteEmoji = async (params: { url: string }) => {
    try {
      await apiFavoriteEmojiCollectAdd(params);
      getFavoriteEmojiList();
      feedbackToast({ msg: "添加成功" });
    } catch {
      feedbackToast({ error: "1", msg: "重复添加" });
    }
  };

  const removeFavoriteEmoji = async (id: string) => {
    await apiFavoriteEmojiCollectCancel({ id });
    getFavoriteEmojiList();
    feedbackToast({ msg: "移除成功" });
  };

  const getFavoriteEmojiList = async () => {
    const res = await apiFavoriteEmojiCollectList({
      pagination: {
        pageNumber: 1,
        showNumber: 200,
      },
    });
    updateFavoriteEmojiList(res.data.list || []);
  };

  return {
    favoriteEmojiList,
    addFavoriteEmoji,
    removeFavoriteEmoji,
    getFavoriteEmojiList,
  };
};

export default useFavoriteEmoji;
