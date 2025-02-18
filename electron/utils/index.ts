import log from "./log";
import Badge from "./window-badge";
export * from "./fileHandle";

export const isLinux = process.platform == "linux";
export const isWin = process.platform == "win32";
export const isMac = process.platform == "darwin";
export const isProd = !process.env.VITE_DEV_SERVER_URL;

export { log, Badge };
