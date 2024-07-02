import { createHashRouter } from "react-router-dom";

import { MainContentWrap } from "@/layout/MainContentWrap";
import { RouteIntercept } from "@/layout/RouteIntercept";
import { EmptyChat } from "@/pages/chat/EmptyChat";
import { QueryChat } from "@/pages/chat/queryChat";
import { MediaPreview } from "@/pages/mediaPreview";

import contactRoutes from "./contactRoutes";

const router = createHashRouter([
  {
    path: "/",
    element: <RouteIntercept />,
  },
  {
    path: "/home",
    element: <MainContentWrap />,
    children: [
      {
        path: "/home",
        async lazy() {
          const { MainContentLayout } = await import("@/layout/MainContentLayout");
          return {
            Component: MainContentLayout,
          };
        },
        children: [
          {
            path: "chat",
            async lazy() {
              const { Chat } = await import("@/pages/chat");
              return { Component: Chat };
            },
            children: [
              {
                index: true,
                element: <EmptyChat />,
              },
              {
                path: ":conversationID",
                element: <QueryChat />,
              },
            ],
          },
          {
            path: "contact",
            async lazy() {
              const { Contact } = await import("@/pages/contact");
              return { Component: Contact };
            },
            children: contactRoutes,
          },
          {
            path: "collect",
            async lazy() {
              const { Collect } = await import("@/pages/collect");
              return { Component: Collect };
            },
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    async lazy() {
      const { Login } = await import("@/pages/login");
      return { Component: Login };
    },
  },
  {
    path: "/mediaPreview",
    element: <MediaPreview />,
  },
  {
    path: "/installPackage",
    async lazy() {
      const { InstallPackage } = await import("@/pages/installPackage");
      return { Component: InstallPackage };
    },
  },
]);

export default router;
