import { AxiosResponse } from "axios";
import { useEffect, useMemo, useState } from "react";

import { apiGetUnreadMsgCount } from "@/api/imApi";
import { useLogin } from "@/api/login";
import { API } from "@/api/typings";
import { IMSDK } from "@/layout/MainContentWrap";
import { MoreAccountItem } from "@/store/type";
import { useUserStore } from "@/store/user";
import { feedbackToast } from "@/utils/common";
import { setLocalStorage, STORAGEKEYMAP } from "@/utils/storage";

let timer: NodeJS.Timeout;

interface Props {
  isGetUnreadCount?: boolean;
}
export default function useMoreAccount({ isGetUnreadCount = false }: Props = {}) {
  const selfInfo = useUserStore((state) => state.selfInfo);
  const moreAccount = useUserStore((state) => state.moreAccount);
  const updateMoreAccount = useUserStore((state) => state.updateMoreAccount);
  const { mutate: login, isLoading: loginLoading } = useLogin();
  const [unreadCountMap, setUnreadCountMap] = useState<{
    [propsName: string]: { count: number } | undefined;
  }>();
  const [unreadCountTotal, setUnreadCountTotal] = useState(0);

  const checkLogin = (params: API.Login.LoginParams) => {
    return new Promise<
      AxiosResponse<{ chatToken: string; imToken: string; userID: string }>
    >((resolve, reject) => {
      login(params, {
        onSuccess: (data) => {
          setLocalStorage(STORAGEKEYMAP.LAST_PHONE_NUMBER, params.phoneNumber);
          setLocalStorage(STORAGEKEYMAP.LAST_AREA_CODE, params.areaCode);
          resolve(data);
        },
        onError: reject,
      });
    });
  };

  const addAccount = async ({
    userID,
    params,
  }: {
    userID: string;
    params: API.Login.LoginParams;
  }) => {
    const isExist = moreAccount.some((v) => v.userID === userID);
    if (isExist) {
      const text = "账号已存在";
      feedbackToast({ error: text, msg: text });
      throw new Error(text);
    }
    const { data: usersInfoData } = await IMSDK.getUsersInfo([userID]);
    const publicInfo = usersInfoData[0].publicInfo;
    if (!publicInfo) return;
    updateMoreAccount([
      ...moreAccount,
      {
        ...params,
        ...publicInfo,
      },
    ]);
    feedbackToast({ msg: "账号添加成功" });
  };

  const updateAccount = ({
    userID,
    params,
    isForceCreate = false,
  }: {
    userID: string;
    params: Partial<MoreAccountItem>;
    isForceCreate?: boolean;
  }) => {
    const index = moreAccount.findIndex((v) => v.userID === userID);
    if (index === -1 && isForceCreate) {
      updateMoreAccount([...moreAccount, { ...(params as MoreAccountItem), userID }]);
    } else {
      moreAccount[index] = { ...moreAccount[index], ...params };
      updateMoreAccount([...moreAccount]);
    }
  };

  const removeAccount = (userID: string) => {
    const arr = moreAccount.filter((v) => v.userID !== userID);
    updateMoreAccount([...arr]);
  };

  const showMoreAccount = useMemo(() => {
    return moreAccount.filter((v) => v.userID !== selfInfo.userID);
  }, [moreAccount, selfInfo]);

  const handleUnreadMsgCount = async () => {
    const userID = showMoreAccount.map((v) => v.userID);
    if (userID.length === 0) {
      setUnreadCountTotal(0);
      return;
    }
    const res = await apiGetUnreadMsgCount({
      userID,
    });
    setUnreadCountMap({
      ...res.data,
      count: undefined,
    });
    setUnreadCountTotal(res.data.count || 0);
  };

  useEffect(() => {
    if (!isGetUnreadCount || !selfInfo.userID) return;
    handleUnreadMsgCount();
    timer = setInterval(() => {
      handleUnreadMsgCount();
    }, 10000);
    return () => {
      clearInterval(timer);
    };
  }, [showMoreAccount]);

  return {
    checkLogin,
    addAccount,
    updateAccount,
    removeAccount,
    showMoreAccount,
    loginLoading,
    unreadCountMap,
    unreadCountTotal,
  };
}
