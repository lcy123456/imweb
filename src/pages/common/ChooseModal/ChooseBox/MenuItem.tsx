import { RightOutlined } from "@ant-design/icons";

import { ChooseMenuItem } from ".";

const MenuItem = ({
  menu,
  menuClick,
}: {
  menu: ChooseMenuItem;
  menuClick: (idx: number) => void;
}) => (
  <div
    className="flex items-center justify-between rounded-md px-4 py-2 hover:bg-[var(--primary-active)]"
    key={menu.idx}
    onClick={() => menuClick(menu.idx)}
  >
    <div className="flex items-center">
      <img width={36} src={menu.icon} alt="" />
      <div className="ml-3.5 font-sMedium">{menu.title}</div>
    </div>
    <RightOutlined className="text-[#8e9ab0]" rev={undefined} />
  </div>
);

export default MenuItem;
