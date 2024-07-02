import { FriendUserItem } from "open-im-sdk-wasm/lib/types/entity";
import { useMemo } from "react";

import OIMAvatar from "@/components/OIMAvatar";

const FriendListItem = ({
  friend,
  showUserCard,
}: {
  friend: FriendUserItem;
  showUserCard: (userID: string) => void;
}) => {
  const showName = useMemo(() => {
    return friend.remark || friend.nickname;
  }, [friend.remark, friend.nickname]);

  return (
    <div
      className="flex items-center px-4 py-2 transition-colors hover:bg-[#f3f9ff]"
      onClick={() => showUserCard(friend.userID)}
    >
      <OIMAvatar src={friend.faceURL} text={showName} size={38} />
      <p className="ml-3 text-sm">{showName}</p>
    </div>
  );
};

export default FriendListItem;
