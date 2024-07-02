import { Image as AImage, ImageProps, Spin } from "antd";
import clsx from "clsx";
import { memo, useEffect, useState } from "react";

interface Props extends ImageProps {
  src: string;
}
const Myimage = (props: Props) => {
  const { src } = props;

  const [isLoad, setIsLoad] = useState(true);
  const [loadTip, setLoadTip] = useState("");

  useEffect(() => {
    handleLoadImg();
  }, [src]);

  const handleLoadImg = () => {
    setIsLoad(true);
    const image = new Image();
    image.src = src;
    image.onload = () => {
      setIsLoad(false);
      setLoadTip("");
    };
    image.onerror = () => {
      setLoadTip("加载失败，请点击重试");
      setIsLoad(false);
    };
  };

  const handleReload = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!loadTip) return;
    e.stopPropagation();
    handleLoadImg();
    setLoadTip("");
  };

  return (
    <Spin spinning={isLoad} className="relative">
      {loadTip && (
        <div
          className="absolute top-1/2 -translate-y-1/2 cursor-pointer text-center"
          onClick={handleReload}
        >
          {loadTip}
        </div>
      )}
      <AImage
        key={loadTip}
        preview={false}
        {...props}
        className={clsx("cursor-pointer object-contain", props.className)}
      />
    </Spin>
  );
};

export default memo(Myimage);
