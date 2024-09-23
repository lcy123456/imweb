import { LeftOutlined, SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { memo, useState } from "react";

import invite_header from "@/assets/images/chatSetting/invite_header.png";
import search from "@/assets/images/chatSetting/search.png";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import { useConversationStore } from "@/store";
import emitter from "@/utils/events";

const GroupMemberListHeader = ({
  back2Settings,
  onModify,
}: {
  back2Settings: () => void;
  onModify: (text: string) => void;
}) => {
  const inviteToGroup = () => {
    emitter.emit("OPEN_CHOOSE_MODAL", {
      type: "INVITE_TO_GROUP",
      extraData: useConversationStore.getState().currentGroupInfo?.groupID,
    });
  };

  // 搜索群成员
  const [isQuery, setIsQuery] = useState<boolean>(false);
  const { isNomal } = useCurrentMemberRole();

  const handleSearch = () => {
    setIsQuery(true);
  };
  const handleCancellation = () => {
    setIsQuery(false);
    onModify("");
  };

  const changeSearch = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onModify(e.target.value);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <LeftOutlined
          className="mr-2 !text-[var(--base-black)]"
          rev={undefined}
          onClick={back2Settings}
        />
        <div>群成员列表</div>
      </div>
      {isQuery ? (
        <div className="mr-4 flex items-center">
          <Input
            placeholder="搜索"
            classNames={{ input: "bg-[var(--gap-text)] css-12bzmfv" }}
            className="css-12bzmfv w-36 rounded-2xl border-[var(--sub-text)] bg-[var(--gap-text)] px-2.5 py-[2px] text-sm font-normal"
            prefix={<SearchOutlined />}
            onChange={changeSearch}
          />
          <span
            className="mx-3 cursor-pointer text-sm font-normal text-[var(--primary)]"
            onClick={handleCancellation}
          >
            取消
          </span>
        </div>
      ) : (
        <div className="mr-4 flex items-center">
          {!isNomal && (
            <img
              className="mr-3 cursor-pointer"
              width={18}
              src={invite_header}
              alt=""
              onClick={inviteToGroup}
            />
          )}
          <img
            className="mr-3 cursor-pointer"
            width={18}
            src={search}
            alt=""
            onClick={handleSearch}
          />
        </div>
      )}
    </div>
  );
};

export default memo(GroupMemberListHeader);
