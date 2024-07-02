import { MessageItem } from "open-im-sdk-wasm/lib/types/entity";

declare namespace API {
  declare namespace Login {
    enum UsedFor {
      Register = 1,
      Modify = 2,
      Login = 3,
    }
    type RegisterUserInfo = {
      nickname: string;
      faceURL: string;
      birth?: number;
      gender?: number;
      email?: string;
      account?: string;
      areaCode: string;
      phoneNumber: string;
      password: string;
    };
    type DemoRegisterType = {
      invitationCode?: string;
      verifyCode: string;
      deviceID?: string;
      autoLogin?: boolean;
      user: RegisterUserInfo;
    };
    type LoginParams = {
      verifyCode: string;
      deviceID?: string;
      phoneNumber: string;
      areaCode: string;
      account?: string;
      password: string;
    };
    type ModifyParams = {
      userID: string;
      currentPassword: string;
      newPassword: string;
    };
    type ResetParams = {
      phoneNumber: string;
      areaCode: string;
      verifyCode: string;
      password: string;
      password2: string;
    };
    type VerifyCodeParams = {
      phoneNumber: string;
      areaCode: string;
      verifyCode: string;
      usedFor: UsedFor;
    };
    type SendSmsParams = {
      phoneNumber: string;
      areaCode: string;
      deviceID?: string;
      usedFor: UsedFor;
      invitationCode?: string;
    };
    type EmailSendCodeParams = {
      email: string;
      usedFor: UsedFor;
      platform?: string;
      deviceID?: string;
    };
    type EmailVerifyCodeParams = {
      email: string;
      usedFor: UsedFor;
      verifyCode: string;
      deviceID?: string;
    };
    type EmailBindParams = EmailSendCodeParams & EmailVerifyCodeParams;
  }
  declare namespace Chat {
    interface PinnedListParams {
      conversationID: string;
      pagination: {
        pageNumber: number;
        showNumber: number;
      };
    }
    interface PinnedMessageItem extends MessageItem {
      id: number;
    }
    interface PinnedParams {
      conversationID: string;
      content: string;
      seq: number;
      clientMsgID: string;
    }
    interface PinnedCencalParams {
      id: number;
    }
  }
  interface PaginationRes<T> {
    list: T[];
    total: number;
  }
  interface PaginationMemberRes<T> {
    members: T[];
    total: number;
  }
  declare namespace Normal {
    interface Pagination {
      pageNumber: number;
      showNumber: number;
    }
  }
}
