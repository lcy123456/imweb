import { Empty, Spin, Tooltip } from "antd";
import { t } from "i18next";
import { GroupMemberRole } from "open-im-sdk-wasm";
import { GroupMemberItem } from "open-im-sdk-wasm/lib/types/entity";
import { FC, useEffect, useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import { modal } from "@/AntdGlobalComp";
import member_admin from "@/assets/images/chatSetting/member_admin.png";
import member_admin_active from "@/assets/images/chatSetting/member_admin_active.png";
import member_delete from "@/assets/images/chatSetting/member_delete.png";
import OIMAvatar from "@/components/OIMAvatar";
import useGroupMembers from "@/hooks/useGroupMembers";
import { IMSDK } from "@/layout/MainContentWrap";
import { useContactStore, useConversationStore } from "@/store";
import { feedbackToast } from "@/utils/common";

import styles from "./group-setting.module.scss";

interface Props {
  searchKey: string;
}

const GroupMemberList = ({ searchKey }: Props) => {
  const { currentMemberInGroup } = useConversationStore();
  const { fetchState, getMemberData, searchMember } = useGroupMembers();

  const isOwner = useMemo(() => {
    return currentMemberInGroup?.roleLevel === GroupMemberRole.Owner;
  }, [currentMemberInGroup]);
  const isAdmin = useMemo(() => {
    return currentMemberInGroup?.roleLevel === GroupMemberRole.Admin;
  }, [currentMemberInGroup]);

  useEffect(() => {
    searchMember(searchKey);
  }, [searchKey]);

  const showMemberList = useMemo(() => {
    return searchKey ? fetchState.searchMemberList : fetchState.groupMemberList;
  }, [searchKey, fetchState]);

  const endReached = () => {
    getMemberData();
  };

  return (
    <div className="h-full py-2.5">
      {showMemberList.length === 0 ? (
        <Empty
          className="flex h-full flex-col items-center justify-center"
          description={t("empty.noSearchResults")}
        />
      ) : (
        <Virtuoso
          className="h-full overflow-x-hidden"
          data={showMemberList}
          endReached={endReached}
          itemContent={(_, member) => (
            <MemberItem member={member} isOwner={isOwner} isAdmin={isAdmin} />
          )}
        />
      )}
    </div>
  );
};

export default GroupMemberList;

interface IMemberItemProps {
  member: GroupMemberItem;
  isOwner: boolean;
  isAdmin: boolean;
}

interface ToolItem {
  id: number;
  title: string;
  icon: string;
}

const MemberItem: FC<IMemberItemProps> = ({ member, isOwner, isAdmin }) => {
  const { friendList } = useContactStore();
  const { roleLevel, groupID, userID } = member;
  const memberIsOwner = roleLevel === GroupMemberRole.Owner;
  const memberIsAdmin = roleLevel === GroupMemberRole.Admin;

  const [loading, setLoading] = useState(false);

  const toolList: ToolItem[] = useMemo(() => {
    const delete_item = {
      id: 20,
      title: "移除",
      icon: member_delete,
    };
    if (memberIsOwner || (!isOwner && !isAdmin)) return [];
    else if (isOwner) {
      return [
        {
          id: 10,
          title: `${memberIsAdmin ? "取消" : "设为"}管理员`,
          icon: memberIsAdmin ? member_admin_active : member_admin,
        },
        delete_item,
      ];
    } else if (isAdmin && !memberIsAdmin) {
      return [delete_item];
    }
    return [];
  }, [isOwner, isAdmin, memberIsOwner, memberIsAdmin]);

  const showName = useMemo(() => {
    const friend = friendList.find((v) => v.userID === member.userID);
    return friend?.remark || member.nickname;
  }, [member.userID, friendList]);

  const handleMember = (v: ToolItem) => {
    switch (v.id) {
      case 10:
        handleAdmin();
        break;
      case 20:
        handleDelete();
    }
  };

  const handleAdmin = async () => {
    setLoading(true);
    const params = {
      groupID,
      userID,
      roleLevel: memberIsAdmin ? GroupMemberRole.Nomal : GroupMemberRole.Admin,
    };
    await IMSDK.setGroupMemberRoleLevel(params);
    setLoading(false);
  };
  const handleDelete = () => {
    modal.confirm({
      title: "移除成员",
      content: `确定移除成员${member.nickname}吗？`,
      onOk: async () => {
        try {
          await IMSDK.kickGroupMember({
            groupID,
            reason: "",
            userIDList: [member.userID],
          });
        } catch (error) {
          feedbackToast({ error, msg: "移除失败" });
        }
      },
    });
  };

  return (
    <Spin spinning={loading}>
      <div className={String(styles["list-member-item"])}>
        <div
          className="flex cursor-pointer items-center overflow-hidden"
          onClick={() => window.userClick(member.userID, member.groupID)}
        >
          <OIMAvatar src={member.faceURL} text={showName} size={40} />
          <div className="ml-3 flex items-center">
            <div className="max-w-[120px] truncate">{showName}</div>
            {(memberIsOwner || memberIsAdmin) && (
              <span
                className={`ml-2 rounded border px-1 text-xs text-[#0289FA] ${
                  memberIsOwner
                    ? "border-[#FF9831] text-[#FF9831]"
                    : "border-[#0289FA] text-[#0289FA]"
                }`}
              >
                {memberIsOwner ? "群主" : "管理员"}
              </span>
            )}
          </div>
        </div>
        <div className={String(styles["tool-view"])}>
          {toolList?.map((v) => {
            return (
              <div
                className={String(styles["tool-item"])}
                key={v.id}
                onClick={() => handleMember(v)}
              >
                <Tooltip title={v.title}>
                  <img src={v.icon} alt="" width={40} />
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>
    </Spin>
  );
};
