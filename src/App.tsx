// import { isProd } from "./utils/common";
import { App as AntdApp, ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
// import { ReactQueryDevtools } from "react-query/devtools";
import { RouterProvider } from "react-router-dom";

import AutoUpdaterModal from "@/pages/common/AutoUpdaterModal";

import AntdGlobalComp from "./AntdGlobalComp";
import InitGlobalMethods from "./InitGlobalMethods";
import router from "./routes";
import { useUserStore } from "./store";

function App() {
  const { appSettings } = useUserStore();
  const locale = appSettings.locale;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <ConfigProvider
      autoInsertSpaceInButton={false}
      locale={locale === "zh-CN" ? zhCN : enUS}
      theme={{
        token: { colorPrimary: "#0089FF" },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>loading...</div>}>
          <AntdApp>
            <AntdGlobalComp />
            <RouterProvider router={router} />
            <InitGlobalMethods />
            {window.electronAPI && !window.electronAPI.routePath && (
              <AutoUpdaterModal />
            )}
          </AntdApp>
        </Suspense>
        {/* {!isProd && <ReactQueryDevtools initialIsOpen={false} />} */}
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;
