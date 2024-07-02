import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import { t } from "i18next";
import { useConversationStore, useUserStore } from "@/store";
import { useContactStore } from "@/store/contact";
import {
  burnMenuList,
  CallMessagetTypes,
  CodeStatus,
  RealCallsType,
  _MessageType,
} from "@/constants";

import { secondsToTime } from "./common";
import {
  AtTextElem,
  ConversationItem,
  MessageItem,
  PublicUserItem,
} from "open-im-sdk-wasm/lib/types/entity";
import { GroupAtType, MessageType, SessionType } from "open-im-sdk-wasm";
import { isThisYear } from "date-fns";

dayjs.extend(calendar);
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

dayjs.updateLocale("en", {
  calendar: {
    sameDay: "HH:mm",
    nextDay: "[tomorrow]",
    nextWeek: "dddd",
    lastDay: "[yesterday] HH:mm",
    lastWeek: "dddd HH:mm",
    sameElse: "YYYY/M/D",
  },
});
dayjs.updateLocale("zh-cn", {
  calendar: {
    sameDay: "HH:mm",
    nextDay: "[明天]",
    nextWeek: "dddd",
    lastDay: "[昨天] HH:mm",
    lastWeek: "dddd HH:mm",
    sameElse: "YYYY/M/D",
  },
});

export const AddFriendQrCodePrefix = "io.openim.app/addFriend/";
export const AddGroupQrCodePrefix = "io.openim.app/joinGroup/";

const linkWrap = ({
  userID,
  groupID,
  name,
}: {
  userID: string;
  groupID: string;
  name: string;
}) => {
  return `<span class='link-el' onclick='userClick("${userID}","${groupID}")'>${name}</span>`;
};

export const systemNotificationFormat = (msg: MessageItem) => {
  const currentConversation = useConversationStore.getState().currentConversation;
  const selfID = useUserStore.getState().selfInfo.userID;
  const { friendList } = useContactStore.getState();
  const friend = friendList.find((v) => v.userID === msg.sendID);
  const getName = (user: PublicUserItem) => {
    return user.userID === selfID ? t("you") : user.nickname;
  };
  switch (msg.contentType) {
    case MessageType.FriendAdded:
      return t("messageDescription.alreadyFriendMessage");
    case MessageType.RevokeMessage:
      let revoker, operator, isAdminRevoke, revokerID;
      try {
        const data = JSON.parse(msg.notificationElem.detail);
        revokerID = data.revokerID;
        if (revokerID === selfID) {
          revoker = t("you");
        } else if (isGroupSession(currentConversation?.conversationType)) {
          revoker = friend?.remark || data.revokerNickname;
        } else {
          revoker = currentConversation?.showName;
        }
        // revoker =
        //   revokerID === selfID
        //     ? t("you")
        //     : !isGroupSession(currentConversation?.conversationType)
        //     ? currentConversation?.showName
        //     : data.revokerNickname;
        isAdminRevoke = data.revokerID !== data.sourceMessageSendID;
        operator = data.sourceMessageSendNickname;
      } catch (error) {
        isAdminRevoke = msg.sendID !== selfID;
        operator = t("you");
        revoker = isAdminRevoke ? msg.senderNickname : operator;
      }
      if (isAdminRevoke) {
        return t("messageDescription.advanceRevokeMessage", {
          operator: linkWrap({
            userID: msg.sendID,
            groupID: msg.groupID,
            name: operator,
          }),
          revoker: linkWrap({
            userID: revokerID,
            groupID: msg.groupID,
            name: revoker,
          }),
        });
      }
      return t("messageDescription.revokeMessage", {
        revoker: linkWrap({
          userID: revokerID,
          groupID: msg.groupID,
          name: revoker,
        }),
      });
    case MessageType.GroupCreated:
      const groupCreatedDetail = JSON.parse(msg.notificationElem.detail);
      const groupCreatedUser = groupCreatedDetail.opUser;
      return t("messageDescription.createGroupMessage", {
        creator: linkWrap({
          userID: groupCreatedUser.userID,
          groupID: msg.groupID,
          name: getName(groupCreatedUser),
        }),
      });
    case MessageType.GroupInfoUpdated:
      const groupUpdateDetail = JSON.parse(msg.notificationElem.detail);
      const groupUpdateUser = groupUpdateDetail.opUser;
      return t("messageDescription.updateGroupInfoMessage", {
        operator: linkWrap({
          userID: groupUpdateUser.userID,
          groupID: msg.groupID,
          name: getName(groupUpdateUser),
        }),
      });
    case MessageType.GroupOwnerTransferred:
      const transferDetails = JSON.parse(msg.notificationElem.detail);
      const transferOpUser = transferDetails.opUser;
      const newOwner = transferDetails.newGroupOwner;
      return t("messageDescription.transferGroupMessage", {
        owner: linkWrap({
          userID: transferOpUser.userID,
          groupID: msg.groupID,
          name: getName(transferOpUser),
        }),
        newOwner: linkWrap({
          userID: newOwner.userID,
          groupID: msg.groupID,
          name: getName(newOwner),
        }),
      });
    case MessageType.MemberQuit:
      const quitDetails = JSON.parse(msg.notificationElem.detail);
      const quitUser = quitDetails.quitUser;
      return t("messageDescription.quitGroupMessage", {
        name: linkWrap({
          userID: quitUser.userID,
          groupID: msg.groupID,
          name: getName(quitUser),
        }),
      });
    case MessageType.MemberInvited:
      const inviteDetails = JSON.parse(msg.notificationElem.detail);
      const inviteOpUser = inviteDetails.opUser;
      const invitedUserList = inviteDetails.invitedUserList ?? [];
      let inviteStr = "";
      invitedUserList.find(
        (user: any, idx: number) =>
          (inviteStr += `${linkWrap({
            userID: user.userID,
            groupID: msg.groupID,
            name: getName(user),
          })} `) && idx > 3,
      );
      return t("messageDescription.invitedToGroupMessage", {
        operator: linkWrap({
          userID: inviteOpUser.userID,
          groupID: msg.groupID,
          name: getName(inviteOpUser),
        }),
        invitedUser: `${inviteStr}${invitedUserList.length > 3 ? "..." : ""}`,
      });
    case MessageType.MemberKicked:
      const kickDetails = JSON.parse(msg.notificationElem.detail);
      const kickOpUser = kickDetails.opUser;
      const kickdUserList = kickDetails.kickedUserList ?? [];
      let kickStr = "";
      kickdUserList.find(
        (user: any, idx: number) =>
          (kickStr += `${linkWrap({
            userID: user.userID,
            groupID: msg.groupID,
            name: getName(user),
          })} `) && idx > 3,
      );
      return t("messageDescription.kickInGroupMessage", {
        operator: linkWrap({
          userID: kickOpUser.userID,
          groupID: msg.groupID,
          name: getName(kickOpUser),
        }),
        kickedUser: `${kickStr}${kickdUserList.length > 3 ? "..." : ""}`,
      });
    case MessageType.MemberEnter:
      const enterDetails = JSON.parse(msg.notificationElem.detail);
      const enterUser = enterDetails.entrantUser;
      return t("messageDescription.joinGroupMessage", {
        name: linkWrap({
          userID: enterUser.userID,
          groupID: msg.groupID,
          name: getName(enterUser),
        }),
      });
    case MessageType.GroupDismissed:
      const dismissDetails = JSON.parse(msg.notificationElem.detail);
      const dismissUser = dismissDetails.opUser;
      return t("messageDescription.disbanedGroupMessage", {
        operator: linkWrap({
          userID: dismissUser.userID,
          groupID: msg.groupID,
          name: getName(dismissUser),
        }),
      });
    case MessageType.GroupMuted:
      const GROUPMUTEDDetails = JSON.parse(msg.notificationElem.detail);
      const groupMuteOpUser = GROUPMUTEDDetails.opUser;
      return t("messageDescription.allMuteMessage", {
        operator: linkWrap({
          userID: groupMuteOpUser.userID,
          groupID: msg.groupID,
          name: getName(groupMuteOpUser),
        }),
      });
    case MessageType.GroupCancelMuted:
      const GROUPCANCELMUTEDDetails = JSON.parse(msg.notificationElem.detail);
      const groupCancelMuteOpUser = GROUPCANCELMUTEDDetails.opUser;
      return t("messageDescription.cancelAllMuteMessage", {
        operator: linkWrap({
          userID: groupCancelMuteOpUser.userID,
          groupID: msg.groupID,
          name: getName(groupCancelMuteOpUser),
        }),
      });
    case MessageType.GroupMemberMuted:
      const gmMutedDetails = JSON.parse(msg.notificationElem.detail);
      const muteTime = secondsToTime(gmMutedDetails.mutedSeconds);
      return t("messageDescription.singleMuteMessage", {
        operator: linkWrap({
          userID: gmMutedDetails.opUser.userID,
          groupID: msg.groupID,
          name: getName(gmMutedDetails.opUser),
        }),
        name: linkWrap({
          userID: gmMutedDetails.mutedUser.userID,
          groupID: msg.groupID,
          name: getName(gmMutedDetails.mutedUser),
        }),
        muteTime,
      });
    case MessageType.GroupMemberCancelMuted:
      const gmcMutedDetails = JSON.parse(msg.notificationElem.detail);
      return t("messageDescription.cancelSingleMuteMessage", {
        operator: linkWrap({
          userID: gmcMutedDetails.opUser.userID,
          groupID: msg.groupID,
          name: getName(gmcMutedDetails.opUser),
        }),
        name: linkWrap({
          userID: gmcMutedDetails.mutedUser.userID,
          groupID: msg.groupID,
          name: getName(gmcMutedDetails.mutedUser),
        }),
      });
    case MessageType.GroupAnnouncementUpdated:
      const groupAnnouncementDetails = JSON.parse(msg.notificationElem.detail);
      return t("messageDescription.updateGroupAnnouncementMessage", {
        operator: linkWrap({
          userID: groupAnnouncementDetails.opUser.userID,
          groupID: msg.groupID,
          name: getName(groupAnnouncementDetails.opUser),
        }),
      });
    case MessageType.GroupNameUpdated:
      const groupNameDetails = JSON.parse(msg.notificationElem.detail);
      return t("messageDescription.updateGroupNameMessage", {
        operator: linkWrap({
          userID: groupNameDetails.opUser.userID,
          groupID: msg.groupID,
          name: getName(groupNameDetails.opUser),
        }),
        name: groupNameDetails.group.groupName,
      });
    case MessageType.BurnMessageChange: {
      const { revokerID, revokerRole, revokeTime, revokerNickname } = JSON.parse(
        msg.notificationElem.detail,
      );
      const timeText = burnMenuList.find((v) => v.idx === revokeTime)?.title || "";
      // return t("messageDescription.burnReadStatus", {
      //   status: revokerRole ? t("on") : t("off"),
      // });
      const name = revokerID === selfID ? t("you") : revokerNickname || "";
      const text =
        revokerRole === 1
          ? `已设置自动删除 ${timeText} 前发送的消息`
          : "已停用自动删除消息";
      return `${name}${text}`;
    }
    case MessageType.OANotification:
      const customNotify = JSON.parse(msg.notificationElem.detail);
      return customNotify.text;
    case _MessageType.RealCallStart as unknown as MessageType:
      const realCallData = JSON.parse(msg?.notificationElem?.detail || "{}");
      const { type } = realCallData;
      const name = msg.sendID === selfID ? t("you") : msg.senderNickname;
      const mediaText = type === RealCallsType.Audio ? "语音" : "视频";
      return `${name}发起${mediaText}通话`;
    case _MessageType.RealCallEnded as unknown as MessageType: {
      // const customNoti = JSON.parse(msg.notificationElem.detail);
      const realCallData = JSON.parse(msg?.notificationElem?.detail || "{}");
      const { type } = realCallData;
      const mediaText = type === RealCallsType.Audio ? "语音" : "视频";
      return `${mediaText}通话已结束`;
    }
    default:
      return "";
  }
};

export const formatConversionTime = (timestemp: number): string => {
  if (!timestemp) return "";

  const fromNowStr = dayjs(timestemp).fromNow();

  if (fromNowStr.includes(t("second"))) {
    return t("date.justNow");
  } else if (fromNowStr.includes(t("minute"))) {
    return fromNowStr;
  }
  return dayjs(timestemp).calendar();
};

export const formatOffLineTime = (timestemp: number): string => {
  // if (!timestemp) return "";

  const fromNowStr = dayjs(timestemp).fromNow();
  if (fromNowStr.includes(t("second"))) {
    return t("date.justNow");
  } else if (fromNowStr.includes(t("minute")) || fromNowStr.includes(t("hour"))) {
    return fromNowStr;
  }
  return dayjs(timestemp).calendar();
};

export const formatMessageTime = (timestemp: number, keepYearMonth = false): string => {
  if (!timestemp) return "";

  if (keepYearMonth) {
    const keepYear = !isThisYear(timestemp);
    return dayjs(timestemp).format(`${keepYear ? "YYYY-" : ""}MM-DD HH:mm`);

    // if (!isRecent && !keepYear) {
    //   return dayjs(timestemp).format("M月D日 HH:mm");
    // }

    // return dayjs(timestemp).calendar();
  }
  return dayjs(timestemp).format("HH:mm");
};

export const formatMessageByType = (message: MessageItem, formatType = ""): string => {
  const selfUserID = useUserStore.getState().selfInfo.userID;
  const { friendList } = useContactStore.getState();
  const isSelf = (id: string) => id === selfUserID;
  const getName = (user: PublicUserItem) => {
    return user.userID === selfUserID ? t("you") : user.nickname;
  };
  switch (message.contentType) {
    case MessageType.TextMessage:
      return message.textElem?.content;
    case MessageType.AtTextMessage:
      return formatAtText(message.atTextElem, formatType);
    case _MessageType.AdvancedMessage as unknown as MessageType:
      return message.advancedTextElem.text;
    case MessageType.PictureMessage:
      return t("messageDescription.imageMessage");
    case MessageType.VideoMessage:
      return t("messageDescription.videoMessage");
    case MessageType.VoiceMessage:
      return t("messageDescription.voiceMessage");
    case MessageType.LocationMessage:
      const locationInfo = JSON.parse(message.locationElem.description);
      return t("messageDescription.locationMessage", { location: locationInfo.name });
    case MessageType.CardMessage:
      return t("messageDescription.cardMessage");
    case MessageType.MergeMessage:
      return t("messageDescription.mergeMessage");
    case MessageType.FileMessage:
      return t("messageDescription.fileMessage", { file: message.fileElem.fileName });
    case MessageType.RevokeMessage:
      const data = JSON.parse(message.notificationElem?.detail || "{}");
      const revokerID = data.revokerID;
      // const revoker = isSelf(revokerID) ? t("you") : data.revokerNickname;
      let revoker = "";
      if (isSelf(revokerID)) {
        revoker = t("you");
      } else {
        const friend = friendList.find((v) => v.userID === message.sendID);
        revoker = friend?.remark || data.revokerNickname;
      }
      const isAdminRevoke = data.revokerID !== data.sourceMessageSendID;
      if (isAdminRevoke) {
        return t("messageDescription.advanceRevokeMessage", {
          operator: data.sourceMessageSendNickname,
          revoker,
        });
      }
      return t("messageDescription.revokeMessage", { revoker });
    case MessageType.CustomMessage:
      const customData = JSON.parse(message.customElem?.data || "{}");
      if (CallMessagetTypes.includes(customData.type)) {
        const typeText = customData.type === RealCallsType.Audio ? "语音" : "视频";
        return `[${typeText}通话]`;
      }
      return t("messageDescription.customMessage");
    case MessageType.QuoteMessage:
      return message.quoteElem.text || t("messageDescription.quoteMessage");
    case MessageType.FaceMessage:
      return t("messageDescription.faceMessage");
    case MessageType.FriendAdded:
      return t("messageDescription.alreadyFriendMessage");
    case MessageType.MemberEnter:
      const enterDetails = JSON.parse(message.notificationElem.detail);
      const enterUser = enterDetails.entrantUser;
      return t("messageDescription.joinGroupMessage", {
        name: getName(enterUser),
      });
    case MessageType.GroupCreated:
      const groupCreatedDetail = JSON.parse(message.notificationElem.detail);
      const groupCreatedUser = groupCreatedDetail.opUser;
      return t("messageDescription.createGroupMessage", {
        creator: getName(groupCreatedUser),
      });
    case MessageType.MemberInvited:
      const inviteDetails = JSON.parse(message.notificationElem.detail);
      const inviteOpUser = inviteDetails.opUser;
      const invitedUserList = inviteDetails.invitedUserList ?? [];
      let inviteStr = "";
      invitedUserList.find(
        (user: any, idx: number) => (inviteStr += `${getName(user)} `) && idx > 3,
      );
      return t("messageDescription.invitedToGroupMessage", {
        operator: getName(inviteOpUser),
        invitedUser: `${inviteStr}${invitedUserList.length > 3 ? "..." : ""}`,
      });
    case MessageType.MemberKicked:
      const kickDetails = JSON.parse(message.notificationElem.detail);
      const kickOpUser = kickDetails.opUser;
      const kickdUserList = kickDetails.kickedUserList ?? [];
      let kickStr = "";
      kickdUserList.find(
        (user: any, idx: number) => (kickStr += `${getName(user)} `) && idx > 3,
      );
      return t("messageDescription.kickInGroupMessage", {
        operator: getName(kickOpUser),
        kickedUser: `${kickStr}${kickdUserList.length > 3 ? "..." : ""}`,
      });
    case MessageType.MemberQuit:
      const quitDetails = JSON.parse(message.notificationElem.detail);
      const quitUser = quitDetails.quitUser;
      return t("messageDescription.quitGroupMessage", {
        name: getName(quitUser),
      });
    case MessageType.GroupInfoUpdated:
      const groupUpdateDetail = JSON.parse(message.notificationElem.detail);
      const groupUpdateUser = groupUpdateDetail.opUser;
      return t("messageDescription.updateGroupInfoMessage", {
        operator: getName(groupUpdateUser),
      });
    case MessageType.GroupOwnerTransferred:
      const transferDetails = JSON.parse(message.notificationElem.detail);
      const transferOpUser = transferDetails.opUser;
      const newOwner = transferDetails.newGroupOwner;
      return t("messageDescription.transferGroupMessage", {
        owner: getName(transferOpUser),
        newOwner: getName(newOwner),
      });
    case MessageType.GroupDismissed:
      const dismissDetails = JSON.parse(message.notificationElem.detail);
      const dismissUser = dismissDetails.opUser;
      return t("messageDescription.disbanedGroupMessage", {
        operator: getName(dismissUser),
      });
    case MessageType.GroupMuted:
      const GROUPMUTEDDetails = JSON.parse(message.notificationElem.detail);
      const groupMuteOpUser = GROUPMUTEDDetails.opUser;
      return t("messageDescription.allMuteMessage", {
        operator: getName(groupMuteOpUser),
      });
    case MessageType.GroupCancelMuted:
      const GROUPCANCELMUTEDDetails = JSON.parse(message.notificationElem.detail);
      const groupCancelMuteOpUser = GROUPCANCELMUTEDDetails.opUser;
      return t("messageDescription.cancelAllMuteMessage", {
        operator: getName(groupCancelMuteOpUser),
      });
    case MessageType.GroupMemberMuted:
      const gmMutedDetails = JSON.parse(message.notificationElem.detail);
      const muteTime = secondsToTime(gmMutedDetails.muteTime);
      return t("messageDescription.singleMuteMessage", {
        operator: getName(gmMutedDetails.opUser),
        name: getName(gmMutedDetails.mutedUser),
        muteTime,
      });
    case MessageType.GroupMemberCancelMuted:
      const gmcMutedDetails = JSON.parse(message.notificationElem.detail);
      return t("messageDescription.cancelSingleMuteMessage", {
        operator: getName(gmcMutedDetails.opUser),
        name: getName(gmcMutedDetails.mutedUser),
      });
    case MessageType.GroupAnnouncementUpdated:
      const groupAnnouncementDetails = JSON.parse(message.notificationElem.detail);
      return t("messageDescription.updateGroupAnnouncementMessage", {
        operator: getName(groupAnnouncementDetails.opUser),
      });
    case MessageType.GroupNameUpdated:
      const groupNameDetails = JSON.parse(message.notificationElem.detail);
      return t("messageDescription.updateGroupNameMessage", {
        operator: getName(groupNameDetails.opUser),
        name: groupNameDetails.group.groupName,
      });
    case MessageType.OANotification:
      const customNoti = JSON.parse(message.notificationElem.detail);
      return customNoti.text;
    case MessageType.BurnMessageChange:
      const { revokerRole } = JSON.parse(message.notificationElem.detail);
      return t("messageDescription.burnReadStatus", {
        status: revokerRole === 1 ? t("on") : t("off"),
      });
    case _MessageType.RealCallStart as unknown as MessageType:
    case _MessageType.RealCallEnded as unknown as MessageType: {
      const realCallData = JSON.parse(message?.notificationElem?.detail || "{}");
      const { type } = realCallData;
      const mediaText = type === RealCallsType.Audio ? "语音" : "视频";
      return `[${mediaText}通话]`;
    }
    default:
      return "";
  }
};
export const formatGroupAtText = (conversation: ConversationItem) => {
  switch (conversation.groupAtType) {
    case GroupAtType.AtAll:
      return "[所有人]";
    case GroupAtType.AtMe:
      return "[有人@你]";
    case GroupAtType.AtAllAtMe:
      return "[有人@你]";
    case GroupAtType.AtGroupNotice:
      return "[群公告]";
    default:
      return "";
  }
};

export let initStoreTimer: NodeJS.Timeout;
export const initStore = () => {
  const { getSelfInfoByReq, getAppConfigByReq } = useUserStore.getState();
  const {
    getFriendListByReq,
    getBlackListByReq,
    getGroupListByReq,
    getRecvFriendApplicationListByReq,
    getRecvGroupApplicationListByReq,
    getSendFriendApplicationListByReq,
    getSendGroupApplicationListByReq,
  } = useContactStore.getState();
  const { getConversationListByReq, getUnReadCountByReq, getConversationFolder } =
    useConversationStore.getState();

  getSelfInfoByReq();
  getAppConfigByReq();

  getFriendListByReq();
  getBlackListByReq();
  getGroupListByReq();
  getRecvFriendApplicationListByReq();
  getRecvGroupApplicationListByReq();
  getSendFriendApplicationListByReq();
  getSendGroupApplicationListByReq();

  getConversationListByReq();
  getUnReadCountByReq();
  getConversationFolder();

  clearTimeout(initStoreTimer);
  initStoreTimer = setTimeout(initStore, 60 * 60 * 1000);
};

export const conversationSort = (conversationList: ConversationItem[]) => {
  const arr: string[] = [];
  const filterArr = conversationList.filter(
    (c) => !arr.includes(c.conversationID) && arr.push(c.conversationID),
  );
  filterArr.sort((a, b) => {
    if (a.isPinned === b.isPinned) {
      const aCompare =
        a.draftTextTime > a.latestMsgSendTime ? a.draftTextTime : a.latestMsgSendTime;
      const bCompare =
        b.draftTextTime > b.latestMsgSendTime ? b.draftTextTime : b.latestMsgSendTime;
      if (aCompare > bCompare) {
        return -1;
      } else if (aCompare < bCompare) {
        return 1;
      } else {
        return 0;
      }
    } else if (a.isPinned && !b.isPinned) {
      return -1;
    } else {
      return 1;
    }
  });
  return filterArr;
};

export const isGroupSession = (sessionType?: SessionType) =>
  sessionType === SessionType.WorkingGroup;

export const formatAtText = (atel: AtTextElem, type = "") => {
  const { friendList } = useContactStore.getState();
  let mstr = atel.text;
  const pattern = /@\d+\s/g;
  const arr = mstr.match(pattern);
  const atUsersInfo = atel.atUsersInfo ?? [];
  const currentGrouoID = useConversationStore.getState().currentConversation?.groupID;
  arr?.map((match) => {
    const member = atUsersInfo.find((user) => user.atUserID === match.slice(1, -1));
    if (member) {
      const friend = friendList.find((v) => v.userID === member.atUserID);
      const showName = friend?.remark || member.groupNickname;
      let newVal = `@${showName}`;
      switch (type) {
        case "linkHtml":
          newVal = linkWrap({
            userID: member.atUserID,
            name: `@${showName}`,
            groupID: currentGrouoID!,
          });
          break;
        case "atHtml":
          newVal = formatAtNode({
            userID: member.atUserID,
            nickname: showName,
          }).outerHTML;
          break;
      }
      mstr = mstr.replace(match, newVal);
    }
  });
  return mstr;
};

export const formatAtNode = (params: {
  userID: string;
  nickname: string;
  nameUrl?: string;
}) => {
  const { userID, nickname, nameUrl } = params;
  const span = document.createElement("span");
  span.setAttribute("class", "at-el");
  span.setAttribute("contenteditable", "false");
  span.setAttribute("data-id", userID);
  span.setAttribute("data-name", nickname);
  span.textContent = `@${nickname}`;
  return span;
};

export const checkCodeStatus = (errCode: number): string => {
  return CodeStatus[errCode];
};

// 判断是否本周，本月，上一月，上上一月。。。

// 判断是否本周
export const isSameWeek = (date1: Date, date2: Date) => {
  const weekStart = getWeekStartDate(date1);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  return date2 >= weekStart && date2 <= weekEnd;
};

// 获取指定日期所在周的起始日期（周一）
const getWeekStartDate = (date: Date) => {
  const dayOfWeek = date.getDay();
  const offset = 1 - dayOfWeek; // 偏移量（使星期一为起始日期）
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
};

// 判断两个日期是否属于同一月
function isSameMonth(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth()
  );
}

// 根据毫秒数转换成年月
function formatMillisecondsToYearMonth(milliseconds: number): string {
  const date = new Date(milliseconds);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const yearMonth = `${year}年 ${month < 10 ? "0" + month : month}月`;
  return yearMonth;
}

// 根据判断返回相应的文字 如本周内就返回本周
// 获取当前时间戳
let currentTimestamp: number;
// 将时间戳转换为本地时间
let currentLocalDate: Date;
// 获取消息的时间戳
// 将时间戳转换为本地时间
let createLocalDate: Date;
export const timeText = (createTime: number) => {
  currentTimestamp = new Date().getTime();
  currentLocalDate = new Date(currentTimestamp);

  createLocalDate = new Date(createTime);

  if (isSameWeek(currentLocalDate, createLocalDate)) {
    return "本周";
  } else if (isSameMonth(currentLocalDate, createLocalDate)) {
    return "本月";
  } else {
    return formatMillisecondsToYearMonth(createTime);
  }
};

export const idsGetConversationID = (message: MessageItem): string => {
  const { sessionType, sendID, recvID, groupID } = message;
  const min = Math.min(+sendID, +recvID);
  const max = Math.max(+sendID, +recvID);
  switch (sessionType) {
    case SessionType.Single:
      return `si_${min}_${max}`;
    case SessionType.WorkingGroup:
      return `sg_${groupID}`;
    default:
      return "";
  }
};

export const isEditMessage = (message: MessageItem) => {
  const { ex } = message;
  const { type } = JSON.parse(ex || "{}") as { type?: string };
  return type === "edit";
};

export const isLikeMessage = (message: MessageItem) => {
  const { ex } = message;
  const { giveLike } = JSON.parse(ex || "{}") as { giveLike?: [] };
  return Boolean(giveLike);
};

export const formatMessageFileUrl = (url: string) => {
  if (!url || /blob|http(s?)|base64|ic_avatar/.test(url)) return url;
  const { thirdConfig } = useUserStore.getState();
  return thirdConfig?.oss?.url + url;
};
