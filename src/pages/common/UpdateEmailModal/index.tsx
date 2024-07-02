import { Button, Form, Input, Modal, Space } from "antd";
import { forwardRef, ForwardRefRenderFunction, memo, useEffect, useState } from "react";
import { useMutation } from "react-query";

import { errorHandle } from "@/api/errorHandle";
import { emailBindApi, emailSendCodeApi, emailVerifyCodeApi } from "@/api/login";
import { RegMap } from "@/constants";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";

interface FormParams {
  newEmail: string;
  newCode: string;
}

const UpdateEmailModal: ForwardRefRenderFunction<OverlayVisibleHandle> = (
  props,
  ref,
) => {
  const { selfInfo, updateSelfInfo } = useUserStore();
  const [form] = Form.useForm();
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  const [modalType, setModalType] = useState(selfInfo.email ? 1 : 0);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setLoading] = useState(false);

  const sendCodeHandle = async () => {
    await form.validateFields(["newEmail"]);
    try {
      await emailSendCodeApi({
        email: form.getFieldValue("newEmail"),
        usedFor: 1,
      });
      setCountdown(60);
      feedbackToast({ msg: "验证码已发送" });
    } catch (err) {
      errorHandle(err);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
        if (countdown === 1) {
          clearTimeout(timer);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const bindEmail = async () => {
    const params = (await form.getFieldsValue(["newEmail", "newCode"])) as FormParams;
    try {
      setLoading(true);
      await emailVerifyCodeApi({
        email: params.newEmail,
        verifyCode: params.newCode,
        usedFor: 1,
      });
      await emailBindApi({
        email: params.newEmail,
        verifyCode: params.newCode,
        usedFor: 1,
      });
      updateSelfInfo({ email: params.newEmail });
      feedbackToast({ msg: "绑定成功" });
      closeOverlay();
    } catch (error) {
      errorHandle(error);
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = () => {
    console.log("修改邮箱");
    setModalType(0);
    setCountdown(0);
  };

  const onFinish = () => {
    if (modalType === 0) {
      bindEmail();
    } else if (modalType === 1) {
      updateEmail();
    }
  };

  return (
    <Modal
      footer={null}
      open={isOverlayOpen}
      onCancel={closeOverlay}
      destroyOnClose
      width={430}
      className="no-padding-modal"
      centered
    >
      <div className="p-5 text-base">{`${modalType === 1 ? "修改" : "绑定"}邮箱`}</div>
      <Form
        form={form}
        colon={false}
        labelCol={{ span: 5 }}
        onFinish={onFinish}
        className="sub-label-form p-6.5"
        autoComplete="off"
        initialValues={{ oldEmail: selfInfo.email }}
      >
        {/* {modalType === 1 && (
          <>
            <Form.Item label="邮箱" name="oldEmail" required>
              <Input disabled placeholder="请输入您的邮箱" />
            </Form.Item>

            <Form.Item label="验证码" required>
              <Space.Compact>
                <Form.Item
                  name="oldCode"
                  rules={[
                    { required: true, message: "验证码不能为空" },
                    {
                      pattern: RegMap.verifyCode,
                      message: "请输入6位数字的验证码",
                    },
                  ]}
                >
                  <Input allowClear placeholder="请输入您的验证码" />
                </Form.Item>
                <Button type="primary" onClick={sendCodeHandle} loading={countdown > 0}>
                  {countdown > 0 ? `${countdown}秒` : "发送验证码"}
                </Button>
              </Space.Compact>
            </Form.Item>
          </>
        )} */}
        <Form.Item
          label="邮箱"
          name="newEmail"
          rules={[
            { required: true, message: "邮箱不能为空" },
            { type: "email", message: "邮箱格式不正确" },
          ]}
          hidden={modalType !== 0}
        >
          <Input placeholder="请输入您的邮箱" />
        </Form.Item>

        <Form.Item label="验证码" required hidden={modalType !== 0}>
          <Space.Compact block>
            <Form.Item
              name="newCode"
              rules={[
                { required: true, message: "验证码不能为空" },
                {
                  pattern: RegMap.verifyCode,
                  message: "请输入6位数字的验证码",
                },
              ]}
              className="mb-0 flex-1"
            >
              <Input allowClear placeholder="请输入您的验证码" />
            </Form.Item>
            <Button type="primary" onClick={sendCodeHandle} loading={countdown > 0}>
              {countdown > 0 ? `${countdown}秒` : "发送验证码"}
            </Button>
          </Space.Compact>
        </Form.Item>

        <Form.Item className="mb-0 flex justify-end">
          <Button className="mr-3.5 px-6" onClick={closeOverlay}>
            取消
          </Button>
          <Button className="px-6" type="primary" htmlType="submit" loading={isLoading}>
            完成
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default memo(forwardRef(UpdateEmailModal));
