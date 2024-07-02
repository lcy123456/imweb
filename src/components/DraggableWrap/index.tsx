import {} from "antd";
import { CSSProperties, FC, memo, ReactNode, useRef, useState } from "react";
import type { DraggableData, DraggableEvent } from "react-draggable";
import Draggable from "react-draggable";

interface DraggableWrapProps {
  children?: ReactNode;
  rootClassName?: string;
  rootStyle?: CSSProperties;
  ignoreClasses?: string;
}

const DraggableWrap: FC<DraggableWrapProps> = (props) => {
  const { rootClassName, rootStyle } = props;
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const draggleRef = useRef<HTMLDivElement>(null);

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  return (
    <div
      className={`absolute left-0 top-0 z-[2000] ${rootClassName}`}
      style={{ ...rootStyle }}
    >
      <Draggable
        allowAnyClick
        cancel={props.ignoreClasses}
        bounds={bounds}
        onStart={(event, uiData) => onStart(event, uiData)}
      >
        <div ref={draggleRef}>{props.children}</div>
      </Draggable>
    </div>
  );
};

export default memo(DraggableWrap);
