import { LeftOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Space } from "antd";
import md5 from "md5";
import { useEffect, useState } from "react";

import { errorHandle } from "@/api/errorHandle";
import { emailSendCodeApi, emailVerifyCodeApi, useReset } from "@/api/login";
import { RegMap } from "@/constants";
import { feedbackToast } from "@/utils/common";

import type { FormType } from "./index";

type ModifyFormProps = {
  setFormType: (type: FormType) => void;
};

type FormFields = {
  phoneNumber: string;
  areaCode: string;
  email: string;
  verifyCode: string;
  password: string;
  password2: string;
};

const ModifyForm = ({ setFormType }: ModifyFormProps) => {
  const [form] = Form.useForm<FormFields>();
  const [countdown, setCountdown] = useState(0);
  const [isConfirm, setIsConfirm] = useState(false);
  const { mutate: reset } = useReset();

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

  const onFinish = async (fields: FormFields) => {
    if (!isConfirm) {
      try {
        await emailVerifyCodeApi({
          email: fields.email,
          verifyCode: fields.verifyCode,
          usedFor: 2,
        });
        setIsConfirm(true);
      } catch (err) {
        errorHandle(err);
      }
    } else {
      reset(
        { ...fields, password: md5(fields.password), password2: md5(fields.password) },
        {
          onSuccess() {
            feedbackToast({ msg: "修改密码成功，请重新登录" });
            setFormType(0);
          },
        },
      );
    }
  };
  const sendCodeHandle = async () => {
    await form.validateFields(["email"]);
    try {
      await emailSendCodeApi({
        email: form.getFieldValue("email"),
        usedFor: 2,
      });
      setCountdown(60);
      feedbackToast({ msg: "验证码已发送" });
    } catch (err) {
      errorHandle(err);
    }
  };

  const back = () => {
    setFormType(0);
    form.resetFields();
  };

  return (
    <div className="flex flex-col justify-between">
      <div className="cursor-pointer text-sm text-gray-400" onClick={back}>
        <LeftOutlined rev={undefined} />
        <span className="ml-1">返回</span>
      </div>
      <div className="mt-6 text-2xl font-medium">忘记密码</div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        className="mt-6"
        initialValues={{ areaCode: "+86" }}
      >
        <Form.Item
          label="邮箱"
          name="email"
          hidden={isConfirm}
          rules={[
            { required: true, message: "邮箱不能为空" },
            { type: "email", message: "邮箱格式不正确" },
          ]}
        >
          <Input placeholder="请输入您的邮箱" />
        </Form.Item>

        <Form.Item
          label="验证码"
          name="verifyCode"
          hidden={isConfirm}
          rules={[
            { required: true },
            {
              pattern: RegMap.verifyCode,
              message: "请输入正确的验证码",
            },
          ]}
        >
          <Space.Compact className="w-full">
            <Input allowClear placeholder="请输入您的验证码" className="w-full" />
            <Button type="primary" onClick={sendCodeHandle} loading={countdown > 0}>
              {countdown > 0 ? `${countdown}秒` : "发送验证码"}
            </Button>
          </Space.Compact>
        </Form.Item>

        {isConfirm && (
          <>
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

            <Form.Item
              label="确认密码"
              name="password2"
              dependencies={["password"]}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("两次输入的密码不一致!"));
                  },
                }),
              ]}
            >
              <Input.Password allowClear placeholder="请再次确认您的密码" />
            </Form.Item>
          </>
        )}

        <Form.Item className="mt-20">
          <Button type="primary" htmlType="submit" block>
            {isConfirm ? "确认修改" : "下一步"}
          </Button>
        </Form.Item>
        <Form.Item label="阻止账号回填" hidden={true}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </div>
  );
};

export default ModifyForm;
