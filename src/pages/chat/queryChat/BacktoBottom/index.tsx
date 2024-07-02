import clsx from "clsx";
import { FC } from "react";

import back_bottom from "@/assets/images/common/back_bottom.png";
import back_bottom_active from "@/assets/images/common/back_bottom_active.png";

interface Props {
  show: boolean;
  count: number;
  onClick?: () => void;
}
const BacktoBottom: FC<Props> = (props) => {
  const { show, count, onClick } = props;

  return (
    <div onClick={onClick}>
      <div
        className={clsx(
          "group absolute bottom-32 right-5 translate-x-20 cursor-pointer",
          show && "!translate-x-0",
        )}
        style={{ transition: "transform .5s" }}
      >
        {Boolean(count) && (
          <div className="absolute -top-4 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-green-500 text-white ">
            <span>{count}</span>
          </div>
        )}
        <img className="group-hover:hidden" src={back_bottom} alt="" width={54} />
        <img
          className="hidden group-hover:block"
          src={back_bottom_active}
          alt=""
          width={54}
        />
      </div>
    </div>
  );
};

export default BacktoBottom;
