import clsx from "clsx";
import { useCallback } from "react";

import { useContactStore } from "@/store";
import { formatContacts } from "@/utils/common";
import emitter from "@/utils/events";

import AlphabetIndex from "./AlphabetIndex";
import FriendListItem from "./FriendListItem";

export const MyFriends = () => {
  const friendList = useContactStore((state) => state.friendList);

  const { dataList, indexList } = formatContacts(friendList);

  const showUserCard = useCallback((userID: string) => {
    emitter.emit("OPEN_USER_CARD", {
      userID,
    });
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="m-5.5 text-base font-extrabold">我的好友</div>
      <div className="flex-1 overflow-hidden">
        <AlphabetIndex indexList={indexList} />
        <div id="alphabet-wrap" className="h-full overflow-y-auto overflow-x-hidden">
          {dataList.map((friends, index) => {
            return (
              <div key={indexList[index]} className={String(Boolean(index) && "mt-4")}>
                <div
                  id={`letter${indexList[index]}`}
                  className={clsx("my-alphabet px-4 text-sm text-[#8E9AB0FF]")}
                >
                  {indexList[index]}
                </div>
                <div className="mb-3 h-px w-full bg-[#E8EAEFFF] bg-white" />
                {friends.map((friend) => (
                  <FriendListItem
                    key={friend.userID}
                    friend={friend}
                    showUserCard={showUserCard}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
