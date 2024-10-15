// import face_2 from "@/assets/images/emojis/face_2.png";
import face_3 from "@/assets/images/emojis/face_3.png";
import face_4 from "@/assets/images/emojis/face_4.png";
import face_5 from "@/assets/images/emojis/face_5.png";
import face_6 from "@/assets/images/emojis/face_6.png";
import face_7 from "@/assets/images/emojis/face_7.png";
import face_8 from "@/assets/images/emojis/face_8.png";
import face_9 from "@/assets/images/emojis/face_9.png";
import face_10 from "@/assets/images/emojis/face_10.png";
import face_11 from "@/assets/images/emojis/face_11.png";
import face_12 from "@/assets/images/emojis/face_12.png";
// import face_13 from "@/assets/images/emojis/face_13.png";
import face_14 from "@/assets/images/emojis/face_14.png";
import face_15 from "@/assets/images/emojis/face_15.png";
// import face_16 from "@/assets/images/emojis/face_16.png";
import face_17 from "@/assets/images/emojis/face_17.png";
import face_18 from "@/assets/images/emojis/face_18.png";
import face_19 from "@/assets/images/emojis/face_19.png";
import face_20 from "@/assets/images/emojis/face_20.png";
import face_21 from "@/assets/images/emojis/face_21.png";
import face_22 from "@/assets/images/emojis/face_22.png";

import like_ok from "@/assets/images/likeEmojis/ok.png";
import like_support from "@/assets/images/likeEmojis/support.png";
import like_love from "@/assets/images/likeEmojis/love.png";
import like_face_1 from "@/assets/images/likeEmojis/face_1.png";
import like_face_2 from "@/assets/images/likeEmojis/face_2.png";
import like_face_3 from "@/assets/images/likeEmojis/face_3.png";
import like_face_4 from "@/assets/images/likeEmojis/face_4.png";
import like_face_5 from "@/assets/images/likeEmojis/face_5.png";
import like_face_6 from "@/assets/images/likeEmojis/face_6.png";
import like_face_7 from "@/assets/images/likeEmojis/face_7.png";
import like_face_8 from "@/assets/images/likeEmojis/face_8.png";
import like_face_9 from "@/assets/images/likeEmojis/face_9.png";
import like_face_10 from "@/assets/images/likeEmojis/face_10.png";

const emojis = [
  // {
  //   context: "[微笑]",
  //   reg: new RegExp(/\[微笑\]/g),
  //   src: face_2,
  //   placeholder: "🙂",
  // },
  {
    context: "[哭泣]",
    reg: new RegExp(/\[哭泣\]/g),
    src: face_3,
    placeholder: "🙂",
  },
  {
    context: "[喜欢]",
    reg: new RegExp(/\[喜欢\]/g),
    src: face_4,
    placeholder: "🙂",
  },
  {
    context: "[疑问]",
    reg: new RegExp(/\[疑问\]/g),
    src: face_5,
    placeholder: "🙂",
  },
  {
    context: "[满足]",
    reg: new RegExp(/\[满足\]/g),
    src: face_6,
    placeholder: "🙂",
  },
  {
    context: "[开心]",
    reg: new RegExp(/\[开心\]/g),
    src: face_7,
    placeholder: "🙂",
  },
  {
    context: "[得意]",
    reg: new RegExp(/\[得意\]/g),
    src: face_8,
    placeholder: "🙂",
  },
  {
    context: "[震惊]",
    reg: new RegExp(/\[震惊\]/g),
    src: face_9,
    placeholder: "🙂",
  },
  {
    context: "[无语]",
    reg: new RegExp(/\[无语\]/g),
    src: face_10,
    placeholder: "🙂",
  },
  {
    context: "[难过]",
    reg: new RegExp(/\[难过\]/g),
    src: face_11,
    placeholder: "🙂",
  },
  {
    context: "[吐舌]",
    reg: new RegExp(/\[吐舌\]/g),
    src: face_12,
    placeholder: "🙂",
  },
  // {
  //   context: "[捂脸笑]",
  //   reg: new RegExp(/\[捂脸笑\]/g),
  //   src: face_13,
  //   placeholder: "🤦",
  // },
  {
    context: "[愤怒]",
    reg: new RegExp(/\[愤怒\]/g),
    src: face_14,
    placeholder: "🙂",
  },
  {
    context: "[受伤]",
    reg: new RegExp(/\[受伤\]/g),
    src: face_15,
    placeholder: "🙂",
  },
  // {
  //   context: "[呲牙]",
  //   reg: new RegExp(/\[呲牙\]/g),
  //   src: face_16,
  //   placeholder: "😁",
  // },
  {
    context: "[点赞-灰]",
    reg: new RegExp(/\[点赞-灰\]/g),
    src: face_17,
    placeholder: "🙂",
  },
  {
    context: "[点赞]",
    reg: new RegExp(/\[点赞\]/g),
    src: face_18,
    placeholder: "🙂",
  },
  {
    context: "[ok]",
    reg: new RegExp(/\[ok\]/g),
    src: face_22,
    placeholder: "🙂",
  },
  {
    context: "[爱心]",
    reg: new RegExp(/\[爱心\]/g),
    src: face_19,
    placeholder: "🙂",
  },
  {
    context: "[心碎]",
    reg: new RegExp(/\[心碎\]/g),
    src: face_20,
    placeholder: "🙂",
  },
  {
    context: "[爱心-2]",
    reg: new RegExp(/\[爱心-2\]/g),
    src: face_21,
    placeholder: "🙂",
  },
];

export const formatEmoji = (str = "") => {
  emojis.map((emoji) => {
    if (str.includes(emoji.context)) {
      let imgStr = `<img class="emoji-inline" src="${emoji.src}" alt="${emoji.context}" />`;
      str = str.replace(emoji.reg, imgStr);
    }
  });
  return str;
};

export const emojiPlaceholderToContext = (str: string) => {
  const emojiMap: {
    [key: string]: string;
  } = {};
  emojis.forEach((v) => {
    emojiMap[v.placeholder] = v.context;
  });
  let res = str;
  for (let i = 0; i < str.pointLength(); i++) {
    const char = str.pointAt(i);
    if (emojiMap[char]) {
      res = res.replace(char, emojiMap[char]);
    }
  }
  return res;
};

export type EmojiItem = (typeof emojis)[0];

console.log("---------------------------", emojis.length);

export default emojis;

export const likeEmojis = [
  {
    context: "ok",
    reg: new RegExp(/ok/g),
    src: like_ok,
  },
  {
    context: "support",
    reg: new RegExp(/support/g),
    src: like_support,
  },
  {
    context: "love",
    reg: new RegExp(/love/g),
    src: like_love,
  },
  {
    context: "face_1",
    reg: new RegExp(/face_1/g),
    src: like_face_1,
  },
  {
    context: "face_2",
    reg: new RegExp(/face_2/g),
    src: like_face_2,
  },
  {
    context: "face_3",
    reg: new RegExp(/face_3/g),
    src: like_face_3,
  },
  {
    context: "arrow",
    reg: new RegExp(/arrow/g),
    src: "",
  },
  {
    context: "face_4",
    reg: new RegExp(/face_4/g),
    src: like_face_4,
  },
  {
    context: "face_5",
    reg: new RegExp(/face_5/g),
    src: like_face_5,
  },
  {
    context: "face_6",
    reg: new RegExp(/face_6/g),
    src: like_face_6,
  },
  {
    context: "face_7",
    reg: new RegExp(/face_7/g),
    src: like_face_7,
  },
  {
    context: "face_8",
    reg: new RegExp(/face_8/g),
    src: like_face_8,
  },
  {
    context: "face_9",
    reg: new RegExp(/face_9/g),
    src: like_face_9,
  },
  {
    context: "face_10",
    reg: new RegExp(/face_10/g),
    src: like_face_10,
  },
];

export type LikeEmojiItem = (typeof likeEmojis)[0];
