import { LocaleString } from "@/store/type";
import * as localForage from "localforage";

localForage.config({
  name: "OpenIM-Config",
});
export type StoreParams = {
  key: string;
  data?: string;
};

const setKeyStore = (data: StoreParams) => {
  return localForage.setItem(data.key, data.data);
};
const getKeyStore = (data: StoreParams) => {
  return localForage.getItem(data.key);
};
const deleteKeyStore = (data: StoreParams) => {
  return localForage.removeItem(data.key);
};

export const setTMToken = (token: string) =>
  setKeyStore({
    key: "IM_TOKEN",
    data: token,
  });
export const setChatToken = (token: string) =>
  setKeyStore({
    key: "IM_CHAT_TOKEN",
    data: token,
  });
export const setTMUserID = (userID: string) =>
  setKeyStore({
    key: "IM_USERID",
    data: userID,
  });
export const setIMProfile = ({
  chatToken,
  imToken,
  userID,
}: {
  chatToken: string;
  imToken: string;
  userID: string;
}) => {
  setTMToken(imToken);
  setChatToken(chatToken);
  setTMUserID(userID);
};

export const clearIMProfile = async () => {
  const remove01 = deleteKeyStore({ key: "IM_TOKEN" });
  const remove02 = deleteKeyStore({ key: "IM_CHAT_TOKEN" });
  const remove03 = deleteKeyStore({ key: "IM_USERID" });
  return await Promise.all([remove01, remove02, remove03]);
};

export const getIMToken = async () =>
  (await getKeyStore({ key: "IM_TOKEN" })) as string;
export const getChatToken = async () =>
  (await getKeyStore({ key: "IM_CHAT_TOKEN" })) as string;
export const getIMUserID = async () =>
  (await getKeyStore({ key: "IM_USERID" })) as string;

export const setLocale = (locale: string) => localStorage.setItem("IM_LOCALE", locale);
export const getLocale = (): LocaleString =>
  (localStorage.getItem("IM_LOCALE") as LocaleString) || "zh-CN";

export const STORAGEKEYMAP = {
  MORE_ACCOUNT: "MORE_ACCOUNT",
  RVCEIVE_MESSAGE_MUSIC: "RVCEIVE_MESSAGE_MUSIC",
  LAST_PHONE_NUMBER: "LAST_PHONE_NUMBER",
  LAST_AREA_CODE: "LAST_AREA_CODE",
  DEV_HTTP_KEY: "DEV_HTTP_KEY",
};
export const setLocalStorage = (key: string, value: any) =>
  localStorage.setItem(key, JSON.stringify(value));
export const getLocalStorage = (key: string) =>
  JSON.parse(localStorage.getItem(key) || '""');
export const removeLocalStorage = (key: string) => localStorage.removeItem(key);
