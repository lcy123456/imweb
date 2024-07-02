import receive_message_music01 from "@/assets/audio/receive_message_music01.mp3";
import receive_message_music02 from "@/assets/audio/receive_message_music02.mp3";
import receive_message_music03 from "@/assets/audio/receive_message_music03.mp3";
import receive_message_music04 from "@/assets/audio/receive_message_music04.mp3";
import receive_message_music05 from "@/assets/audio/receive_message_music05.mp3";
import burn_01 from "@/assets/images/chatHeader/burn_01.png";
import burn_07 from "@/assets/images/chatHeader/burn_07.png";
import burn_30 from "@/assets/images/chatHeader/burn_30.png";
import burn_stop from "@/assets/images/chatHeader/burn_stop.png";
import { menuItemType } from "@/components/MyPopover";

export const burnMenuList: menuItemType[] = [
  { idx: -1, title: "停用", icon: burn_stop, visible: true },
  { idx: 24 * 60 * 60, title: "一天", icon: burn_01, visible: true, text: "1D" },
  { idx: 24 * 60 * 60 * 7, title: "一周", icon: burn_07, visible: true, text: "1W" },
  { idx: 24 * 60 * 60 * 30, title: "一个月", icon: burn_30, visible: true, text: "1M" },
  { idx: 24 * 60 * 60 * 30 * 2, title: "二个月", icon: "", text: "2M" },
  { idx: 24 * 60 * 60 * 30 * 3, title: "三个月", icon: "", text: "3M" },
  { idx: 24 * 60 * 60 * 30 * 4, title: "四个月", icon: "", text: "4M" },
  { idx: 24 * 60 * 60 * 30 * 5, title: "五个月", icon: "", text: "5M" },
  { idx: 24 * 60 * 60 * 30 * 6, title: "六个月", icon: "", text: "6M" },
  { idx: 24 * 60 * 60 * 30 * 7, title: "七个月", icon: "", text: "7M" },
  { idx: 24 * 60 * 60 * 30 * 8, title: "八个月", icon: "", text: "8M" },
  { idx: 24 * 60 * 60 * 30 * 9, title: "九个月", icon: "", text: "9M" },
  { idx: 24 * 60 * 60 * 30 * 10, title: "十个月", icon: "", text: "10M" },
  { idx: 24 * 60 * 60 * 30 * 11, title: "十一个月", icon: "", text: "11M" },
  { idx: 24 * 60 * 60 * 30 * 12, title: "十二个月", icon: "", text: "12M" },
];

// 正则
export const PhoneReg = {
  // "+86": /^(13[0-9]|15[012356789]|166|17[3678]|18[0-9]|14[57])[0-9]{8}$/,
  "+86": /^\d{8,11}$/,
  "+81": /^\d{8,11}$/,
  "+1": /^\d{8,11}$/,
};
export type PhonePrefixType = keyof typeof PhoneReg;

export const RegMap = {
  // 必须含有数字和字母，长度为6-20位
  pwd: /^(?=.*[0-9])(?=.*[a-zA-Z]).{6,20}$/,
  // 必须含有数字和字母
  numberLetter: /^(?=.*[0-9])(?=.*[a-zA-Z]).{2,}$/,
  verifyCode: /^\d{6}$/,
  httpReg: /(https?:\/\/[^\s]+)/g,
};

export const receiveMessageMusicMap = {
  music01: receive_message_music01,
  music02: receive_message_music02,
  music03: receive_message_music03,
  music04: receive_message_music04,
  music05: receive_message_music05,
};
export type ReceiveMessageMusicType = keyof typeof receiveMessageMusicMap;

export const colors = {
  A: "#3498db", // 水宝蓝
  B: "#2ecc71", // 翡翠绿
  C: "#e74c3c", // 大红
  D: "#f39c12", // 橙黄
  E: "#1abc9c", // 蓝绿
  F: "#9b59b6", // 紫色
  G: "#27ae60", // 薄荷绿
  H: "#e67e22", // 砖橙
  I: "#34495e", // 暗灰蓝
  J: "#d35400", // 南瓜橙
  K: "#3498db", // 亮蓝
  L: "#2ecc71", // 新翠
  N: "#e74c3c", // 火焰红
  M: "#f39c12", // 高光橙
  O: "#1abc9c", // 海绿
  P: "#9b59b6", // 翠紫
  Q: "#27ae60", // 草绿
  R: "#e67e22", // 橙黄
  S: "#34495e", // 黑蓝
  T: "#d35400", // 橙红
  U: "#3498db", // 蔚蓝
  V: "#2ecc71", // 苍翠
  W: "#e74c3c", // 绛红
  X: "#f39c12", // 金黄
  Y: "#1abc9c", // 蓝绿
  Z: "#9b59b6", // 紫色
};
