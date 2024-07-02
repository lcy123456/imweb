import { v4 as uuidv4 } from "uuid";

import { USER_URL } from "@/config";
import { AppVersionConfig } from "@/store/type";
import createAxiosInstance from "@/utils/request";

const request_user = createAxiosInstance(USER_URL);

export const getPackageApi = () => {
  return request_user.post<{ list: AppVersionConfig[] }>(
    "/client_config/app_list",
    {},
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
};
