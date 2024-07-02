import { useMount } from "ahooks";
import { Layout, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Outlet, useMatches, useNavigate } from "react-router-dom";

import emitter from "@/utils/events";

import LeftNavBar from "./LeftNavBar";
import TopSearchBar from "./TopSearchBar";
import { useGlobalEvent } from "./useGlobalEvents";

export const MainContentLayout = () => {
  const matches = useMatches();
  const navigate = useNavigate();
  const [connectState] = useGlobalEvent();
  const [showStatus, setShowStatus] = useState(false);
  const [loading, setLoading] = useState(false);

  const gotoChat = () => {
    const isRoot = matches.at(-1)?.pathname === "/home/";
    const inConversation = matches.some((item) => item.params.conversationID);
    if (isRoot || inConversation) {
      navigate("/home/chat", {
        replace: true,
      });
    }
  };
  useMount(gotoChat);

  useEffect(() => {
    setTimeout(() => {
      setShowStatus(true);
    }, 2000);
    const handleGlobalLoad = () => {
      setLoading((val) => !val);
    };
    emitter.on("CHECK_GLOBAL_LOADING", handleGlobalLoad);
    return () => {
      emitter.off("CHECK_GLOBAL_LOADING", handleGlobalLoad);
    };
  }, []);

  const IMStatuWrap = useMemo(() => {
    let text = "";
    if (connectState.isConnecting) {
      text = "连接中...";
    } else if (connectState.isLogining) {
      text = "登录中...";
    } else if (connectState.isSyncing) {
      text = "同步中...";
    } else {
      text = "";
    }
    return (
      <>
        {showStatus && (
          <div className="absolute bottom-6 right-6 flex items-center rounded-3xl bg-white px-4 font-sMedium leading-10">
            <div className="mr-2">
              <Spin spinning={Boolean(text)}></Spin>
            </div>
            {text}
          </div>
        )}
      </>
    );
  }, [
    connectState.isConnecting,
    connectState.isLogining,
    connectState.isSyncing,
    showStatus,
  ]);

  return (
    <Spin spinning={loading} className="!max-h-none" tip="加载中...">
      <Layout className="h-full">
        <TopSearchBar />
        <Layout className="bg-white">
          <LeftNavBar />
          <Outlet />
        </Layout>
        {IMStatuWrap}
      </Layout>
    </Spin>
  );
};
