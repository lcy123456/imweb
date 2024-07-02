import { QRCode } from "antd";
import { QRCodeProps } from "antd/lib";
import { WsResponse } from "open-im-sdk-wasm/lib/types/entity";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiAccountLoginScan, apiLoginQrCode } from "@/api/login";
import { setIMProfile } from "@/utils/storage";

import type { FormType } from "./index";

let timer: NodeJS.Timeout;

interface Props {
  setFormType: (type: FormType) => void;
}
const LoginQr = (props: Props) => {
  const navigate = useNavigate();

  const { setFormType } = props;
  const [data, setData] = useState({
    type: "login",
    value: "",
  });
  const [qrStatus, setQrStatus] = useState<QRCodeProps["status"]>("loading");

  useEffect(() => {
    getApiLoginQrCode();
    return () => {
      clearInterval(timer);
    };
  }, []);

  const getApiLoginQrCode = async () => {
    const { data } = await apiLoginQrCode();
    setData({
      type: "login",
      value: data.code,
    });
    setQrStatus("active");
    timer = setInterval(() => {
      getApiAccountLoginScan(data.code);
    }, 2000);
  };

  const getApiAccountLoginScan = async (code: string) => {
    try {
      const data = await apiAccountLoginScan(code);
      const { chatToken, imToken, userID } = data.data;
      setIMProfile({ chatToken, imToken, userID });
      navigate("/home/chat");
    } catch (error) {
      const errCode = (error as WsResponse).errCode;
      if (errCode === 1004) {
        clearInterval(timer);
        setQrStatus("expired");
      }
    }
  };

  const refreshCode = () => {
    setQrStatus(undefined);
    getApiLoginQrCode();
  };

  return (
    <div className="flex h-full flex-col items-center justify-between">
      <QRCode
        size={254}
        value={JSON.stringify(data)}
        icon="/icons/logo.png"
        iconSize={60}
        status={qrStatus}
        onRefresh={refreshCode}
      />
      <div className="a text-xl">扫码登录</div>
      <div className="text-[var(--sub-text)]">打开手机扫描二维码</div>
      <div
        className="cursor-pointer text-[var(--primary)]"
        onClick={() => setFormType(0)}
      >
        返回
      </div>
    </div>
  );
};

export default LoginQr;
