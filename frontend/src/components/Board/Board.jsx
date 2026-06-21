import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { boardActions } from "../../store/store";
import { TOOL_ACTION_TYPES, TOOL_ITEMS, BG_STYLES } from "../../constants";
import rough from "roughjs";
import { createRoughElement } from "../../utils/createRoughElement";
import { createFreeHandPath } from "../../utils/createFreeHandPath";
import classes from "./Board.module.css";

const ERASER_TRAIL_TTL = 200;

function drawBackground(ctx, width, height, bgStyle) {
  ctx.save();

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  switch (bgStyle) {
    case BG_STYLES.DARK: {
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(124,58,237,0.15)";
      const spacing = 28;
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case BG_STYLES.DOTS: {
      ctx.fillStyle = "#f8f7f4";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      const ds = 24;
      for (let x = 0; x < width; x += ds) {
        for (let y = 0; y < height; y += ds) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case BG_STYLES.LINES: {
      ctx.fillStyle = "#f8f7f4";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(0,0,0,0.07)";
      ctx.lineWidth = 1;
      const ls = 32;
      for (let y = 0; y < height; y += ls) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      break;
    }
    case BG_STYLES.GRID: {
      ctx.fillStyle = "#f8f7f4";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      const major = 100;
      for (let x = 0; x <= width; x += major) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += major) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(0,0,0,0.03)";
      const minor = 20;
      for (let x = 0; x <= width; x += minor) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += minor) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      break;
    }
    case BG_STYLES.WHITE: {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      break;
    }
    case BG_STYLES.PLAIN:
    default: {
      ctx.fillStyle = "#f8f7f4";
      ctx.fillRect(0, 0, width, height);
      break;
    }
  }
  ctx.restore();
}

function getElementBounds(element, ctx) {
  const { x1, y1, x2, y2, toolItem, text, size, points } = element;
  if (toolItem === TOOL_ITEMS.TEXT && ctx) {
    ctx.font = `${size}px Caveat`;
    const lines = (text || " ").split("\n");
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const h = Number(size) * 1.25 * lines.length;
    return { minX: x1, minY: y1, maxX: x1 + w, maxY: y1 + h };
  }
  if (toolItem === TOOL_ITEMS.BRUSH && points?.length) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const pad = Number(size ?? 8);
    return {
      minX: Math.min(...xs) - pad,
      minY: Math.min(...ys) - pad,
      maxX: Math.max(...xs) + pad,
      maxY: Math.max(...ys) + pad,
    };
  }
  if (x1 !== undefined && x2 !== undefined) {
    return {
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2),
    };
  }
  return null;
}

function Board() {
  const canvasRef = useRef();
  const dispatch = useDispatch();

  const activeToolItem = useSelector((s) => s.toolbar.activeToolItem);
  const toolActionType = useSelector((s) => s.board.toolActionType);
  const elements = useSelector((s) => s.board.elements);
  const panOffset = useSelector((s) => s.board.panOffset);
  const selectedIndex = useSelector((s) => s.board.selectedElementIndex);
  const bgStyle = useSelector((s) => s.board.bgStyle);
  const activeStrokeColor = useSelector(
    (s) => s.toolbox[activeToolItem]?.stroke,
  );
  const activeFillColor = useSelector((s) => s.toolbox[activeToolItem]?.fill);
  const size = useSelector((s) => s.toolbox[activeToolItem]?.size);

  const textAreaRef = useRef();

  const [eraserPreview, setEraserPreview] = useState({
    isVisible: false,
    x: 0,
    y: 0,
    trail: [],
  });

  const {
    handleBoardMouseDown,
    handleBoardMouseMove,
    handleOnBlur,
    handleBoardMouseUp,
    handleRedo,
    handleUndo,
    clearSelection,
  } = boardActions;

  const [windowSize, setWindowSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (toolActionType === TOOL_ACTION_TYPES.WRITING) {
      setTimeout(() => textAreaRef.current?.focus(), 0);
    }
  }, [toolActionType]);

  useEffect(() => {
    if (activeToolItem !== TOOL_ITEMS.ERASER) {
      setTimeout(() => {
        setEraserPreview({ isVisible: false, x: 0, y: 0, trail: [] });
      }, 0);
    }
  }, [activeToolItem]);

  useEffect(() => {
    if (!eraserPreview.trail.length) return;
    const id = setInterval(() => {
      const now = Date.now();
      setEraserPreview((p) => ({
        ...p,
        trail: p.trail.filter((pt) => now - pt.timestamp < ERASER_TRAIL_TTL),
      }));
    }, 16);
    return () => clearInterval(id);
  }, [eraserPreview.trail.length]);

  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey && e.key === "z") dispatch(handleUndo());
      if (e.ctrlKey && e.key === "y") dispatch(handleRedo());
      if (e.key === "Escape") dispatch(clearSelection());
      if (e.key === "Backspace" || e.key === "Delete") {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
        dispatch(boardActions.deleteSelectedElement());
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dispatch, handleUndo, handleRedo, clearSelection]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas.width !== windowSize.w || canvas.height !== windowSize.h) {
      canvas.width = windowSize.w;
      canvas.height = windowSize.h;
    }
    const context = canvas.getContext("2d");
    context.save();

    drawBackground(context, canvas.width, canvas.height, bgStyle);

    context.translate(panOffset.x, panOffset.y);

    const roughCanvas = rough.canvas(canvas);
    elements.forEach((element) => {
      switch (element.toolItem) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW: {
          roughCanvas.draw(createRoughElement(element));
          break;
        }
        case TOOL_ITEMS.BRUSH: {
          context.save();
          context.fillStyle = element.stroke;
          context.fill(createFreeHandPath(element));
          context.restore();
          break;
        }
        case TOOL_ITEMS.TEXT: {
          context.save();
          context.textBaseline = "top";
          context.fillStyle = element.stroke;
          context.font = `${element.size}px Caveat`;

          const lineH = Number(element.size) * 1.25;
          const lines = (element.text || "").split("\n");
          lines.forEach((line, i) => {
            context.fillText(line, element.x1, element.y1 + i * lineH);
          });
          context.restore();
          break;
        }
        default:
          break;
      }
    });

    context.restore();

    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements, panOffset, bgStyle, windowSize]);

  const updateEraserPreview = (clientX, clientY, addTrail = false) => {
    const now = Date.now();
    setEraserPreview((prev) => {
      const nextTrail = prev.trail.filter(
        (p) => now - p.timestamp < ERASER_TRAIL_TTL,
      );
      if (addTrail) nextTrail.push({ x: clientX, y: clientY, timestamp: now });
      return { isVisible: true, x: clientX, y: clientY, trail: nextTrail };
    });
  };

  const toWorld = (screenX, screenY) => ({
    wx: screenX - panOffset.x,
    wy: screenY - panOffset.y,
  });

  const handleMouseDown = (event) => {
    const { clientX, clientY } = event;
    const { wx, wy } = toWorld(clientX, clientY);

    if (activeToolItem === TOOL_ITEMS.ERASER) {
      updateEraserPreview(clientX, clientY, true);
    }
    console.log("Screen Coordinates: ", clientX, " ", clientY);
    console.log("Global coordinates: ", wx, " ", wy);
    dispatch(
      handleBoardMouseDown({
        activeToolItem,
        activeStrokeColor,
        activeFillColor,
        clientX: wx,
        clientY: wy,
        screenX: clientX,
        screenY: clientY,
        size,
      }),
    );
  };

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;
    const { wx, wy } = toWorld(clientX, clientY);

    if (activeToolItem === TOOL_ITEMS.ERASER) {
      updateEraserPreview(
        clientX,
        clientY,
        toolActionType === TOOL_ACTION_TYPES.ERASING,
      );
    }

    if (
      toolActionType !== TOOL_ACTION_TYPES.NONE &&
      toolActionType !== TOOL_ACTION_TYPES.WRITING
    ) {
      dispatch(
        handleBoardMouseMove({
          clientX: wx,
          clientY: wy,
          screenX: clientX,
          screenY: clientY,
          size,
        }),
      );
    }
  };

  const handleMouseUp = () => dispatch(handleBoardMouseUp());

  const handleMouseEnter = (event) => {
    if (activeToolItem === TOOL_ITEMS.ERASER) {
      updateEraserPreview(event.clientX, event.clientY);
    }
  };

  const handleMouseLeave = () => {
    setEraserPreview((p) => ({ ...p, isVisible: false }));
  };

  const textAreaBlurHandler = (text) => dispatch(handleOnBlur({ text }));

  const getCursorClass = () => {
    if (activeToolItem === TOOL_ITEMS.ERASER) return classes.eraserCanvas;
    if (activeToolItem === TOOL_ITEMS.PAN) {
      return toolActionType === TOOL_ACTION_TYPES.PANNING
        ? classes.panningCanvas
        : classes.panCanvas;
    }
    if (activeToolItem === TOOL_ITEMS.SELECT) return classes.selectCanvas;
    return "";
  };

  const eraserDiameter = Number(size) * 12;
  const eraserTrailPoints = eraserPreview.trail
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  const selectedElement =
    selectedIndex !== null ? elements[selectedIndex] : null;
  let selBounds = null;
  if (selectedElement) {
    const ctx = document.getElementById("canvas").getContext("2d");
    selBounds = getElementBounds(selectedElement, ctx);
    if (selBounds) {
      selBounds = {
        minX: selBounds.minX + panOffset.x,
        minY: selBounds.minY + panOffset.y,
        maxX: selBounds.maxX + panOffset.x,
        maxY: selBounds.maxY + panOffset.y,
      };
    }
  }

  const HANDLE_SIZE = 8;

  return (
    <>
      {}
      {toolActionType === TOOL_ACTION_TYPES.WRITING && (
        <textarea
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top: elements[elements.length - 1]?.y1 + panOffset.y,
            left: elements[elements.length - 1]?.x1 + panOffset.x,
            fontSize: `${elements[elements.length - 1]?.size}px`,
            color: elements[elements.length - 1]?.stroke,
            lineHeight: 1.25,
          }}
          onBlur={(e) => textAreaBlurHandler(e.target.value)}
        />
      )}

      {}
      {activeToolItem === TOOL_ITEMS.ERASER && (
        <svg className={classes.eraserOverlay}>
          {eraserPreview.trail.length > 1 && (
            <polyline
              points={eraserTrailPoints}
              className={classes.eraserTrail}
              strokeWidth={eraserDiameter}
            />
          )}
          {eraserPreview.isVisible && (
            <>
              <circle
                cx={eraserPreview.x}
                cy={eraserPreview.y}
                r={eraserDiameter / 2}
                className={classes.eraserCursorFill}
              />
              <circle
                cx={eraserPreview.x}
                cy={eraserPreview.y}
                r={eraserDiameter / 2}
                className={classes.eraserCursorRing}
              />
            </>
          )}
        </svg>
      )}

      {}
      {activeToolItem === TOOL_ITEMS.SELECT && selBounds && (
        <svg className={classes.selectionOverlay}>
          {}
          <rect
            x={selBounds.minX - 4}
            y={selBounds.minY - 4}
            width={selBounds.maxX - selBounds.minX + 8}
            height={selBounds.maxY - selBounds.minY + 8}
            className={classes.selectionBox}
          />
          {}
          {selectedElement?.toolItem === TOOL_ITEMS.LINE ||
          selectedElement?.toolItem === TOOL_ITEMS.ARROW ? (
            <>
              <rect
                x={selectedElement.x1 + panOffset.x - HANDLE_SIZE / 2}
                y={selectedElement.y1 + panOffset.y - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                className={classes.resizeHandle}
              />
              <rect
                x={selectedElement.x2 + panOffset.x - HANDLE_SIZE / 2}
                y={selectedElement.y2 + panOffset.y - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                className={classes.resizeHandle}
              />
            </>
          ) : (
            <>
              <rect
                x={selBounds.minX - 4 - HANDLE_SIZE / 2}
                y={selBounds.minY - 4 - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                className={classes.resizeHandle}
              />
              <rect
                x={selBounds.maxX + 4 - HANDLE_SIZE / 2}
                y={selBounds.minY - 4 - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                className={classes.resizeHandle}
              />
              <rect
                x={selBounds.minX - 4 - HANDLE_SIZE / 2}
                y={selBounds.maxY + 4 - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                className={classes.resizeHandle}
              />
              <rect
                x={selBounds.maxX + 4 - HANDLE_SIZE / 2}
                y={selBounds.maxY + 4 - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                className={classes.resizeHandle}
              />
            </>
          )}
        </svg>
      )}

      {}
      <canvas
        id="canvas"
        ref={canvasRef}
        className={getCursorClass()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
      />
    </>
  );
}

export default Board;
