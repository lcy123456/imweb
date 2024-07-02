import "./index.scss";

import { CloseOutlined } from "@ant-design/icons";
import type { TabsProps } from "antd";
import { Drawer, Tabs } from "antd";
import React, { useCallback, useState } from "react";

import RecordFile from "./RecordFile"; // 文件
import RecordImg from "./RecordImg"; // 图片
import RecordMsg from "./RecordMsg"; // 消息
import RecordVideo from "./RecordVideo"; // 视频

interface PageProps {
  isDisplay: boolean;
  close: () => void;
}

const ChatRecords: React.FC<PageProps> = (props) => {
  // tabs
  const [activeKey, setActiveKey] = useState("1");
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "消息",
      children: "1",
    },
    {
      key: "2",
      label: "图片",
      children: "2",
    },
    {
      key: "3",
      label: "视频",
      children: "3",
    },
    {
      key: "4",
      label: "文件",
      children: "4",
    },
  ];

  const onChange = (key: string) => {
    setActiveKey(key);
  };

  const contentPate = () => {
    return (
      <>
        {activeKey === "1" && <RecordMsg closeModal={onClose} />}
        {activeKey === "2" && <RecordImg />}
        {activeKey === "3" && <RecordVideo />}
        {activeKey === "4" && <RecordFile />}
      </>
    );
  };

  // 关闭弹窗
  const { isDisplay, close } = props;
  const onClose = useCallback(() => {
    setActiveKey("1");
    close();
  }, []);

  const handleClick = () => {
    setActiveKey("1");
    close();
  };

  return (
    <Drawer
      rootClassName="records-drawer"
      title="聊天记录"
      placement="right"
      onClose={onClose}
      open={isDisplay}
      width={380}
      closeIcon={false}
      extra={<CloseOutlined style={{ color: "#8e9ab0" }} onClick={handleClick} />}
      destroyOnClose={true}
      getContainer={"#chat-container"}
    >
      <div style={{ height: "100%" }}>
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          destroyInactiveTabPane={true}
          items={items.map((val) => {
            return {
              label: val.label,
              key: val.key,
              children: contentPate(),
            };
          })}
          onChange={onChange}
          indicatorSize={(origin) => origin - 16}
        />
      </div>
    </Drawer>
  );
};

export default ChatRecords;
