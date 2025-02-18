import { CloseOutlined } from "@ant-design/icons";
import { Button, Divider, Form, FormInstance, Input, Modal } from "antd";
import md5 from "md5";
import { forwardRef, ForwardRefRenderFunction, memo } from "react";

import { useModifyPassword } from "@/api/login";
import { RegMap } from "@/constants";
import { useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";

import { OverlayVisibleHandle, useOverlayVisible } from "../../hooks/useOverlayVisible";

interface PasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePassword: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const [form] = Form.useForm();

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  return (
    <Modal
      title={null}
      footer={null}
      closable={false}
      open={isOverlayOpen}
      centered
      onCancel={closeOverlay}
      destroyOnClose
      // afterClose={() => form.resetFields()}
      maskStyle={{
        opacity: 0,
        transition: "none",
      }}
      width={320}
      className="no-padding-modal"
      maskTransitionName=""
    >
      <ChangePasswordContent form={form} closeOverlay={closeOverlay} />
    </Modal>
  );
};

export default memo(forwardRef(ChangePassword));

export const ChangePasswordContent = ({
  form,
  closeOverlay,
}: {
  form?: FormInstance;
  closeOverlay?: () => void;
}) => {
  const { isLoading: passwordUpdating, mutate: updatePassword } = useModifyPassword();

  const onFinish = (value: PasswordFormData) => {
    updatePassword(
      {
        currentPassword: md5(value.oldPassword),
        newPassword: md5(value.newPassword),
        userID: useUserStore.getState().selfInfo.userID,
      },
      {
        onSuccess: () => {
          closeOverlay?.();
          feedbackToast({
            msg: "修改成功，请重新登录！",
            onClose: () => {
              useUserStore.getState().userLogout();
            },
          });
        },
      },
    );
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <span className="text-base font-medium">修改密码</span>
        <CloseOutlined
          className="cursor-pointer !text-[#8e9aaf]"
          rev={undefined}
          onClick={closeOverlay}
        />
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={onFinish}
        className="bold-label-form"
        //   onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item
          label="原密码:"
          name="oldPassword"
          className="mb-2 px-5"
          rules={[{ required: true, message: "请输入原密码！" }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="新密码:"
          name="newPassword"
          className="mb-2 px-5"
          rules={[
            {
              required: true,
              pattern: RegMap.pwd,
              message: "6-20位字符，必须包含字母和数字！",
            },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="确认密码:"
          name="confirmPassword"
          className="mb-2 px-5"
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("两次输入的密码不一致!"));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Divider className="border-1 my-5 border-[var(--gap-text)]" />

        <Form.Item wrapperCol={{ offset: 10, span: 14 }}>
          <div className="flex">
            <Button
              className="mr-3.5 border-0 bg-[var(--chat-bubble)] px-6"
              onClick={closeOverlay}
            >
              取消
            </Button>
            <Button
              className="px-6"
              type="primary"
              htmlType="submit"
              loading={passwordUpdating}
            >
              确定
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};
