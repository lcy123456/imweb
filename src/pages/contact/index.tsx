import { Layout } from "antd";
import { Outlet } from "react-router-dom";

import ContactSider from "@/pages/contact/ContactSider";

export const Contact = () => {
  return (
    <Layout className="flex-row min-[600px]:-ml-[20px]">
      <ContactSider />
      <Outlet />
    </Layout>
  );
};
