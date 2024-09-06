import { Button, Form, Input } from "antd";
import md5 from "md5";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API } from "@/api/typings";
import login_qr from "@/assets/images/login/login_qr.png";
import logo_name_blue from "@/assets/images/logo_name_blue.png";
import PrefixPhone from "@/components/FormComponent/PrefixPhone";
import { RegMap } from "@/constants";
import useMoreAccount from "@/hooks/useMoreAccount";
import { feedbackToast, getPhoneReg } from "@/utils/common";
import {
  getLocalStorage,
  setIMProfile,
  setLocalStorage,
  STORAGEKEYMAP,
} from "@/utils/storage";

import type { FormType } from "./index";

let timer: NodeJS.Timeout;

type LoginType = 0 | 1 | 2;

type LoginFormProps = {
  setFormType: (type: FormType) => void;
};

const LoginForm = ({ setFormType }: LoginFormProps) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loginType, setLoginType] = useState<LoginType>(0);
  const { checkLogin, updateAccount, loginLoading } = useMoreAccount();

  const [countdown, setCountdown] = useState(0);
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
        if (countdown === 1) {
          clearTimeout(timer);
          setCountdown(0);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onFinish = async (params: API.Login.LoginParams) => {
    if (loginType === 0) {
      params.password = md5(params.password ?? "");
    }
    const data = await checkLogin(params);
    const { chatToken, imToken, userID } = data.data;
    updateAccount({ userID, params, isForceCreate: true });
    setIMProfile({ chatToken, imToken, userID });
    navigate("/home/chat");
  };

  const httpCount = useRef(0);
  const handleUpdateHttp = () => {
    clearTimeout(timer);
    httpCount.current++;
    if (httpCount.current === 20) {
      const curTag = getLocalStorage(STORAGEKEYMAP.DEV_HTTP_KEY);
      setLocalStorage(STORAGEKEYMAP.DEV_HTTP_KEY, !curTag);
      feedbackToast({ msg: !curTag ? "测试环境" : "生产环境" });
    }
    timer = setTimeout(() => {
      httpCount.current = 0;
    }, 5000);
  };

  return (
    <>
      {/* <img
        className="absolute top-0 right-0 cursor-pointer"
        src={login_qr}
        alt=""
        onClick={() => setFormType(3)}
        width="80"
      /> */}
      <div className="flex items-center text-xl font-bold">
        <span onClick={handleUpdateHttp}>欢迎使用</span>
        <img
          className="ml-2 h-fit"
          src={logo_name_blue}
          alt="logo_name_blue"
          width={117}
        />
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        className="mt-6"
        initialValues={{
          password: "",
        }}
      >
        {/* <Form.Item
          label="手机号"
          name="phoneNumber"
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator(_, value: string) {
                if (
                  !value ||
                  getPhoneReg(getFieldValue("areaCode") as string).test(value)
                ) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("请输入正确的手机号!"));
              },
            }),
          ]}
        >
          <Input
            addonBefore={<PrefixPhone />}
            allowClear
            placeholder="请输入您的手机号"
          />
        </Form.Item> */}
        <Form.Item label="用户名" name="account" rules={[{ required: true }]}>
          <Input allowClear placeholder="请输入您的用户名" />
        </Form.Item>

        {loginType === 0 && (
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true },
              {
                pattern: RegMap.pwd,
                message: "6-20位字符，必须包含字母和数字",
              },
            ]}
          >
            <Input.Password allowClear placeholder="请输入您的密码" />
          </Form.Item>
        )}
        {/* <div>
          <span className="text-gray-400 cursor-pointer" onClick={() => setFormType(1)}>
            忘记密码
          </span>
        </div> */}
        <Form.Item className="mt-8">
          <Button type="primary" htmlType="submit" block loading={loginLoading}>
            登录
          </Button>
        </Form.Item>

        <div className="flex flex-row items-center justify-center">
          <span className="text-sm text-gray-400">还没有账号？</span>
          <span
            className="cursor-pointer text-sm text-blue-500"
            onClick={() => setFormType(2)}
          >
            立即注册
          </span>
        </div>
        <div className="text-center text-gray-400">联系我们：cs@sumi.chat.com</div>
        <Form.Item label="阻止账号回填" hidden={true}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </>
  );
};

export default LoginForm;
