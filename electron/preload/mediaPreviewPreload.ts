import { contextBridge, ipcRenderer } from "electron";

const ipcInvoke = (channel: string, ...arg: any) => {
  return ipcRenderer.invoke(channel, ...arg);
};

ipcRenderer.on("mediaPreviewPort", async (event) => {
  window.postMessage("mediaPreviewPort", "*", event.ports);
});

const Api = {
  routePath: "/mediaPreview",
  ipcInvoke,
};

console.log("33-44");
contextBridge.exposeInMainWorld("electronAPI", Api);
