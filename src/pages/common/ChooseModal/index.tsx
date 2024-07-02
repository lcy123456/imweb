import { CloseOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Upload } from "antd";
import { GroupType } from "open-im-sdk-wasm";
import { ConversationItem } from "open-im-sdk-wasm/lib/types/entity";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import { v4 as uuidV4 } from "uuid";

import { message } from "@/AntdGlobalComp";
import {
  apiConversationFolderCreate,
  apiConversationFolderUpdate,
  apiSetConversation,
  ConversationFolderItem,
} from "@/api/imApi";
import OIMAvatar from "@/components/OIMAvatar";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { useSendMessage } from "@/pages/chat/queryChat/ChatFooter/useSendMessage";
import { ExMessageItem, useConversationStore, useUserStore } from "@/store";
import { feedbackToast, getFileType } from "@/utils/common";
import emitter from "@/utils/events";

import ChooseBox, { ChooseBoxHandle } from "./ChooseBox";
import { CheckListItem } from "./ChooseBox/CheckItem";

export type ChooseModalType =
  | "CRATE_GROUP"
  | "INVITE_TO_GROUP"
  | "KICK_FORM_GROUP"
  | "FORWARD_MESSAGE"
  | "INVITE_TO_CALL"
  | "CRATE_ARCHIVE"
  | "UPDATE_ARCHIVE";

export interface ChooseModalState {
  type: ChooseModalType;
  extraData?: unknown;
}

interface IChooseModalProps {
  state: ChooseModalState;
}

interface UpdateArchiveExtraData {
  archiveList: ConversationItem[];
  folderParams: ConversationFolderItem;
}

const titleMap = {
  CRATE_GROUP: "创建群聊",
  INVITE_TO_GROUP: "邀请好友",
  KICK_FORM_GROUP: "移出成员",
  FORWARD_MESSAGE: "转发消息",
  INVITE_TO_CALL: "邀请通话",
  CRATE_ARCHIVE: "创建分组",
  UPDATE_ARCHIVE: "编辑分组",
};

const showConversationTypes = ["FORWARD_MESSAGE", "CRATE_ARCHIVE", "UPDATE_ARCHIVE"];
const onlyMemberTypes = ["KICK_FORM_GROUP", "INVITE_TO_CALL"];
const showCreateTypes = ["CRATE_GROUP", "CRATE_ARCHIVE"];
const showUpdateTypes = ["UPDATE_ARCHIVE"];

const ChooseModal: ForwardRefRenderFunction<OverlayVisibleHandle, IChooseModalProps> = (
  { state: { type, extraData } },
  ref,
) => {
  const { selfInfo } = useUserStore();
  const { updateConversationFolder, conversationList } = useConversationStore();
  const isCheckInGroup = type === "INVITE_TO_GROUP";
  const notConversation = !showConversationTypes.includes(type);
  const isOnlyMember = onlyMemberTypes.includes(type);
  const isShowCreate = showCreateTypes.includes(type);
  const isShowUpdate = showUpdateTypes.includes(type);

  const chooseBoxRef = useRef<ChooseBoxHandle>(null);
  const [loading, setLoading] = useState(false);
  const [groupBaseInfo, setGroupBaseInfo] = useState({
    groupName: "",
    groupAvatar: "",
  });

  const { sendMessage } = useSendMessage();
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  useEffect(() => {
    if (isOverlayOpen && extraData && (isShowCreate || isShowUpdate)) {
      setTimeout(() => {
        if (isShowCreate) {
          chooseBoxRef.current?.updatePrevCheckList(extraData as CheckListItem[]);
        } else if (isShowUpdate) {
          const { archiveList, folderParams } = extraData as UpdateArchiveExtraData;
          chooseBoxRef.current?.updatePrevCheckList(archiveList);
          setGroupBaseInfo({
            ...groupBaseInfo,
            groupName: folderParams.name,
          });
        }
      }, 100);
    }
  }, [isOverlayOpen]);

  const confirmChoose = async () => {
    if ((isShowCreate || isShowUpdate) && !groupBaseInfo.groupName) {
      feedbackToast({ error: { message: "名称不能为空" } });
      return;
    }
    const choosedList = chooseBoxRef.current?.getCheckedList() ?? [];
    if (!choosedList.length && !isShowUpdate) {
      feedbackToast({ error: { message: "成员不能为空" } });
      return;
    }

    setLoading(true);
    try {
      switch (type) {
        case "CRATE_GROUP":
          await IMSDK.createGroup({
            groupInfo: {
              groupType: GroupType.WorkingGroup,
              groupName: groupBaseInfo.groupName,
              faceURL: groupBaseInfo.groupAvatar,
            },
            memberUserIDs: choosedList.map((item) => item.userID!),
            adminUserIDs: [],
          });
          break;
        case "INVITE_TO_GROUP":
          await IMSDK.inviteUserToGroup({
            groupID: extraData as string,
            userIDList: choosedList.map((item) => item.userID!),
            reason: "",
          });
          break;
        case "KICK_FORM_GROUP":
          await IMSDK.kickGroupMember({
            groupID: extraData as string,
            userIDList: choosedList.map((item) => item.userID!),
            reason: "",
          });
          break;
        case "FORWARD_MESSAGE":
          choosedList.map((item) => {
            sendMessage({
              message: extraData as ExMessageItem,
              recvID: item.userID ?? "",
              groupID: item.groupID ?? "",
            });
          });
          message.success("发送成功！");
          break;
        case "INVITE_TO_CALL":
          emitter.emit("INVITE_CALL_USERID", {
            type: (JSON.parse(extraData as string) as { type: string }).type,
            userIDs: choosedList.map((v) => v.userID!),
          });
          break;
        case "CRATE_ARCHIVE":
          await handleArchive(choosedList);
          break;
        case "UPDATE_ARCHIVE":
          await handleArchive(choosedList, true);
          break;
      }
      closeOverlay();
    } catch (error) {
      feedbackToast({ error });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (choosedList: CheckListItem[], isUpdate = false) => {
    const { archiveList, folderParams } = extraData as UpdateArchiveExtraData;

    // 文件夹
    let folderItem: ConversationFolderItem;
    if (isUpdate) {
      const params = {
        ...folderParams,
        name: groupBaseInfo.groupName,
      };
      await apiConversationFolderUpdate(params);
      folderItem = params;
    } else {
      const res = await apiConversationFolderCreate({
        name: groupBaseInfo.groupName,
      });
      folderItem = res.data;
    }
    updateConversationFolder(folderItem);
    // 归档
    const ids = choosedList.map((v) => v.conversationID || v.groupID || v.userID || "");
    let newConversationList = conversationList.filter((v) =>
      ids.find((j) => v.conversationID.includes(j)),
    );
    let notConversationList: ConversationItem[] = [];
    if (isUpdate) {
      const archiveIds = archiveList.map((v) => v.conversationID);
      newConversationList = newConversationList.filter(
        (v) => !archiveIds.includes(v.conversationID),
      );
      notConversationList = archiveList.filter(
        (v) => !ids.find((j) => v.conversationID.includes(j)),
      );
    }
    // console.log("xxx", newConversationList, notConversationList);
    newConversationList.length > 0 &&
      (await handleSetConversition(folderItem.id, newConversationList));
    notConversationList.length > 0 &&
      (await handleSetConversition(-1, notConversationList));
  };

  const handleSetConversition = async (
    archive_id: number,
    conversations: ConversationItem[],
  ) => {
    const promiseArr = conversations.map((conversation) => {
      const tempAttachedInfo = JSON.parse(conversation.attachedInfo || "{}");
      return apiSetConversation({
        userIDs: [selfInfo.userID],
        conversation: {
          conversationID: conversation.conversationID,
          conversationType: conversation.conversationType,
          groupID: conversation.groupID,
          attachedInfo: JSON.stringify({
            ...tempAttachedInfo,
            archive_id,
          }),
        },
      });
    });
    await Promise.all(promiseArr);
  };

  const resetState = () => {
    chooseBoxRef.current?.resetState();
    setGroupBaseInfo({
      groupName: "",
      groupAvatar: "",
    });
  };

  const customUpload = async ({ file }: { file: File }) => {
    try {
      const {
        data: { url },
      } = await IMSDK.uploadFile({
        name: file.name,
        contentType: getFileType(file.name),
        uuid: uuidV4(),
        file,
      });
      setGroupBaseInfo((prev) => ({ ...prev, groupAvatar: url }));
    } catch (error) {
      feedbackToast({ error: "修改群头像失败！" });
    }
  };

  return (
    <Modal
      title={null}
      footer={null}
      centered
      open={isOverlayOpen}
      closable={false}
      width={580}
      onCancel={closeOverlay}
      destroyOnClose
      afterClose={resetState}
      className="no-padding-modal max-w-[80vw]"
      maskTransitionName=""
    >
      <div>
        <div className="app-no-drag flex h-12 items-center justify-between bg-[var(--gap-text)] px-7">
          <div className="font-sMedium">{titleMap[type]}</div>
          <CloseOutlined
            className="cursor-pointer text-[#8e9ab0]"
            rev={undefined}
            onClick={closeOverlay}
          />
        </div>
        {isShowCreate || isShowUpdate ? (
          <div className="p-4 pb-0">
            <div className="mb-4 flex items-center">
              <div className="min-w-[60px] font-sMedium">{`${
                type === "CRATE_GROUP" ? "群" : "组"
              }名称`}</div>
              <Input
                placeholder="请输入"
                value={groupBaseInfo.groupName}
                onChange={(e) =>
                  setGroupBaseInfo((state) => ({
                    ...state,
                    groupName: e.target.value,
                  }))
                }
              />
            </div>
            {type === "CRATE_GROUP" && (
              <div className="mb-4 flex items-center">
                <div className="min-w-[60px] font-sMedium">群头像</div>
                <div className="flex items-center">
                  <OIMAvatar src={groupBaseInfo.groupAvatar} isgroup size={40} />
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    customRequest={customUpload as any}
                  >
                    <span className="ml-3 cursor-pointer text-xs text-[var(--primary)]">
                      点击修改
                    </span>
                  </Upload>
                </div>
              </div>
            )}
            <div className="flex">
              <div className="min-w-[60px] font-sMedium">
                {`${type === "CRATE_GROUP" ? "群" : "组"}成员`}
              </div>
              <ChooseBox
                className="!m-0 !h-[40vh] flex-1"
                ref={chooseBoxRef}
                notConversation={notConversation}
              />
            </div>
          </div>
        ) : (
          <ChooseBox
            className="!h-[60vh]"
            ref={chooseBoxRef}
            isCheckInGroup={isCheckInGroup}
            notConversation={notConversation}
            showGroupMember={isOnlyMember}
            checkMemberRole={type === "KICK_FORM_GROUP"}
            InviteCallData={type === "INVITE_TO_CALL" ? (extraData as string) : ""}
          />
        )}
        <div className="flex justify-end p-4">
          <Button className="mr-6 bg-[var(--chat-bubble)] px-6" onClick={closeOverlay}>
            取消
          </Button>
          <Button
            className="px-6"
            type="primary"
            loading={loading}
            onClick={confirmChoose}
          >
            确定
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default memo(forwardRef(ChooseModal));
