import { useSelector, useDispatch } from "react-redux";
import { toolbarActions, boardActions } from "../../store/store";
import { TOOL_ITEMS } from "../../constants";
import classNames from "classnames";
import {
  FaSlash,
  FaRegCircle,
  FaArrowRight,
  FaPaintBrush,
  FaEraser,
  FaUndoAlt,
  FaRedoAlt,
  FaFont,
  FaDownload,
  FaMousePointer,
  FaTrashAlt,
} from "react-icons/fa";
import { FaHand } from "react-icons/fa6";
import { LuRectangleHorizontal } from "react-icons/lu";

function WithTooltip({ label, kbd, children }) {
  return (
    <div className="relative group">
      {children}
      <div
        className="
          absolute top-full left-1/2 -translate-x-1/2 mt-2.5 z-50
          flex items-center gap-1.5 px-2 py-1 rounded-md
          bg-zinc-900 border border-zinc-700/80
          text-xs text-zinc-300 whitespace-nowrap
          opacity-0 pointer-events-none
          group-hover:opacity-100 transition-opacity duration-150
          shadow-lg
        "
      >
        {label}
        {kbd && (
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 border border-zinc-700 px-1 rounded">
            {kbd}
          </span>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ item, Icon, label, kbd, active, onClick }) {
  return (
    <WithTooltip label={label} kbd={kbd}>
      <button
        id={`toolbar-${item.toLowerCase()}`}
        onClick={onClick}
        className={classNames(
          "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 border text-[15px]",
          active
            ? "bg-violet-600/25 border-violet-500/50 text-violet-300 shadow-[0_0_14px_rgba(124,58,237,0.35)]"
            : "border-transparent text-zinc-500 hover:bg-violet-500/10 hover:border-violet-400/20 hover:text-violet-300",
        )}
      >
        <Icon />
      </button>
    </WithTooltip>
  );
}

function ActionBtn({ id, Icon, label, kbd, colorHover = "zinc", onClick }) {
  const hoverCls =
    colorHover === "emerald"
      ? "hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20"
      : "hover:bg-zinc-700/40 hover:text-zinc-200 hover:border-zinc-700/60";

  return (
    <WithTooltip label={label} kbd={kbd}>
      <button
        id={id}
        onClick={onClick}
        className={`flex items-center justify-center w-9 h-9 rounded-xl border border-transparent
          text-zinc-500 text-[15px] transition-all duration-150 ${hoverCls}`}
      >
        <Icon />
      </button>
    </WithTooltip>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-white/[0.07] mx-0.5 shrink-0" />;
}

const DRAW_TOOLS = [
  { item: TOOL_ITEMS.BRUSH, Icon: FaPaintBrush, label: "Brush" },
  { item: TOOL_ITEMS.LINE, Icon: FaSlash, label: "Line" },
  {
    item: TOOL_ITEMS.RECTANGLE,
    Icon: LuRectangleHorizontal,
    label: "Rectangle",
  },
  { item: TOOL_ITEMS.CIRCLE, Icon: FaRegCircle, label: "Circle" },
  { item: TOOL_ITEMS.ARROW, Icon: FaArrowRight, label: "Arrow" },
  { item: TOOL_ITEMS.TEXT, Icon: FaFont, label: "Text" },
];

function Toolbar() {
  const { handleUndo, handleRedo, deleteSelectedElement } = boardActions;
  const dispatch = useDispatch();
  const activeToolItem = useSelector((s) => s.toolbar.activeToolItem);
  const selectedElementIndex = useSelector((s) => s.board.selectedElementIndex);
  const { setToolItem } = toolbarActions;

  function handleDownloadClick() {
    const canvas = document.getElementById("canvas");
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext("2d");

    ctx.drawImage(canvas, 0, 0);

    const anchor = document.createElement("a");
    anchor.href = tempCanvas.toDataURL("image/png");
    anchor.download = "sketchboard.png";
    anchor.click();
  }

  return (
    <div
      className="
        absolute left-1/2 top-5 -translate-x-1/2 z-10
        flex items-center gap-0.5 px-2.5 py-2
        bg-[#111113]/92 backdrop-blur-2xl
        border border-white/6.5
        rounded-2xl
        shadow-[0_12px_40px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.055)]
      "
    >
      {}
      <ToolBtn
        item={TOOL_ITEMS.SELECT}
        Icon={FaMousePointer}
        label="Select & Move"
        active={activeToolItem === TOOL_ITEMS.SELECT}
        onClick={() => dispatch(setToolItem(TOOL_ITEMS.SELECT))}
      />
      <ToolBtn
        item={TOOL_ITEMS.PAN}
        Icon={FaHand}
        label="Pan Canvas"
        active={activeToolItem === TOOL_ITEMS.PAN}
        onClick={() => dispatch(setToolItem(TOOL_ITEMS.PAN))}
      />

      <Divider />

      {}
      {DRAW_TOOLS.map(({ item, Icon, label, kbd }) => (
        <ToolBtn
          key={item}
          item={item}
          Icon={Icon}
          label={label}
          kbd={kbd}
          active={activeToolItem === item}
          onClick={() => dispatch(setToolItem(item))}
        />
      ))}

      <Divider />

      {}
      <ToolBtn
        item={TOOL_ITEMS.ERASER}
        Icon={FaEraser}
        label="Eraser"
        active={activeToolItem === TOOL_ITEMS.ERASER}
        onClick={() => dispatch(setToolItem(TOOL_ITEMS.ERASER))}
      />

      <Divider />

      {}
      {selectedElementIndex !== null && (
        <>
          <ActionBtn
            id="toolbar-delete-selected"
            Icon={FaTrashAlt}
            label="Delete Selected"
            kbd="Del"
            colorHover="zinc"
            onClick={() => dispatch(deleteSelectedElement())}
          />
          <Divider />
        </>
      )}

      <Divider />

      {}
      <ActionBtn
        id="toolbar-undo"
        Icon={FaUndoAlt}
        label="Undo"
        kbd="⌃Z"
        onClick={() => dispatch(handleUndo())}
      />
      <ActionBtn
        id="toolbar-redo"
        Icon={FaRedoAlt}
        label="Redo"
        kbd="⌃Y"
        onClick={() => dispatch(handleRedo())}
      />

      <Divider />

      {}
      <ActionBtn
        id="toolbar-download"
        Icon={FaDownload}
        label="Export PNG"
        colorHover="emerald"
        onClick={handleDownloadClick}
      />
    </div>
  );
}

export default Toolbar;
