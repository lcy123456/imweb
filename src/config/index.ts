import { getLocalStorage, STORAGEKEYMAP } from "@/utils/storage";

const isDevHttp = getLocalStorage(STORAGEKEYMAP.DEV_HTTP_KEY) as boolean;

const isProd = import.meta.env.PROD;
const isEnvTag = isProd ? isDevHttp : false;

const WS_URL_TEST = "wss://api.sumi.chat/open-im-ws";
const API_URL_TEST = "https://api.sumi.chat/open-im";
const USER_URL_TEST = "https://api.sumi.chat/im-logic";

export const WS_URL = isEnvTag ? WS_URL_TEST : import.meta.env.VITE_SERVE_WS_URL;
export const API_URL = isEnvTag ? API_URL_TEST : import.meta.env.VITE_SERVE_API_URL;
export const USER_URL = isEnvTag ? USER_URL_TEST : import.meta.env.VITE_SERVE_USER_URL;
