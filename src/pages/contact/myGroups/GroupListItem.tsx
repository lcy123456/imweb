import { GroupItem } from "open-im-sdk-wasm/lib/types/entity";

import OIMAvatar from "@/components/OIMAvatar";

const GroupListItem = ({
  source,
  showGroupCard,
}: {
  source: GroupItem;
  showGroupCard: (group: GroupItem) => void;
}) => {
  return (
    <div
      className="flex flex-row px-4 py-3 transition-colors hover:bg-[#f3f9ff]"
      onClick={() => showGroupCard(source)}
    >
      <OIMAvatar src={source?.faceURL} isgroup size={40} />
      <div className="ml-3">
        <p className="text-base">{source.groupName}</p>
        <p className="text-xs text-[#8E9AB0FF]">{source.memberCount}人</p>
      </div>
    </div>
  );
};

export default GroupListItem;
