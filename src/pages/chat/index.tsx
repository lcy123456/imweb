import { Layout } from "antd";
import { Outlet } from "react-router-dom";

import ConversationSider from "./ConversationSider";

export const Chat = () => {
  return (
    <Layout className="flex-row min-[600px]:-ml-[20px]">
      <ConversationSider />
      <Outlet />
    </Layout>
  );
};
