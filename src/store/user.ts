import { t } from "i18next";
import { create } from "zustand";

import { getThirdConfigApi } from "@/api";
import { BusinessUserInfo, getAppConfig, getBusinessUserInfo } from "@/api/login";
import { receiveMessageMusicMap, ReceiveMessageMusicType } from "@/constants";
import { IMSDK } from "@/layout/MainContentWrap";
import router from "@/routes";
import { feedbackToast } from "@/utils/common";
import { initStoreTimer } from "@/utils/imCommon";
import {
  clearIMProfile,
  getLocale,
  getLocalStorage,
  setLocale,
  setLocalStorage,
  STORAGEKEYMAP,
} from "@/utils/storage";

import { useContactStore } from "./contact";
import { useConversationStore } from "./conversation";
import {
  AppConfig,
  AppSettings,
  AppVersionConfig,
  ConnectState,
  FavoriteEmojiItem,
  MoreAccount,
  ThirdConfigRes,
  UserStore,
} from "./type";

export const useUserStore = create<UserStore>()((set, get) => ({
  connectState: {} as ConnectState,
  selfInfo: {} as BusinessUserInfo,
  appConfig: {} as AppConfig,
  appVersionConfig: {} as AppVersionConfig,
  packVersion: "",
  appSettings: {
    locale: getLocale(),
    closeAction: "miniSize",
  },
  thirdConfig: {} as ThirdConfigRes,
  favoriteEmojiList: [],
  moreAccount: (getLocalStorage(STORAGEKEYMAP.MORE_ACCOUNT) || []) as MoreAccount,
  receiveMessageMusicKey: (getLocalStorage(STORAGEKEYMAP.RVCEIVE_MESSAGE_MUSIC) ||
    Object.keys(receiveMessageMusicMap)[0]) as ReceiveMessageMusicType,

  updateConnectState: (connectState: ConnectState) => {
    set({ connectState });
  },
  getSelfInfoByReq: async () => {
    try {
      const { data } = await IMSDK.getSelfUserInfo();
      const {
        data: { users },
      } = await getBusinessUserInfo([data.userID]);
      const bussinessData = users[0];
      set(() => ({ selfInfo: bussinessData }));
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getSelfInfoFailed") });
    }
  },
  updateSelfInfo: (info: Partial<BusinessUserInfo>) => {
    set((state) => ({ selfInfo: { ...state.selfInfo, ...info } }));
  },
  getAppConfigByReq: async () => {
    let config = {} as AppConfig;
    try {
      const { data } = await getAppConfig();
      config = data.config ?? {};
    } catch (error) {
      console.error("get app config err");
    }
    set((state) => ({ appConfig: { ...state.appConfig, ...config } }));
  },
  updateAppVersionConfig: (config: AppVersionConfig) => {
    set({ appVersionConfig: config });
  },
  updateAppSettings: (settings: Partial<AppSettings>) => {
    if (settings.locale) {
      setLocale(settings.locale);
    }
    set((state) => ({ appSettings: { ...state.appSettings, ...settings } }));
  },
  getThirdConfig: async () => {
    try {
      const res = await getThirdConfigApi();
      set(() => ({
        thirdConfig: res.data,
      }));
    } catch {
      setTimeout(() => get().getThirdConfig(), 2000);
    }
  },
  userLogout: async (isToLogin = true) => {
    console.log("call userLogout:::");
    await IMSDK.logout();
    get().clearLoginInfo(isToLogin);
  },
  forceLogout: async () => {
    await get().clearLoginInfo();
    location.reload();
  },
  clearLoginInfo: async (isToLogin = true) => {
    await clearIMProfile();
    set({ selfInfo: {} as BusinessUserInfo });
    useContactStore.getState().clearContactStore();
    useConversationStore.getState().clearConversationStore();
    isToLogin && router.navigate("/login");
    window.electronAPI?.ipcInvoke("updateBadge", { count: 0 });
    clearTimeout(initStoreTimer);
  },
  updateMoreAccount: (val: MoreAccount) => {
    set({ moreAccount: val });
    setLocalStorage(STORAGEKEYMAP.MORE_ACCOUNT, val);
  },
  updateReceiveMessageMusicKey: (val: ReceiveMessageMusicType) => {
    set({ receiveMessageMusicKey: val });
    setLocalStorage(STORAGEKEYMAP.RVCEIVE_MESSAGE_MUSIC, val);
  },
  updateFavoriteEmojiList: (val: FavoriteEmojiItem[]) => {
    set({ favoriteEmojiList: val });
  },
  updatePackVersion: async () => {
    if (!window.electronAPI) return;
    const version = await window.electronAPI.ipcInvoke("getPackVersion");
    set({
      packVersion: version as string,
    });
  },
}));
