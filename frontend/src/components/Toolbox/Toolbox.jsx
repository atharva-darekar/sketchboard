import { useDispatch, useSelector } from "react-redux";
import {
  COLORS,
  FILL_TOOL_TYPES,
  SIZE_TOOL_TYPES,
  STROKE_TOOL_TYPES,
  TOOL_ITEMS,
  BG_STYLES,
} from "../../constants";
import classes from "./Toolbox.module.css";
import classNames from "classnames";
import { toolBoxActions, boardActions } from "../../store/store";
import {
  FaPaintBrush,
  FaSlash,
  FaRegCircle,
  FaArrowRight,
  FaFont,
  FaEraser,
  FaMousePointer,
} from "react-icons/fa";
import { FaHand } from "react-icons/fa6";
import { LuRectangleHorizontal } from "react-icons/lu";

const TOOL_META = {
  [TOOL_ITEMS.BRUSH]: { label: "Brush", Icon: FaPaintBrush },
  [TOOL_ITEMS.LINE]: { label: "Line", Icon: FaSlash },
  [TOOL_ITEMS.RECTANGLE]: { label: "Rectangle", Icon: LuRectangleHorizontal },
  [TOOL_ITEMS.CIRCLE]: { label: "Circle", Icon: FaRegCircle },
  [TOOL_ITEMS.ARROW]: { label: "Arrow", Icon: FaArrowRight },
  [TOOL_ITEMS.TEXT]: { label: "Text", Icon: FaFont },
  [TOOL_ITEMS.ERASER]: { label: "Eraser", Icon: FaEraser },
  [TOOL_ITEMS.SELECT]: { label: "Select", Icon: FaMousePointer },
  [TOOL_ITEMS.PAN]: { label: "Pan", Icon: FaHand },
};

const BG_PRESETS = [
  {
    key: BG_STYLES.PLAIN,
    label: "Plain",
    preview: (
      <div className="w-full h-full rounded-md border border-zinc-600/60 bg-[#f8f7f4]" />
    ),
  },
  {
    key: BG_STYLES.WHITE,
    label: "White",
    preview: (
      <div className="w-full h-full rounded-md border border-zinc-400 bg-white" />
    ),
  },
  {
    key: BG_STYLES.GRID,
    label: "Grid",
    preview: (
      <div
        className="w-full h-full rounded-md border border-zinc-600/60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.12) 1px,transparent 1px)",
          backgroundSize: "10px 10px",
          backgroundColor: "#f8f7f4",
        }}
      />
    ),
  },
  {
    key: BG_STYLES.DOTS,
    label: "Dots",
    preview: (
      <div
        className="w-full h-full rounded-md border border-zinc-600/60"
        style={{
          backgroundImage:
            "radial-gradient(circle,rgba(0,0,0,0.35) 1px,transparent 1px)",
          backgroundSize: "8px 8px",
          backgroundColor: "#f8f7f4",
        }}
      />
    ),
  },
  {
    key: BG_STYLES.LINES,
    label: "Lines",
    preview: (
      <div
        className="w-full h-full rounded-md border border-zinc-600/60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.12) 1px,transparent 1px)",
          backgroundSize: "10px 10px",
          backgroundColor: "#f8f7f4",
        }}
      />
    ),
  },
  {
    key: BG_STYLES.DARK,
    label: "Dark",
    preview: (
      <div
        className="w-full h-full rounded-md border border-zinc-700/80 bg-[#0f0f11]"
        style={{
          backgroundImage:
            "radial-gradient(circle,rgba(124,58,237,0.35) 1px,transparent 1px)",
          backgroundSize: "8px 8px",
        }}
      />
    ),
  },
];

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500 mb-2.5">
      {children}
    </p>
  );
}

function Swatch({ color, active, onClick }) {
  const isWhite = color === "#ffffff";
  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: color }}
      className={classNames(
        "w-5.5 h-5.5 rounded-md transition-all duration-100 cursor-pointer shrink-0",
        isWhite ? "border border-zinc-500" : "border border-transparent",
        active
          ? "scale-110 shadow-[0_0_0_2px_rgba(167,139,250,0.7),0_0_8px_rgba(124,58,237,0.45)]"
          : "hover:scale-110 hover:shadow-[0_0_0_2px_rgba(167,139,250,0.35)]",
      )}
      aria-label={`Select color ${color}`}
    />
  );
}

function CustomColorPicker({ value, onChange, title }) {
  return (
    <div
      className="relative shrink-0 cursor-pointer"
      style={{ width: 26, height: 26 }}
      title={title}
    >
      {}
      <div className="absolute inset-0 rounded-md border-2 border-dashed border-zinc-400 pointer-events-none z-10" />
      {}
      <div
        className="absolute inset-0.75 rounded-sm"
        style={{ backgroundColor: value }}
      />
      {}
      <input
        type="color"
        value={value}
        onChange={onChange}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
      />
      {}
      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-700 border border-zinc-500 flex items-center justify-center pointer-events-none z-20">
        <span className="text-[8px] text-zinc-200 leading-none">+</span>
      </div>
    </div>
  );
}

function PanelDivider() {
  return <div className="h-px bg-white/6 my-3" />;
}

function Toolbox() {
  const dispatch = useDispatch();
  const activeToolItem = useSelector((s) => s.toolbar.activeToolItem);
  const activeStrokeColor = useSelector(
    (s) => s.toolbox[activeToolItem]?.stroke,
  );
  const activeFillColor = useSelector((s) => s.toolbox[activeToolItem]?.fill);
  const size = useSelector((s) => s.toolbox[activeToolItem]?.size);
  const bgStyle = useSelector((s) => s.board.bgStyle);

  const { setStrokeColor, setFillColor, setSize } = toolBoxActions;
  const { setBgStyle } = boardActions;

  const meta = TOOL_META[activeToolItem];
  if (!meta) return null;
  const { label, Icon } = meta;

  const showStroke = STROKE_TOOL_TYPES.includes(activeToolItem);
  const showFill = FILL_TOOL_TYPES.includes(activeToolItem);
  const showSize =
    SIZE_TOOL_TYPES.includes(activeToolItem) ||
    activeToolItem === TOOL_ITEMS.ERASER;
  const showBg =
    activeToolItem === TOOL_ITEMS.SELECT || activeToolItem === TOOL_ITEMS.PAN;

  const sizeMin = activeToolItem === TOOL_ITEMS.TEXT ? 16 : 1;
  const sizeMax =
    activeToolItem === TOOL_ITEMS.TEXT
      ? 64
      : activeToolItem === TOOL_ITEMS.ERASER
        ? 5
        : 10;
  const sizeStep = activeToolItem === TOOL_ITEMS.TEXT ? 4 : 1;
  const sizeLabel =
    activeToolItem === TOOL_ITEMS.TEXT
      ? "Font size"
      : activeToolItem === TOOL_ITEMS.ERASER
        ? "Eraser size"
        : "Stroke width";

  const colorValues = Object.values(COLORS);

  return (
    <div
      className="
        absolute top-1/2 left-4 -translate-y-1/2 z-10
        w-44.5
        bg-[#111113]/92 backdrop-blur-2xl
        border border-white/6.5
        rounded-2xl
        shadow-[0_12px_40px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.055)]
        overflow-hidden
      "
    >
      {}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/6">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/25 text-violet-300 text-sm">
          <Icon />
        </div>
        <span className="text-sm font-semibold text-zinc-200">{label}</span>
      </div>

      <div className="px-4 py-3.5 flex flex-col gap-0">
        {}
        {showBg && (
          <>
            <SectionLabel>Background</SectionLabel>
            <div className="grid grid-cols-6 gap-1 mb-1">
              {BG_PRESETS.map(({ key, label: bgLabel, preview }) => (
                <div
                  key={key}
                  title={bgLabel}
                  onClick={() => dispatch(setBgStyle(key))}
                  className={classNames(
                    "w-full aspect-square cursor-pointer rounded-md transition-all duration-100",
                    bgStyle === key
                      ? "shadow-[0_0_0_2px_rgba(167,139,250,0.8),0_0_8px_rgba(124,58,237,0.4)] scale-110"
                      : "hover:scale-105",
                  )}
                >
                  {preview}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600 mt-1 mb-0">
              Active:{" "}
              <span className="text-zinc-400">
                {BG_PRESETS.find((b) => b.key === bgStyle)?.label}
              </span>
            </p>
          </>
        )}

        {}
        {showStroke && (
          <>
            <SectionLabel>Stroke</SectionLabel>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {}
              <CustomColorPicker
                value={activeStrokeColor ?? "#000000"}
                onChange={(e) =>
                  dispatch(
                    setStrokeColor({ activeToolItem, color: e.target.value }),
                  )
                }
                title="Custom stroke colour"
              />
              {colorValues.map((color) => (
                <Swatch
                  key={color}
                  color={color}
                  active={activeStrokeColor === color}
                  onClick={() =>
                    dispatch(setStrokeColor({ activeToolItem, color }))
                  }
                />
              ))}
            </div>
            {(showFill || showSize) && <PanelDivider />}
          </>
        )}

        {}
        {showFill && (
          <>
            <SectionLabel>Fill</SectionLabel>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {}
              <button
                onClick={() =>
                  dispatch(setFillColor({ activeToolItem, color: null }))
                }
                className={classNames(
                  classes.noFillSwatch,
                  "w-5 h-5 rounded-md border transition-all duration-100",
                  activeFillColor === null
                    ? "scale-110 shadow-[0_0_0_2px_rgba(167,139,250,0.7)]"
                    : "border-zinc-600 hover:scale-110",
                )}
                aria-label="No fill"
              />
              {}
              {activeFillColor !== null && (
                <CustomColorPicker
                  value={activeFillColor ?? "#000000"}
                  onChange={(e) =>
                    dispatch(
                      setFillColor({ activeToolItem, color: e.target.value }),
                    )
                  }
                  title="Custom fill colour"
                />
              )}
              {colorValues.map((color) => (
                <Swatch
                  key={color}
                  color={color}
                  active={activeFillColor === color}
                  onClick={() =>
                    dispatch(setFillColor({ activeToolItem, color }))
                  }
                />
              ))}
            </div>
            {showSize && <PanelDivider />}
          </>
        )}

        {}
        {showSize && (
          <>
            <div className="flex items-center justify-between mb-2.5">
              <SectionLabel>{sizeLabel}</SectionLabel>
              <span className="text-xs font-mono text-violet-300 bg-violet-600/15 border border-violet-500/20 px-1.5 py-0.5 rounded-md -mt-0.5">
                {size}
              </span>
            </div>
            <input
              type="range"
              min={sizeMin}
              max={sizeMax}
              step={sizeStep}
              value={size}
              onChange={(e) =>
                dispatch(setSize({ size: e.target.value, activeToolItem }))
              }
              className={classes.slider}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Toolbox;
