import { Button, Form, Input } from "antd";
import md5 from "md5";
import { forwardRef, ForwardRefRenderFunction, memo, useState } from "react";

import { API } from "@/api/typings";
import DraggableModalWrap from "@/components/DraggableModalWrap";
import PrefixPhone from "@/components/FormComponent/PrefixPhone";
import { RegMap } from "@/constants";
import useMoreAccount from "@/hooks/useMoreAccount";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { getPhoneReg } from "@/utils/common";

const AddAcountModal: ForwardRefRenderFunction<OverlayVisibleHandle> = (props, ref) => {
  const [addLoading, setAddLoading] = useState(false);
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const { checkLogin, addAccount } = useMoreAccount();
  const [form] = Form.useForm();

  const onFinish = async (params: API.Login.LoginParams) => {
    setAddLoading(true);
    try {
      params.password = md5(params.password ?? "");
      const { data } = await checkLogin(params);
      await addAccount({ userID: data.userID, params });
      closeOverlay();
      form.resetFields();
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <DraggableModalWrap
      footer={null}
      title={<div className="cursor-move">添加账号</div>}
      open={isOverlayOpen}
      onCancel={closeOverlay}
      width={460}
      ignoreClasses=".ignore-drag"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        className="ignore-drag mt-6"
        initialValues={{
          areaCode: "+1",
          phoneNumber: "",
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
        <Form.Item
          label="密码"
          name="password"
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
        <Form.Item className="mt-12">
          <Button type="primary" htmlType="submit" block loading={addLoading}>
            添加
          </Button>
        </Form.Item>
        <Form.Item label="阻止账号回填" hidden={true}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </DraggableModalWrap>
  );
};

export default memo(forwardRef(AddAcountModal));
