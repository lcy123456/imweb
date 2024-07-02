import { Button } from "antd";
import { AllowType, getSDK } from "open-im-sdk-wasm";
import { useEffect, useState } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { AtAllId } from "@/pages/chat/queryChat/ChatFooter";
import { useConversationStore, useUserStore } from "@/store";
import emitter from "@/utils/events";
import { getIMToken, getIMUserID } from "@/utils/storage";

const isElectronProd = import.meta.env.MODE !== "development" && window.electronAPI;

export const IMSDK = getSDK({
  coreWasmPath: "./openIM.wasm",
  sqlWasmPath: `${isElectronProd ? ".." : ""}/sql-wasm.wasm`,
});

export const MainContentWrap = () => {
  const { selfInfo } = useUserStore();
  const selfID = selfInfo.userID;

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loginCheck = async () => {
      const IMToken = await getIMToken();
      const IMUserID = await getIMUserID();
      if (!IMToken || !IMUserID) {
        navigate("/login");
        return;
      }
    };

    loginCheck();
  }, [location.pathname]);

  useEffect(() => {
    window.userClick = (userID: string, groupID: string) => {
      if (!userID || userID === AtAllId) return;

      const currentGroupInfo = useConversationStore.getState().currentGroupInfo;

      if (groupID && currentGroupInfo?.lookMemberInfo === AllowType.NotAllowed) {
        return;
      }

      emitter.emit("OPEN_USER_CARD", {
        userID,
        groupID,
        isSelf: userID === selfID,
        notAdd:
          Boolean(groupID) &&
          currentGroupInfo?.applyMemberFriend === AllowType.NotAllowed,
      });
    };
  }, [selfID]);

  return (
    <ErrorBoundary FallbackComponent={FallbackRender}>
      <Outlet />
    </ErrorBoundary>
  );
};

const reloadTime = 10;
const FallbackRender = ({ error }: FallbackProps) => {
  const [time, setTime] = useState(reloadTime);

  useEffect(() => {
    const handleTime = () => {
      setTime((val) => {
        const newVal = val - 1;
        newVal < 1 ? reloadPage() : setTimeout(handleTime, 1000);
        return newVal;
      });
    };
    setTimeout(handleTime, 1000);
  }, []);

  const reloadPage = () => {
    location.reload();
  };

  return (
    <div>
      <h2>Something went wrong:</h2>
      <pre style={{ whiteSpace: "normal" }}>{error.message}</pre>
      <pre style={{ padding: "0.5rem", backgroundColor: "rgba(200,200,200,.5)" }}>
        {error.stack}
      </pre>
      <h2>页面发生未知错误，请尝试刷新或联系管理人员（{time}s后自动重新加载）</h2>
      <Button type="primary" onClick={reloadPage}>
        重新加载
      </Button>
    </div>
  );
};
