export const avatarList = [
  {
    src: new URL("@/assets/avatar/ic_avatar_01.png", import.meta.url).href,
    name: "ic_avatar_01",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_02.png", import.meta.url).href,
    name: "ic_avatar_02",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_03.png", import.meta.url).href,
    name: "ic_avatar_03",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_04.png", import.meta.url).href,
    name: "ic_avatar_04",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_05.png", import.meta.url).href,
    name: "ic_avatar_05",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_06.png", import.meta.url).href,
    name: "ic_avatar_06",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_07.png", import.meta.url).href,
    name: "ic_avatar_07",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_08.png", import.meta.url).href,
    name: "ic_avatar_08",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_09.png", import.meta.url).href,
    name: "ic_avatar_09",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_10.png", import.meta.url).href,
    name: "ic_avatar_10",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_11.png", import.meta.url).href,
    name: "ic_avatar_11",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_12.png", import.meta.url).href,
    name: "ic_avatar_12",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_13.png", import.meta.url).href,
    name: "ic_avatar_13",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_14.png", import.meta.url).href,
    name: "ic_avatar_14",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_15.png", import.meta.url).href,
    name: "ic_avatar_15",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_16.png", import.meta.url).href,
    name: "ic_avatar_16",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_17.png", import.meta.url).href,
    name: "ic_avatar_17",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_18.png", import.meta.url).href,
    name: "ic_avatar_18",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_19.png", import.meta.url).href,
    name: "ic_avatar_19",
  },
  {
    src: new URL("@/assets/avatar/ic_avatar_20.png", import.meta.url).href,
    name: "ic_avatar_20",
  },
];

export const getDefaultAvatar = (name: string) => {
  return avatarList.find((avator) => avator.name === name)?.src;
};
