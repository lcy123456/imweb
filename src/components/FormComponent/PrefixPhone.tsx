import { Form, FormItemProps, Select, SelectProps } from "antd";

import { areaCode } from "@/pages/login/areaCode";

interface Props {
  FormItemProps?: FormItemProps;
  SelectProps?: SelectProps;
}

const PrefixPhone = (props: Props) => {
  return (
    <Form.Item name="areaCode" noStyle {...props.FormItemProps}>
      <Select options={areaCode} className="!w-[78px]" {...props.SelectProps} />
    </Form.Item>
  );
};

export default PrefixPhone;
