import { t } from "i18next";
import { MessageType, SessionType } from "open-im-sdk-wasm";

export const GroupSessionTypes = [SessionType.Group, SessionType.WorkingGroup];

export enum _MessageType {
  AdvancedMessage = 117,
  RealCallStart = 1704,
  RealCallEnded = 1703,
}

export enum _CbEvents {
  OnMsgDeleted = "OnMsgDeleted",
}

export const SystemMessageTypes = [
  MessageType.RevokeMessage,
  MessageType.FriendAdded,
  MessageType.GroupCreated,
  MessageType.GroupInfoUpdated,
  MessageType.MemberQuit,
  MessageType.GroupOwnerTransferred,
  MessageType.MemberKicked,
  MessageType.MemberInvited,
  MessageType.MemberEnter,
  MessageType.GroupDismissed,
  MessageType.GroupMemberMuted,
  MessageType.GroupMuted,
  MessageType.GroupCancelMuted,
  MessageType.GroupMemberCancelMuted,
  MessageType.GroupNameUpdated,
  MessageType.BurnMessageChange,
  _MessageType.RealCallStart,
  _MessageType.RealCallEnded,
];

export const TextMessageTypes = [
  MessageType.TextMessage,
  MessageType.AtTextMessage,
  MessageType.QuoteMessage,
  _MessageType.AdvancedMessage,
];

export const FileMessageTypes = [
  MessageType.PictureMessage,
  MessageType.VideoMessage,
  MessageType.FileMessage,
  MessageType.VoiceMessage,
];

export const TokenCodeStatus = {
  // token错误码.
  1501: "登录凭证失效", // TokenExpiredError
  1502: "登录凭证失效", // TokenInvalidError
  1503: "登录凭证失效", // TokenMalformedError
  1504: "登录凭证失效", // TokenNotValidYetError
  1505: "登录凭证失效", // TokenUnknownError
  1506: "登录凭证失效", // TokenKickedError
  1507: "登录凭证失效", // TokenNotExistError
};
export const TokenCodeKey = Object.keys(TokenCodeStatus).map(Number);

export const CodeStatus: {
  [props: number]: string;
} = {
  10000: "网络异常",
  10001: "网络连接超时",
  10005: "网络异常",
  90002: "数据库错误", // redis/mysql等db错误
  90004: "网络异常",
  90007: "数据错误", // 数据错误

  80000: "CallbackError",

  // 通用错误码.
  500: "服务器内部错误", // 服务器内部错误
  1001: "参数异常",
  1002: "权限不足",
  1003: "DuplicateKeyError",
  1004: "记录不存在",

  // 群组错误码.
  1201: "群组ID不存在",
  1202: "群组ID已存在",
  1203: "当前用户不在群组中",
  1204: "群组已解散",
  1205: "GroupTypeNotSupport",
  1206: "已处理该入群请求",

  // 关系链错误码.
  1301: "不能添加自己为好友",
  1302: "被对方拉黑", // 被对方拉黑
  1303: "不是对方的好友",
  1304: "已经是好友关系",

  // 消息错误码.
  1401: "MessageHasReadDisable",
  1402: "群成员被禁言",
  1403: "群被禁言",
  1404: "消息已撤回",

  // 长连接网关错误码.
  1601: "ConnOverMaxNumLimit",
  1602: "ConnArgsErr",

  // S3错误码.
  1701: "文件上传过期",

  ...TokenCodeStatus,
};

export enum PlayType {
  NewMessage = 1,
  Call = 2,
  VoiceMessage = 3,
}

export enum RealCallsType {
  Video = 131,
  Audio = 130,
}

export const CallMessagetTypes = [RealCallsType.Audio, RealCallsType.Video];

export enum RealCallsStatus {
  Call = 1650,
  Reject = 1651,
  Cancel = 1652,
  NotRes = 1653,
  Success = 1669,
  Busy = 1655,
}

export enum RealCallOpStatus {
  Invite = 1654,
  Kick = 1655,
}

export enum CustomBusinessMessageKeyMap {
  VideoKick = "video_kick",
  VideoInvite = "video_invite",
  ModifyMessage = "modify",
  Reload = "reload",
  ReadMsg = "hasReadMSG",
}
