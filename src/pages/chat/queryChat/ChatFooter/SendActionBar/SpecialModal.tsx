import { Button, Form, Input, Modal } from "antd";
import { forwardRef, ForwardRefRenderFunction, useState } from "react";

import { apiSendAdvancedMessage } from "@/api/chatApi";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { useConversationStore } from "@/store";
import emitter from "@/utils/events";

interface FormParams {
  text: string;
}

const SpecialModal: ForwardRefRenderFunction<OverlayVisibleHandle> = (_, ref) => {
  const { currentConversation } = useConversationStore();
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const [form] = Form.useForm();

  const [isLoading, setLoading] = useState(false);

  const onFinish = async (params: FormParams) => {
    if (!isOverlayOpen || !currentConversation) return;
    setLoading(true);
    try {
      await apiSendAdvancedMessage({
        recvID: currentConversation.userID,
        groupID: currentConversation.groupID,
        content: params.text,
      });
      setTimeout(() => {
        emitter.emit("CHAT_LIST_SCROLL_TO_BOTTOM", false);
      }, 300);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    closeOverlay();
  };

  return (
    <Modal
      footer={null}
      centered
      open={isOverlayOpen}
      onCancel={handleClose}
      className="no-padding-modal"
      width={430}
    >
      <div className="p-5 text-base">特殊消息(不可编辑)</div>
      <Form layout="vertical" form={form} onFinish={onFinish} className="p-5 pt-0">
        <Form.Item
          label=""
          name="text"
          rules={[{ required: true, message: "内容不能为空" }]}
        >
          <Input.TextArea
            allowClear
            placeholder="请输入您的内容"
            rows={4}
            onPressEnter={(e) => {
              if (e.shiftKey) return;
              e.preventDefault();
              form.submit();
            }}
          />
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

export default forwardRef(SpecialModal);
