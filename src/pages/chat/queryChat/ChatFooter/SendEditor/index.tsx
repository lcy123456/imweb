import "draft-js/dist/Draft.css";

import { useLatest } from "ahooks";
import { convertFromHTML, convertToHTML, EntityKey } from "draft-convert";
import {
  CompositeDecorator,
  ContentBlock,
  ContentState,
  DraftDecoratorComponentProps,
  DraftEntityMutability,
  DraftHandleValue,
  Editor,
  EditorState,
  getDefaultKeyBinding,
  Modifier,
  RawDraftEntity,
} from "draft-js";
import { MessageType, SessionType } from "open-im-sdk-wasm";
import { GroupMemberItem } from "open-im-sdk-wasm/lib/types/entity";
import { AtMsgParams } from "open-im-sdk-wasm/lib/types/params";
import {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  KeyboardEvent,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import MyPopover, { ContentItem, menuItemType } from "@/components/MyPopover";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { ExMessageItem, useConversationStore } from "@/store";
import { feedbackToast, getNewText, getRangeAt } from "@/utils/common";
import emojis, { EmojiItem, emojiPlaceholderToContext } from "@/utils/emojis";
import emitter from "@/utils/events";

import { AtAllId, AtMemberItemType } from "..";
import styles from "../chat-footer.module.scss";
import { useFileMessage } from "../SendActionBar/useFileMessage";
import { useSendMessage } from "../useSendMessage";
import PasteFileModal, { PreviewFile } from "./PasteFileModal";

export interface QuillInsetProps {
  node?: HTMLElement | Text;
  text?: string;
  isZeroWidth: boolean;
}

interface Props {
  classNameWrap?: string;
  atFilterText: string;
  atActionBarVisible: boolean;
  getTypingMessage: (text: string) => void;
  setAtActionBarVisible: (val: boolean) => void;
  setAtFilterText: (val: string) => void;
  setParentHtml: (val: string) => void;
}

export interface SendEditorHandle {
  setEditorHtml: (val: string) => void;
  clickAtMember: (data: AtMemberItemType) => void;
  removeAtParams: () => void;
  enterToSend: () => void;
  setEditorFocus: () => void;
}

const editorEmptyValue = "<p></p>";

const SendEditor = (props: Props, ref: ForwardedRef<SendEditorHandle>) => {
  const {
    atFilterText,
    atActionBarVisible,
    getTypingMessage,
    setAtActionBarVisible,
    setAtFilterText,
    setParentHtml,
  } = props;
  const { getVideoSnshotFile } = useFileMessage();

  const editorRef = useRef<Editor>(null);
  const pasteFileModalRef = useRef<OverlayVisibleHandle>(null);
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty(decorator),
  );
  const [html, setHtml] = useState<string>("");
  const { sendMessage, sendEditMessage } = useSendMessage();
  const { quoteMessage, isEditQuoteMessage, updateQuoteMessage, currentConversation } =
    useConversationStore();
  const conversationID = currentConversation?.conversationID;

  const latestHtml = useLatest(html);
  const latestQuoteMessage = useLatest(quoteMessage);
  const latestIsEditQuoteMessage = useLatest(isEditQuoteMessage);

  const startRangeOffset = useRef<number>(0);
  const latestRange = useRef<Range>();
  const [pasteFiles, setPasteFiles] = useState<File[]>([]);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);

  const handleHTMLToState = (html: string, isFocus = true) => {
    setHtml(html);
    setParentHtml(html);
    const contentState = convertContentStateFormHTML(html);
    const newEditorState = EditorState.createWithContent(contentState, decorator);
    setEditorState(newEditorState);
    isFocus && handleEditorFocus(newEditorState);
  };

  const handleStateToHTML = (editorState: EditorState) => {
    setEditorState(editorState);
    const contentState = editorState.getCurrentContent();
    const newHtml = convertContentStateToHTML(contentState);
    // console.log("xxx format newHtml", html, newHtml);
    if (html !== newHtml) {
      if (newHtml === editorEmptyValue) {
        setHtml("");
        setParentHtml("");
      } else {
        getTypingMessage("正在输入中...");
        setHtml(newHtml);
        setParentHtml(newHtml);
      }
    }
    return newHtml;
  };

  useEffect(() => {
    handleHTMLToState(currentConversation?.draftText || "", true);
    return () => {
      if (currentConversation?.draftText !== latestHtml.current && conversationID) {
        IMSDK.setConversationDraft({
          conversationID,
          draftText: latestHtml.current === editorEmptyValue ? "" : latestHtml.current,
        });
      }
      handleHTMLToState("", false);
    };
  }, [conversationID]);

  useEffect(() => {
    emitter.on("EDITOR_INSET_EMOJI", handleInsetEmoji);
    return () => {
      emitter.off("EDITOR_INSET_EMOJI", handleInsetEmoji);
    };
  }, [editorState]);

  const handleChange = (editorState: EditorState) => {
    const newHtml = handleStateToHTML(editorState);
    const { text, type } = getNewText(newHtml, html || editorEmptyValue);
    if (type === "add" && text === "@") {
      setTimeout(handleEnterAt, 0);
    }

    if (startRangeOffset.current) {
      setTimeout(() => {
        latestRange.current = getRangeAt();
        const { startContainer, startOffset } = latestRange.current;
        const text =
          startContainer.textContent?.slice(
            startRangeOffset.current - 1,
            startOffset,
          ) || "";
        text.includes("@") ? setAtFilterText(text) : removeAtParams();
      }, 0);
    }
  };
  // const handleBeforeInput = (command: string): DraftHandleValue => {
  //   if (command === "@") {
  //     setTimeout(handleEnterAt, 0);
  //   }
  //   return "not-handled";
  // };
  const handleKeyCommand = (command: string): DraftHandleValue => {
    if (command === "enter") {
      enterToSend();
      return "handled";
    }
    return "not-handled";
  };
  const myKeyBindingFn = (e: KeyboardEvent): string | null => {
    if (e.keyCode === 13 /* `Enter` key */) {
      if (!e.nativeEvent.shiftKey) {
        return "enter";
      }
    }
    return getDefaultKeyBinding(e);
  };
  const handlePastedFiles = (files: File[]): DraftHandleValue => {
    handleFiles(files);
    return "not-handled";
  };
  const handlePastedText = (text: string): DraftHandleValue => {
    text = formatPastedText(text);
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const blockMap = convertContentStateFormHTML(text).getBlockMap();
    const contentStateWithFragment = Modifier.replaceWithFragment(
      contentState,
      selection,
      blockMap,
    );
    const newEditorState = EditorState.push(
      editorState,
      contentStateWithFragment,
      "insert-fragment",
    );
    handleStateToHTML(newEditorState);
    return true as unknown as DraftHandleValue;
  };

  const handleFiles = async (files: File[]) => {
    const result: PreviewFile[] = [];
    const resultFile: PreviewFile[] = [];
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      switch (true) {
        case file.type.includes("image"):
          result.push({
            type: "image",
            preview: URL.createObjectURL(file),
            key: file.name,
          });
          break;
        case file.type.includes("video"):
          const snshotFile = await getVideoSnshotFile(file);
          result.push({
            type: "video",
            preview: URL.createObjectURL(snshotFile),
            key: file.name,
          });
          break;
        default:
          resultFile.push({ type: "file", preview: file, key: file.name });
          break;
      }
    }
    setPasteFiles(files);
    setPreviewFiles([...result, ...resultFile]);
    pasteFileModalRef.current?.openOverlay();
  };

  const formatPastedText = (str: string, isFormatNode = true) => {
    str = emojiPlaceholderToContext(str);
    str = `<div>${
      isFormatNode ? str.replace(/</g, "&lt;").replace(/>/g, "&gt;") : str
    }</div>`
      .split("\n")
      .join("</div><div>");
    return str;
  };

  const enterToSend = async () => {
    if (!html || !conversationID || atActionBarVisible) return;
    let message: ExMessageItem | boolean = false;
    if (html.includes("at-el")) {
      message = await getAtMessage();
    } else {
      message = await getTextMessage();
    }
    if (message) {
      if (latestIsEditQuoteMessage.current && latestQuoteMessage.current) {
        await handleEditMessage(message);
      } else {
        sendMessage({ message });
      }
    }
    handleHTMLToState("", true);
    if (latestQuoteMessage.current) {
      updateQuoteMessage();
    }
    IMSDK.setConversationDraft({
      conversationID,
      draftText: "",
    });
  };

  const handleEnterAt = () => {
    if (currentConversation?.conversationType === SessionType.Single) return;
    setAtActionBarVisible(true);
    startRangeOffset.current = getRangeAt().startOffset;
    setAtFilterText("@");
  };

  const handleClickAtMember = (params: AtMemberItemType) => {
    // console.log("insertAtNode", atFilterText, params);
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();

    const cursorOffset = selection.getStartOffset();
    const startOffset = Math.max(0, cursorOffset - atFilterText.length);
    const endOffset = cursorOffset;

    const selectionState = selection.merge({
      anchorOffset: startOffset,
      focusOffset: endOffset,
    });

    const contentStateWithEntity = contentState.createEntity(
      "AT_COMPONENT",
      "IMMUTABLE",
      params,
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    const replacedContentState = Modifier.replaceText(
      contentState,
      selectionState,
      `@${params.nickname}`,
      undefined,
      entityKey,
    );

    const newEditorState = EditorState.push(
      editorState,
      replacedContentState,
      "insert-characters",
    );
    const newEditorState2 = handleInsetSpace(newEditorState);
    handleStateToHTML(newEditorState2);
    removeAtParams();
  };

  const handleInsetEmoji = (params: EmojiItem) => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();

    const contentStateWithEntity = contentState.createEntity(
      "EMOJI_COMPONENT",
      "IMMUTABLE",
      params,
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const contentStateWithText = Modifier.replaceText(
      contentState,
      selection,
      params.placeholder,
      undefined,
      entityKey,
    );

    const newEditorState = EditorState.push(
      editorState,
      contentStateWithText,
      "insert-characters",
    );
    const newEditorState2 = handleInsetSpace(newEditorState);
    handleStateToHTML(newEditorState2);
    handleEditorFocus(newEditorState2, true);
  };

  const handleInsetSpace = (editorState: EditorState) => {
    const contentState = Modifier.insertText(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      " ",
    );
    const newEditorState = EditorState.push(
      editorState,
      contentState,
      "insert-characters",
    );
    return newEditorState;
  };

  const getTextMessage = async () => {
    const cleanText = getCleanText(html);
    if (!cleanText.trim()) return false;

    if (latestQuoteMessage.current && !latestIsEditQuoteMessage.current) {
      return (
        await IMSDK.createQuoteMessage({
          text: cleanText,
          message: JSON.stringify(latestQuoteMessage.current),
        })
      ).data;
    }

    return (await IMSDK.createTextMessage(cleanText)).data;
  };

  const getAtMessage = async () => {
    const editableDiv = document.getElementById("myEditor");
    if (!editableDiv) return false;

    const params: AtMsgParams = {
      text: html,
      atUserIDList: [],
      atUsersInfo: [],
      message: undefined,
    };
    const atEls: HTMLImageElement[] = Array.from(
      editableDiv.querySelectorAll(".at-el"),
    );
    atEls.forEach((v) => {
      const { id, name, text } = v.dataset;
      if (!id || !name || !text) return;
      const reg = getConvertHTMLRegFn({
        value: text,
        id,
        name,
      }).at;
      params.text = params.text.replace(reg, `@${id} `);
      params.atUserIDList.push(id);
      params?.atUsersInfo?.push({
        atUserID: id,
        groupNickname: name,
      });
    });
    params.text = getCleanText(params.text);
    if (!latestIsEditQuoteMessage.current) {
      params.message = latestQuoteMessage.current;
    }

    const { data } = await IMSDK.createTextAtMessage({
      ...params,
      atUserIDList: params.atUserIDList.slice(0, 1),
      atUsersInfo: params.atUsersInfo?.slice(0, 1),
    });
    data.atTextElem.atUserList = params.atUserIDList;
    data.atTextElem.atUsersInfo = params.atUsersInfo;
    return data;
  };

  const getCleanText = (html: string) => {
    html = replaceEmoji2Str(html).slice(3, -4);
    return html
      .replace(/<\/p>/g, "\n")
      .replace(/(<([^>]+)>)/g, "")
      .replace(/\u200B/g, "");
  };

  const replaceEmoji2Str = (text: string) => {
    const editableDiv = document.getElementById("myEditor");
    if (!editableDiv) return text;

    const emojiEls: HTMLImageElement[] = Array.from(
      editableDiv.querySelectorAll(".emoji-el"),
    );
    emojiEls.map((v) => {
      const { context } = v.dataset;
      if (!context) return;
      const reg = getConvertHTMLRegFn({
        value: context,
      }).emoji;
      text = text.replace(reg, context);
    });
    return text;
  };

  const removeAtParams = () => {
    setAtActionBarVisible(false);
    setAtFilterText("");
    startRangeOffset.current = 0;
  };

  const handleEditMessage = async (message: ExMessageItem) => {
    const formatOldMsg = JSON.parse(
      JSON.stringify(latestQuoteMessage.current),
    ) as ExMessageItem;
    formatOldMsg.ex = JSON.stringify({
      ...JSON.parse(formatOldMsg.ex || "{}"),
      type: "edit",
      clientMsgID: formatOldMsg.clientMsgID,
    });
    // formatOldMsg.clientMsgID = message.clientMsgID;
    switch (message.contentType) {
      case MessageType.TextMessage:
        switch (formatOldMsg.contentType) {
          case MessageType.TextMessage:
            formatOldMsg.textElem = message.textElem;
            break;
          case MessageType.AtTextMessage:
            formatOldMsg.atTextElem.text = message.textElem.content;
            break;
          case MessageType.QuoteMessage:
            formatOldMsg.quoteElem.text = message.textElem.content;
            break;
        }
        break;
      case MessageType.AtTextMessage:
        formatOldMsg.atTextElem = {
          quoteMessage: formatOldMsg?.quoteElem?.quoteMessage,
          ...formatOldMsg.atTextElem,
          ...message.atTextElem,
        };
        formatOldMsg.contentType = message.contentType;
        Reflect.deleteProperty(formatOldMsg, "textElem");
        Reflect.deleteProperty(formatOldMsg, "quoteElem");
    }
    await sendEditMessage(formatOldMsg);
  };

  const handleEditorFocus = (editorState: EditorState, isCurrent = false) => {
    const position = isCurrent
      ? EditorState.forceSelection(editorState, editorState.getSelection())
      : EditorState.moveFocusToEnd(editorState);
    setEditorState(position);
    setTimeout(() => {
      editorRef.current?.focus();
    }, 100);
  };

  const setEditorHtml = (val: string) => {
    const newVal = val ? formatPastedText(val, false) : val;
    handleHTMLToState(newVal, true);
  };

  useImperativeHandle(ref, () => {
    return {
      setEditorHtml,
      clickAtMember: handleClickAtMember,
      removeAtParams: removeAtParams,
      enterToSend,
      setEditorFocus: () => handleEditorFocus(editorState),
    };
  });

  const [contextVisible, setContextVisible] = useState(false);
  const PopoverContent = useMemo(() => {
    const selection = editorState.getSelection();
    const list: menuItemType[] = [
      {
        idx: 1,
        title: "撤销",
        right_title: "Ctrl+Z",
        disabled: editorState.getUndoStack().size === 0,
      },
      {
        idx: 2,
        title: "恢复",
        right_title: "Ctrl+Y",
        disabled: editorState.getRedoStack().size === 0,
      },
      {
        idx: 3,
        title: "剪切",
        right_title: "Ctrl+X",
        disabled: selection.isCollapsed(),
        nodeKey: "cut",
      },
      {
        idx: 4,
        title: "复制",
        right_title: "Ctrl+C",
        disabled: selection.isCollapsed(),
        nodeKey: "copy",
      },
      {
        idx: 5,
        title: "粘贴",
        right_title: "Ctrl+V",
        nodeKey: "paste",
      },
      {
        idx: 6,
        title: "删除",
        disabled: selection.isCollapsed(),
        nodeKey: "delete",
      },
      {
        idx: 7,
        title: "全选",
        right_title: "Ctrl+A",
        nodeKey: "selectAll",
      },
    ];
    const handleClick = async (idx: menuItemType["idx"], menu: menuItemType) => {
      switch (idx) {
        case 1:
          setEditorState(EditorState.undo(editorState));
          break;
        case 2:
          setEditorState(EditorState.redo(editorState));
          break;
        case 5:
          try {
            const text = await navigator.clipboard.readText();
            handlePastedText(text);
          } catch {
            feedbackToast({
              error: "粘贴功能",
              msg: "无法读取剪切板内容，未授权或浏览器版本不支持",
            });
          }
          break;
        case 6:
          handlePastedText("");
          break;
        default:
          menu.nodeKey && document.execCommand(menu.nodeKey);
      }
      setContextVisible(false);
    };
    return (
      <div className="w-[150px] py-[5px]">
        {list.map((v) => {
          return (
            <div key={v.idx} onMouseDown={(e) => e.preventDefault()}>
              <ContentItem
                menu={{ ...v, className: "!px-[16px]" }}
                actionClick={handleClick}
              ></ContentItem>
            </div>
          );
        })}
      </div>
    );
  }, [editorState]);

  return (
    <MyPopover
      open={contextVisible}
      content={PopoverContent}
      onOpenChange={setContextVisible}
      trigger="contextMenu"
    >
      <div id="myEditor" className={String(styles["editor-wrap"])}>
        <Editor
          ref={editorRef}
          //   placeholder="Enter发送/Shift+Enter换行"
          editorState={editorState}
          onChange={handleChange}
          keyBindingFn={myKeyBindingFn}
          handleKeyCommand={handleKeyCommand}
          // handleBeforeInput={handleBeforeInput}
          handlePastedFiles={handlePastedFiles}
          handlePastedText={handlePastedText}
        />
        <PasteFileModal
          ref={pasteFileModalRef}
          pasteFiles={pasteFiles}
          previewFiles={previewFiles}
          sendMessage={sendMessage}
          setEditorFocus={() => handleEditorFocus(editorState, true)}
        ></PasteFileModal>
      </div>
    </MyPopover>
  );
};

export default forwardRef(SendEditor);

const getEntityStrategy = (type: string) => {
  return function (
    contentBlock: ContentBlock,
    callback: (start: number, end: number) => void,
    contentState: ContentState,
  ) {
    contentBlock.findEntityRanges((character) => {
      const entityKey = character.getEntity();
      return entityKey !== null && contentState.getEntity(entityKey).getType() === type;
    }, callback);
  };
};

const AtComponent = (props: DraftDecoratorComponentProps) => {
  const { contentState, entityKey = "", decoratedText } = props;
  const data = contentState.getEntity(entityKey).getData() as AtMemberItemType;
  return (
    <b
      className="at-el"
      data-id={data.userID}
      data-name={data.nickname}
      data-text={decoratedText}
    >
      {props.children}
    </b>
  );
};

const EmojiComponent = (props: DraftDecoratorComponentProps) => {
  const { contentState, entityKey = "" } = props;
  const data = contentState.getEntity(entityKey).getData() as EmojiItem;
  const emojiRef = useRef(null);
  const style = {
    "--url": `url("${data.src}")`,
  } as CSSProperties;
  return (
    <span ref={emojiRef} className="emoji-el" style={style} data-context={data.context}>
      {props.children}
    </span>
  );
};

const decorator = new CompositeDecorator([
  {
    strategy: getEntityStrategy("AT_COMPONENT"),
    component: AtComponent,
  },
  {
    strategy: getEntityStrategy("EMOJI_COMPONENT"),
    component: EmojiComponent,
  },
]);

const convertContentStateToHTML = (contentState: ContentState) => {
  const entityToHTML = (entity: RawDraftEntity, originalText: string) => {
    if (entity.type === "AT_COMPONENT") {
      const data = entity.data as AtMemberItemType;
      return (
        <span className="at-el" data-id={data.userID} data-name={data.nickname}>
          {originalText}
        </span>
      );
    } else if (entity.type === "EMOJI_COMPONENT") {
      const data = entity.data as EmojiItem;
      return <span className="emoji-el">{data.context}</span>;
    }
    return originalText;
  };

  return convertToHTML({
    entityToHTML,
  })(contentState);
};

const convertContentStateFormHTML = (html: string) => {
  const htmlToEntity = (
    nodeName: string,
    node: HTMLElement,
    createEntity: (
      type: string,
      mutability: DraftEntityMutability,
      data: object,
    ) => EntityKey,
  ) => {
    if (nodeName === "span" && node.className === "at-el") {
      const { id = "", name = "" } = node.dataset;
      const data = {
        userID: id,
        nickname: name,
      };
      return createEntity("AT_COMPONENT", "IMMUTABLE", data);
    }
  };

  const textToEntity = (
    text: string,
    createEntity: (
      type: string,
      mutability: DraftEntityMutability,
      data: object,
    ) => EntityKey,
  ) => {
    const result: { entity: string; offset: number; length: number; result: string }[] =
      [];
    text.replace(/\[[\u4e00-\u9fa5]{2,3}\]/g, (match, index: number) => {
      const emoji = emojis.find((v) => v.context === match);
      if (!emoji) return "";
      const entityKey = createEntity("EMOJI_COMPONENT", "IMMUTABLE", emoji);
      result.push({
        entity: entityKey,
        offset: index,
        length: match.length,
        result: emoji.placeholder,
      });
      return "";
    });
    return result;
  };

  return convertFromHTML({
    htmlToEntity,
    textToEntity,
  })(html);
};
const getConvertHTMLRegFn = (data: { value: string; id?: string; name?: string }) => {
  const { value, id, name } = data;
  return {
    at: `<span class="at-el" data-id="${id}" data-name="${name}">${value}</span>`,
    emoji: `<span class="emoji-el">${value}</span>`,
  };
};
