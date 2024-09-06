import { Button, DatePicker, Form, Input, Modal, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { forwardRef, ForwardRefRenderFunction, memo, useEffect, useRef } from "react";
import { useMutation } from "react-query";

import { errorHandle } from "@/api/errorHandle";
import { BusinessUserInfo, updateBusinessUserInfo } from "@/api/login";
import PrefixPhone from "@/components/FormComponent/PrefixPhone";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { useUserStore } from "@/store";
import { getPhoneReg } from "@/utils/common";

import UpdateEmailModal from "../UpdateEmailModal";

interface Props {
  refreshSelfInfo: () => void;
}
const EditSelfInfo: ForwardRefRenderFunction<OverlayVisibleHandle, Props> = (
  props,
  ref,
) => {
  const { refreshSelfInfo } = props;
  const [form] = Form.useForm();
  const selfInfo = useUserStore((state) => state.selfInfo);
  const updateSelfInfo = useUserStore((state) => state.updateSelfInfo);
  const UpdateEmailModalRef = useRef<OverlayVisibleHandle>(null);

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  const { isLoading, mutate } = useMutation(updateBusinessUserInfo, {
    onError: errorHandle,
  });

  const onFinish = (value: BusinessUserInfo & { birth: Dayjs }) => {
    const options = {
      userID: selfInfo.userID,
      nickname: value.nickname,
      email: value.email,
      gender: value.gender,
      birth: value.birth.unix() * 1000,
    };
    mutate(options, {
      onSuccess: () => {
        updateSelfInfo(options);
        refreshSelfInfo();
        closeOverlay();
      },
    });
  };

  useEffect(() => {
    if (!isOverlayOpen) return;
    form.setFieldValue("email", selfInfo.email);
    refreshSelfInfo();
  }, [selfInfo.email]);

  return (
    <Modal
      title={null}
      footer={null}
      closable={false}
      open={isOverlayOpen}
      onCancel={closeOverlay}
      destroyOnClose
      maskStyle={{
        opacity: 0,
        transition: "none",
      }}
      width={484}
      className="no-padding-modal"
      maskTransitionName=""
    >
      <div className="flex bg-[var(--chat-bubble)] p-5">
        <span className="text-base font-medium">编辑资料</span>
      </div>
      <Form
        form={form}
        colon={false}
        requiredMark={false}
        labelCol={{ span: 3 }}
        onFinish={onFinish}
        className="sub-label-form p-6.5"
        autoComplete="off"
        initialValues={{ ...selfInfo, birth: dayjs(selfInfo.birth) }}
      >
        <Form.Item
          label="用户名"
          name="nickname"
          rules={[{ required: true, max: 20, message: "请输入用户名！" }]}
        >
          <Input disabled />
        </Form.Item>
        <Form.Item label="性别" name="gender">
          <Select>
            <Select.Option value={1}>男</Select.Option>
            <Select.Option value={2}>女</Select.Option>
            {/* <Select.Option value={0}>隐藏</Select.Option> */}
          </Select>
        </Form.Item>
        <Form.Item label="生日" name="birth">
          <DatePicker
            disabledDate={(current) => current && current > dayjs().endOf("day")}
          />
        </Form.Item>
        <Form.Item
          label="手机号"
          name="phoneNumber"
          rules={[
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
            disabled
            addonBefore={<PrefixPhone SelectProps={{ disabled: true }} />}
          />
        </Form.Item>

        <Form.Item label="邮箱">
          <div className="flex w-full items-center">
            <Form.Item
              name="email"
              rules={[{ type: "email", message: "请输入正确邮箱！" }]}
              className="mb-0 flex-1"
            >
              <Input disabled />
            </Form.Item>
            {!selfInfo.email && (
              <span
                className="mx-2 shrink-0 cursor-pointer text-[var(--primary)]"
                onClick={() => UpdateEmailModalRef.current?.openOverlay()}
              >
                修改
              </span>
            )}
          </div>
        </Form.Item>

        <Form.Item className="mb-0 flex justify-end">
          <Button
            className="mr-3.5 border-0 bg-[var(--chat-bubble)] px-6"
            onClick={closeOverlay}
          >
            取消
          </Button>
          <Button className="px-6" type="primary" htmlType="submit" loading={isLoading}>
            完成
          </Button>
        </Form.Item>
      </Form>
      <UpdateEmailModal ref={UpdateEmailModalRef} />
    </Modal>
  );
};

export default memo(forwardRef(EditSelfInfo));
