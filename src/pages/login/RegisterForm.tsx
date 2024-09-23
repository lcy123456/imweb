import { LeftOutlined } from "@ant-design/icons";
import { App, Button, Form, Input } from "antd";
import md5 from "md5";
import { useEffect, useState } from "react";

import { useRegister, useSendSms } from "@/api/login";
import PrefixPhone from "@/components/FormComponent/PrefixPhone";
import { RegMap } from "@/constants";
import { getPhoneReg } from "@/utils/common";
import { setLocalStorage, STORAGEKEYMAP } from "@/utils/storage";

import type { FormType } from "./index";

type RegisterFormProps = {
  setFormType: (type: FormType) => void;
};

type FormFields = {
  phoneNumber: string;
  areaCode: string;
  verifyCode: string;
  invitationCode: string;
  nickname: string;
  password: string;
  password2: string;
};

const RegisterForm = ({ setFormType }: RegisterFormProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormFields>();
  const { mutate: sendSms } = useSendSms();
  // const { mutate: verifyCode } = useVerifyCode();
  const { mutate: register } = useRegister();

  // 0手机号 1验证码 2填信息
  const [registerForm, setRegisterForm] = useState(0);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  // const inputRefs: InputRef[] = [];
  // const handleInputChange = (
  //   index: number,
  //   event: React.ChangeEvent<HTMLInputElement>,
  // ) => {
  //   const value = event.target.value;
  //   const newCode = [...code];

  //   if (value.length === 1) {
  //     newCode[index] = value;
  //     setCode(newCode);

  //     if (index < code.length - 1) {
  //       inputRefs[index + 1].focus();
  //     }
  //   }
  // };
  // const handleInputKeyUp = (index: number, event: React.KeyboardEvent) => {
  //   const keyPressed = event.keyCode || event.which;

  //   if (keyPressed === 8 && index > 0) {
  //     const newCode = [...code];
  //     newCode[index - 1] = "";
  //     setCode(newCode);
  //     inputRefs[index - 1].focus();
  //   }

  //   if (keyPressed === 8 || keyPressed === 46) {
  //     const newCode = [...code];
  //     newCode[index] = "";
  //     setCode(newCode);
  //   }
  // };

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

  const onFinish = (fields: FormFields) => {
    // if (registerForm === 0) {
    //   sendSms(
    //     {
    //       usedFor: 1,
    //       ...fields,
    //     },
    //     {
    //       onSuccess() {
    //         // setCountdown(60);
    //         setRegisterForm(2);
    //       },
    //     },
    //   );
    // }
    // if (registerForm === 1) {
    //   verifyCode(
    //     {
    //       ...fields,
    //       usedFor: 1,
    //       verifyCode: code.join(""),
    //     },
    //     {
    //       onSuccess() {
    //         setRegisterForm(2);
    //       },
    //     },
    //   );
    // }
    console.log("registerForm--registerForm", registerForm);
    if (registerForm === 0) {
      const num = Math.floor(Math.random() * 20) + 1;
      const faceURL = `ic_avatar_${num < 10 ? `0${num}` : num}`;
      register(
        {
          //   verifyCode: code.join(""),
          autoLogin: true,
          invitationCode: fields.invitationCode,
          user: {
            nickname: fields.nickname,
            faceURL,
            areaCode: fields.areaCode,
            // phoneNumber: fields.phoneNumber,
            account: fields.nickname,
            password: md5(fields.password),
          },
        },
        {
          onSuccess() {
            message.success("注册成功");
            setLocalStorage(STORAGEKEYMAP.LAST_PHONE_NUMBER, fields.phoneNumber);
            setLocalStorage(STORAGEKEYMAP.LAST_AREA_CODE, fields.areaCode);
            setFormType(0);
          },
        },
      );
    }
  };

  // const sendSmsHandle = () => {
  //   sendSms(
  //     {
  //       phoneNumber: form.getFieldValue("phoneNumber") as string,
  //       areaCode: form.getFieldValue("areaCode") as string,
  //       invitationCode: form.getFieldValue("invitationCode") as string,
  //       usedFor: 1,
  //     },
  //     {
  //       onSuccess() {
  //         setCountdown(60);
  //       },
  //     },
  //   );
  // };

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
      <div className="mt-4 text-2xl font-medium">
        {registerForm === 0 && <span>新用户注册</span>}
        {/* {registerForm === 1 && <span>验证手机号</span>} */}
        {registerForm === 2 && <span>设置信息</span>}
      </div>
      <div className="mt-4 tracking-wider text-gray-400" hidden={registerForm !== 1}>
        <span>请输入发送至</span>
        <span className="text-blue-600 ">
          {form.getFieldValue("areaCode")} {form.getFieldValue("phoneNumber")}
        </span>
        <span>的 6 位验证码，有效期 10 分钟</span>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        className="mt-4"
        initialValues={{ areaCode: "+1" }}
      >
        {/* <Form.Item
          label="手机号"
          name="phoneNumber"
          hidden={registerForm === 0}
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

        {registerForm === 0 && (
          <>
            <Form.Item
              label="用户名"
              name="nickname"
              rules={[{ required: true }]}
              hidden={registerForm !== 0}
            >
              <Input allowClear placeholder="请输入您的用户名" />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              hidden={registerForm !== 0}
              rules={[
                { required: true },
                {
                  pattern: RegMap.pwd,
                  message: "6-18位字符",
                },
              ]}
            >
              <Input.Password allowClear placeholder="请输入您的密码" />
            </Form.Item>
            <Form.Item
              label="确认密码"
              name="password2"
              dependencies={["password"]}
              hidden={registerForm !== 0}
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
            <Form.Item
              //   className="mb-24"
              label="邀请码"
              name="invitationCode"
              rules={[{ required: true }]}
              hidden={registerForm !== 0}
            >
              <Input allowClear placeholder="请输入邀请码" />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            {registerForm === 0 ? "完成" : "下一步"}
          </Button>
        </Form.Item>

        <Form.Item label="阻止账号回填" hidden={true}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterForm;
