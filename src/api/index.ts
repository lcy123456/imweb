import axios, { AxiosRequestConfig } from "axios";
import { v4 as uuidv4 } from "uuid";

import { API_URL } from "@/config";
import { useUserStore } from "@/store";
import { ThirdConfigRes } from "@/store/type";
import createAxiosInstance from "@/utils/request";

const request = createAxiosInstance(API_URL);

export const getThirdConfigApi = () => {
  return request.get<ThirdConfigRes>("/third/config", {
    headers: {
      operationID: uuidv4(),
    },
  });
};

interface GifSearchParams {
  q: string;
  offset: number;
  limit: number;
}
export const getGifsSearchApi = (params: GifSearchParams) => {
  const { thirdConfig } = useUserStore.getState();
  return axios.get<GifSearchRes>(`${thirdConfig?.gif?.url}/v1/gifs/search`, {
    params: {
      api_key: thirdConfig?.gif?.apiKey,
      ...params,
    },
  });
};

interface GifSearchRes {
  data: GifSearchItem[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
  meta: {
    status: number;
    msg: string;
    response_id: string;
  };
}
export interface GifSearchItem {
  id: string;
  images: {
    original: GifOriginal;
    preview_gif: {
      url: string;
    };
  };
}
export interface GifOriginal {
  url: string;
}

export const readerFileApi = <T>(url: string, option?: AxiosRequestConfig) => {
  return axios.get<T>(url, option);
};
