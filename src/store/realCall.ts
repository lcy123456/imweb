import { create } from "zustand";

import { RealCallsType } from "@/constants";

import { CurrentCallData, CurrentRoomStatus, RealCallStore } from "./type";

export const useRealCallStore = create<RealCallStore>()((set, get) => ({
  currentCallData: {
    type: RealCallsType.Audio,
    conversation: undefined,
    isReceive: false,
  },
  currentRoomStatus: {
    count: 0,
    token: "",
    type: RealCallsType.Audio,
  },
  updateCurrentCallData: (params: CurrentCallData) => {
    set(() => ({ currentCallData: params }));
  },
  clearCurrentCallData: () => {
    set(() => ({
      currentCallData: {
        type: RealCallsType.Audio,
      },
    }));
  },
  updateCurrentRoomStatus: (params: CurrentRoomStatus) => {
    set(() => ({ currentRoomStatus: params }));
  },
  clearCurrentRoomStatus: () => {
    set(() => ({
      currentRoomStatus: {
        count: 0,
        token: "",
        type: RealCallsType.Audio,
      },
    }));
  },
}));
