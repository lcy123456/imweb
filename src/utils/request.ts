import axios from "axios";
import { feedbackToast } from "./common";
import { getIMToken } from "./storage";
import { useUserStore } from "@/store";
import { TokenCodeKey } from "@/constants";

const createAxiosInstance = (baseURL: string) => {
  const serves = axios.create({
    baseURL,
    timeout: 60000,
  });

  serves.interceptors.request.use(
    async (config) => {
      config.headers.token = config.headers.token ?? (await getIMToken());
      return config;
    },
    (err) => Promise.reject(err),
  );

  serves.interceptors.response.use(
    (res) => {
      const { errCode } = res.data;
      switch (true) {
        case errCode === 0:
          return res.data;
        case TokenCodeKey.includes(errCode):
          feedbackToast({
            msg: "当前登录已过期,请重新登录",
            error: "http",
            onClose: () => {
              useUserStore.getState().forceLogout();
            },
          });
        default:
          return Promise.reject(res.data);
      }
    },
    (err) => {
      if (err.message.includes("timeout")) {
        console.log("错误回调", err);
        feedbackToast({ error: 1, msg: "网络连接超时" });
      }
      if (err.message.includes("Network Error")) {
        console.log("错误回调", err);
        feedbackToast({ error: 1, msg: "网络连接异常，请检查网络连接" });
      }
      return Promise.reject(err);
    },
  );

  return serves;
};

export default createAxiosInstance;
