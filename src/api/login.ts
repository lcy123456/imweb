import { MessageReceiveOptType } from "open-im-sdk-wasm";
import { useMutation, useQuery } from "react-query";
import { v4 as uuidv4 } from "uuid";

import { USER_URL } from "@/config";
import { AppConfig, AppVersionConfig } from "@/store/type";
import createAxiosInstance from "@/utils/request";
import { getChatToken } from "@/utils/storage";

import { errorHandle } from "./errorHandle";
import { API } from "./typings";

const request = createAxiosInstance(USER_URL);

const platform = window.electronAPI?.getPlatform?.() ?? 5;

const getAreaCode = (code: string) => (code.includes("+") ? code : `+${code}`);

export const useSendSms = () => {
  return useMutation(
    (params: API.Login.SendSmsParams) =>
      request.post(
        "/account/code/send",
        {
          ...params,
        },
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      ),
    {
      onError: errorHandle,
    },
  );
};

export const useVerifyCode = () => {
  return useMutation(
    (params: API.Login.VerifyCodeParams) =>
      request.post(
        "/account/code/verify",
        {
          ...params,
          areaCode: getAreaCode(params.areaCode),
        },
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      ),
    {
      onError: errorHandle,
    },
  );
};

export const emailSendCodeApi = async (params: API.Login.EmailSendCodeParams) => {
  const token = await getChatToken();
  return request.post(
    "account/email/send_code",
    { ...params, platform },
    {
      headers: {
        operationID: uuidv4(),
        token,
      },
    },
  );
};

export const emailVerifyCodeApi = (params: API.Login.EmailVerifyCodeParams) => {
  return request.post(
    "/account/email/verify_code",
    { ...params },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
};

export const emailBindApi = async (params: API.Login.EmailBindParams) => {
  const token = await getChatToken();
  return request.post(
    "/account/email/bind",
    { ...params, platform },
    {
      headers: {
        operationID: uuidv4(),
        token,
      },
    },
  );
};

// 注册
export const useRegister = () => {
  return useMutation(
    (params: API.Login.DemoRegisterType) =>
      request.post(
        "/account/register",
        {
          ...params,
          user: {
            ...params.user,
            areaCode: getAreaCode(params.user.areaCode),
          },
          platform,
        },
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      ),
    {
      onError: errorHandle,
    },
  );
};

export const useReset = () => {
  return useMutation(
    (params: API.Login.ResetParams) =>
      request.post(
        "/account/password/reset",
        {
          ...params,
          areaCode: params.areaCode && getAreaCode(params.areaCode),
        },
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      ),
    {
      onError: errorHandle,
    },
  );
};

export const useModifyPassword = () => {
  return useMutation(
    async (params: API.Login.ModifyParams) => {
      const token = await getChatToken();
      return request.post(
        "/account/password/change",
        {
          ...params,
        },
        {
          headers: {
            operationID: uuidv4(),
            token,
          },
        },
      );
    },
    {
      onError: errorHandle,
    },
  );
};

interface LoginRes {
  chatToken: string;
  imToken: string;
  userID: string;
  code: string;
}
export const useLogin = () => {
  return useMutation(
    (params: API.Login.LoginParams) =>
      request.post<LoginRes>(
        "/account/login",
        {
          ...params,
          platform,
          areaCode: getAreaCode(params.areaCode),
        },
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      ),
    {
      onError: errorHandle,
    },
  );
};

export const apiLoginQrCode = () =>
  request.post<{ code: string }>(
    "/account/code/scan",
    {
      platform,
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );

export const apiAccountLoginScan = (code: string) =>
  request.post<LoginRes>(
    "/account/scan_login",
    {
      code,
      platform,
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );

export interface BusinessUserInfo {
  userID: string;
  password: string;
  account: string;
  phoneNumber: string;
  areaCode: string;
  email: string;
  nickname: string;
  faceURL: string;
  gender: number;
  level: number;
  birth: number;
  allowAddFriend: BusinessAllowType;
  allowBeep: BusinessAllowType;
  allowVibration: BusinessAllowType;
  globalRecvMsgOpt: MessageReceiveOptType;
  isHiddenPhone: BusinessHiddenPhone;
  managerLevel: number;
}

export enum BusinessAllowType {
  Allow = 1,
  NotAllow = 2,
}

export enum BusinessHiddenPhone {
  NotHidden = 1,
  hidden = 2,
}

export const getBusinessUserInfo = async (userIDs: string[]) => {
  const token = await getChatToken();
  return request.post<{ users: BusinessUserInfo[] }>(
    "/user/find/full",
    {
      userIDs,
    },
    {
      headers: {
        operationID: uuidv4(),
        token,
      },
    },
  );
};

export const searchBusinessUserInfo = async (keyword: string) => {
  const token = await getChatToken();
  return request.post<{ total: number; users: BusinessUserInfo[] }>(
    "/user/search/full",
    {
      keyword,
      pagination: {
        pageNumber: 1,
        showNumber: 30,
      },
    },
    {
      headers: {
        operationID: uuidv4(),
        token,
      },
    },
  );
};

interface UpdateBusinessUserInfoParams {
  userID: string;
  email: string;
  nickname: string;
  faceURL: string;
  gender: number;
  birth: number;
  allowAddFriend: number;
  allowBeep: number;
  allowVibration: number;
  globalRecvMsgOpt: number;
}

export const updateBusinessUserInfo = async (
  params: Partial<UpdateBusinessUserInfoParams>,
) => {
  const token = await getChatToken();
  return request.post<unknown>(
    "/user/update",
    {
      ...params,
    },
    {
      headers: {
        operationID: uuidv4(),
        token,
      },
    },
  );
};

export const getAppConfig = () =>
  request.post<{ config: AppConfig }>(
    "/client_config/get",
    {},
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );

export const getAppVersionConfig = () => {
  return request.post<AppVersionConfig>(
    "/client_config/app_version",
    {
      platform,
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
};
