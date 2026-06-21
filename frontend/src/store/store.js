import { createSlice, configureStore } from "@reduxjs/toolkit";

import { BG_STYLES, COLORS, TOOL_ACTION_TYPES, TOOL_ITEMS } from "../constants";
import { isPointNearElement, isSegmentNearElement } from "../utils/math";

const toolbarInitialState = {
  activeToolItem: TOOL_ITEMS.BRUSH,
};

const toolbarSlice = createSlice({
  name: "toolbar",
  initialState: toolbarInitialState,
  reducers: {
    setToolItem: (state, action) => {
      state.activeToolItem = action.payload;
    },
  },
});

const boardInitialState = {
  toolActionType: TOOL_ACTION_TYPES.NONE,
  elements: [],
  history: [[]],
  historyIndex: 0,
  lastPointerPosition: null,
  elementsCountAtActionStart: null,

  canvasId: null,
  userId: null,
  sharedWith: [],
  title: "Untitled",
  panOffset: { x: 0, y: 0 },
  selectedElementIndex: null,
  resizeHandle: null,
  dragStartPosition: null,
  bgStyle: BG_STYLES.GRID,
};
const boardSlice = createSlice({
  name: "board",
  initialState: boardInitialState,
  reducers: {
    handleBoardMouseDown: (state, action) => {
      const {
        activeToolItem,
        activeFillColor,
        activeStrokeColor,
        clientX,
        clientY,
        size,
      } = action.payload;
      if (state.toolActionType === TOOL_ACTION_TYPES.WRITING) return;

      state.elementsCountAtActionStart = state.elements.length;

      switch (activeToolItem) {
        case TOOL_ITEMS.PAN: {
          state.toolActionType = TOOL_ACTION_TYPES.PANNING;

          state.dragStartPosition = {
            mouseX: action.payload.screenX,
            mouseY: action.payload.screenY,
            panSnapX: state.panOffset.x,
            panSnapY: state.panOffset.y,
          };
          break;
        }

        case TOOL_ITEMS.SELECT: {
          const ctx = document.getElementById("canvas")?.getContext("2d");

          const sel = state.selectedElementIndex;
          if (sel !== null && state.elements[sel]) {
            const el = state.elements[sel];
            const handle = getHandleAtPoint(el, clientX, clientY);
            if (handle) {
              state.toolActionType = TOOL_ACTION_TYPES.RESIZING;
              state.resizeHandle = handle;
              state.dragStartPosition = {
                mouseX: clientX,
                mouseY: clientY,
                elemSnap: JSON.parse(JSON.stringify(el)),
              };
              break;
            }
          }

          let hitIndex = null;
          for (let i = state.elements.length - 1; i >= 0; i--) {
            if (
              isPointNearElement(state.elements[i], clientX, clientY, 8, ctx)
            ) {
              hitIndex = i;
              break;
            }
          }

          state.selectedElementIndex = hitIndex;

          if (hitIndex !== null) {
            const el = state.elements[hitIndex];
            state.toolActionType = TOOL_ACTION_TYPES.SELECTING;
            state.dragStartPosition = {
              mouseX: clientX,
              mouseY: clientY,
              elemSnap: JSON.parse(JSON.stringify(el)),
            };
          }
          break;
        }

        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW: {
          const newElement = {
            toolItem: activeToolItem,
            x1: clientX,
            x2: clientX,
            y1: clientY,
            y2: clientY,
            seed: Math.floor(Math.random() * 1000 + 1),
            stroke: activeStrokeColor,
            fill: activeFillColor,
            size,
          };
          state.toolActionType = TOOL_ACTION_TYPES.DRAWING;
          state.elements.push(newElement);
          break;
        }
        case TOOL_ITEMS.BRUSH: {
          const newBrushElement = {
            toolItem: activeToolItem,
            points: [{ x: clientX, y: clientY }],
            stroke: activeStrokeColor,
          };
          state.toolActionType = TOOL_ACTION_TYPES.DRAWING;
          state.elements.push(newBrushElement);
          break;
        }
        case TOOL_ITEMS.ERASER: {
          state.toolActionType = TOOL_ACTION_TYPES.ERASING;
          state.lastPointerPosition = { x: clientX, y: clientY };
          const context = document.getElementById("canvas")?.getContext("2d");
          if (!context) break;
          state.elements = state.elements.filter((element) => {
            return !isPointNearElement(
              element,
              clientX,
              clientY,
              size * 6,
              context,
            );
          });
          break;
        }
        case TOOL_ITEMS.TEXT: {
          const newTextElement = {
            toolItem: activeToolItem,
            x1: clientX,
            y1: clientY,
            text: "",
            stroke: activeStrokeColor,
            size,
          };
          state.toolActionType = TOOL_ACTION_TYPES.WRITING;
          state.elements.push(newTextElement);
          break;
        }
        default:
          break;
      }
    },

    handleBoardMouseMove: (state, action) => {
      if (state.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
      const { clientX, clientY, size } = action.payload;

      if (state.toolActionType === TOOL_ACTION_TYPES.PANNING) {
        const { screenX, screenY } = action.payload;
        if (!state.dragStartPosition) return;
        const dx = screenX - state.dragStartPosition.mouseX;
        const dy = screenY - state.dragStartPosition.mouseY;
        state.panOffset.x = state.dragStartPosition.panSnapX + dx;
        state.panOffset.y = state.dragStartPosition.panSnapY + dy;
        return;
      }

      if (state.toolActionType === TOOL_ACTION_TYPES.SELECTING) {
        if (state.selectedElementIndex === null || !state.dragStartPosition)
          return;
        const dx = clientX - state.dragStartPosition.mouseX;
        const dy = clientY - state.dragStartPosition.mouseY;
        const snap = state.dragStartPosition.elemSnap;
        const el = state.elements[state.selectedElementIndex];
        if (snap.x1 !== undefined) el.x1 = snap.x1 + dx;
        if (snap.y1 !== undefined) el.y1 = snap.y1 + dy;
        if (snap.x2 !== undefined) el.x2 = snap.x2 + dx;
        if (snap.y2 !== undefined) el.y2 = snap.y2 + dy;
        if (snap.points) {
          el.points = snap.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
        }
        return;
      }

      if (state.toolActionType === TOOL_ACTION_TYPES.RESIZING) {
        if (state.selectedElementIndex === null || !state.dragStartPosition)
          return;
        const snap = state.dragStartPosition.elemSnap;
        const el = state.elements[state.selectedElementIndex];
        const handle = state.resizeHandle;

        if (handle === "start") {
          el.x1 = clientX;
          el.y1 = clientY;
        } else if (handle === "end") {
          el.x2 = clientX;
          el.y2 = clientY;
        } else if (handle === "br") {
          el.x2 = clientX;
          el.y2 = clientY;
        } else if (handle === "bl") {
          el.x1 = clientX;
          el.y2 = clientY;
        } else if (handle === "tr") {
          el.x2 = clientX;
          el.y1 = clientY;
        } else if (handle === "tl") {
          el.x1 = clientX;
          el.y1 = clientY;
        } else if (handle === "text-br") {
          const ctx = document.getElementById("canvas")?.getContext("2d");
          if (ctx) {
            const dx = clientX - state.dragStartPosition.mouseX;
            const dy = clientY - state.dragStartPosition.mouseY;
            const delta = Math.max(dx, dy);
            el.size = Math.max(8, Number(snap.size) + Math.round(delta / 4));
          }
        }
        return;
      }

      if (state.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
        const idx = state.elements.length - 1;
        const toolItem = state.elements[idx].toolItem;
        switch (toolItem) {
          case TOOL_ITEMS.LINE:
          case TOOL_ITEMS.RECTANGLE:
          case TOOL_ITEMS.CIRCLE:
          case TOOL_ITEMS.ARROW: {
            state.elements[idx].x2 = clientX;
            state.elements[idx].y2 = clientY;
            break;
          }
          case TOOL_ITEMS.BRUSH: {
            const newPoint = { x: clientX, y: clientY };
            state.elements[idx].points.push(newPoint);
            break;
          }
          default: {
            throw new Error("Tool Type not recognized");
          }
        }
      } else if (state.toolActionType === TOOL_ACTION_TYPES.ERASING) {
        const context = document.getElementById("canvas")?.getContext("2d");
        if (!context) return;
        const previousPoint = state.lastPointerPosition ?? {
          x: clientX,
          y: clientY,
        };
        state.elements = state.elements.filter((element) => {
          return !isSegmentNearElement(
            element,
            previousPoint.x,
            previousPoint.y,
            clientX,
            clientY,
            size * 6,
            context,
          );
        });
        state.lastPointerPosition = { x: clientX, y: clientY };
      }
    },

    handleBoardMouseUp: (state) => {
      const wasSelectingOrResizing =
        state.toolActionType === TOOL_ACTION_TYPES.SELECTING ||
        state.toolActionType === TOOL_ACTION_TYPES.RESIZING;

      state.toolActionType = TOOL_ACTION_TYPES.NONE;
      state.lastPointerPosition = null;
      state.dragStartPosition = null;
      state.resizeHandle = null;

      const elementCountChanged =
        state.elements.length !== state.elementsCountAtActionStart;
      if (elementCountChanged || wasSelectingOrResizing) {
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }
        state.history.push(JSON.parse(JSON.stringify(state.elements)));
        state.historyIndex += 1;
      }

      state.elementsCountAtActionStart = null;
    },

    handleOnBlur: (state, action) => {
      const { text } = action.payload;
      const idx = state.elements.length - 1;
      if (state.elements[idx]) state.elements[idx].text = text;
      state.toolActionType = TOOL_ACTION_TYPES.NONE;
      state.lastPointerPosition = null;
    },

    handleUndo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex -= 1;
        state.elements = state.history[state.historyIndex];
        state.selectedElementIndex = null;
      }
    },
    handleRedo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex += 1;
        state.elements = state.history[state.historyIndex];
        state.selectedElementIndex = null;
      }
    },
    deleteSelectedElement: (state) => {
      if (state.selectedElementIndex !== null) {
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }
        state.history.push(JSON.parse(JSON.stringify(state.elements)));
        state.historyIndex += 1;

        state.elements.splice(state.selectedElementIndex, 1);
        state.selectedElementIndex = null;
        state.dragStartPosition = null;
        state.resizeHandle = null;
        state.toolActionType = TOOL_ACTION_TYPES.NONE;
      }
    },

    setCanvasId: (state, action) => {
      state.canvasId = action.payload;
    },
    setTitle: (state, action) => {
      state.title = action.payload;
    },
    setSharedWith: (state, action) => {
      state.sharedWith = action.payload;
    },
    syncBoard: (state, action) => {
      const { elements, bgStyle } = action.payload;
      if (elements) state.elements = elements;
      if (bgStyle) state.bgStyle = bgStyle;
    },
    hydrateBoard: (state, action) => {
      const {
        canvasId,
        userId,
        sharedWith,
        title,
        elements,
        history,
        historyIndex,
        panOffset,
        bgStyle,
      } = action.payload;
      state.canvasId = canvasId;
      state.userId = userId;
      state.sharedWith = sharedWith || [];
      state.title = title || "Untitled";
      state.elements = elements || [];
      state.history = history || [[]];
      state.historyIndex = historyIndex || 0;
      state.panOffset = panOffset || { x: 0, y: 0 };
      state.bgStyle = bgStyle || BG_STYLES.GRID;

      state.toolActionType = TOOL_ACTION_TYPES.NONE;
      state.lastPointerPosition = null;
      state.elementsCountAtActionStart = null;
      state.selectedElementIndex = null;
      state.resizeHandle = null;
      state.dragStartPosition = null;
    },
    clearSelection: (state) => {
      state.selectedElementIndex = null;
      state.dragStartPosition = null;
    },
    setBgStyle: (state, action) => {
      state.bgStyle = action.payload;
    },
  },
});

function getHandleAtPoint(el, px, py, threshold = 10) {
  const HIT = threshold;
  const near = (x, y) => Math.hypot(px - x, py - y) < HIT;

  const t = el.toolItem;
  if (t === TOOL_ITEMS.LINE || t === TOOL_ITEMS.ARROW) {
    if (near(el.x1, el.y1)) return "start";
    if (near(el.x2, el.y2)) return "end";
  } else if (t === TOOL_ITEMS.TEXT) {
    const canvas = document.getElementById("canvas");
    const ctx = canvas?.getContext("2d");
    let w = 60;
    if (ctx) {
      ctx.font = `${el.size}px Caveat`;
      w = ctx.measureText(el.text || " ").width;
    }
    const h = Number(el.size) * 1.25;
    if (near(el.x1 + w, el.y1 + h)) return "text-br";
  } else if (t === TOOL_ITEMS.RECTANGLE || t === TOOL_ITEMS.CIRCLE) {
    const minX = Math.min(el.x1, el.x2);
    const maxX = Math.max(el.x1, el.x2);
    const minY = Math.min(el.y1, el.y2);
    const maxY = Math.max(el.y1, el.y2);
    if (near(minX, minY)) return "tl";
    if (near(maxX, minY)) return "tr";
    if (near(minX, maxY)) return "bl";
    if (near(maxX, maxY)) return "br";
  }
  return null;
}

const toolBoxIntitalState = {
  [TOOL_ITEMS.LINE]: {
    stroke: COLORS.BLACK,
    size: 1,
  },
  [TOOL_ITEMS.RECTANGLE]: {
    stroke: COLORS.BLACK,
    size: 1,
    fill: null,
  },
  [TOOL_ITEMS.CIRCLE]: {
    stroke: COLORS.BLACK,
    size: 1,
    fill: null,
  },
  [TOOL_ITEMS.ARROW]: {
    stroke: COLORS.BLACK,
    size: 1,
  },
  [TOOL_ITEMS.BRUSH]: {
    stroke: COLORS.BLACK,
  },
  [TOOL_ITEMS.ERASER]: {
    size: 1,
  },
  [TOOL_ITEMS.TEXT]: {
    stroke: COLORS.BLACK,
    size: 16,
  },
};

const toolBoxSlice = createSlice({
  name: "toolbox",
  initialState: toolBoxIntitalState,
  reducers: {
    setStrokeColor: (state, action) => {
      const { activeToolItem, color } = action.payload;
      state[activeToolItem].stroke = color;
    },
    setFillColor: (state, action) => {
      const { activeToolItem, color } = action.payload;
      state[activeToolItem].fill = color;
    },
    setSize: (state, action) => {
      const { activeToolItem, size } = action.payload;
      state[activeToolItem].size = size;
    },
  },
});

const authInitialState = {
  token: localStorage.getItem("wbToken") ?? null,
  refreshToken: localStorage.getItem("wbRefreshToken") ?? null,
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: authInitialState,
  reducers: {
    setCredentials: (state, action) => {
      const { accessToken, refreshToken, user } = action.payload;
      state.token = accessToken;
      state.refreshToken = refreshToken ?? state.refreshToken;
      state.user = user ?? null;
      state.error = null;
      localStorage.setItem("wbToken", accessToken);
      if (refreshToken) localStorage.setItem("wbRefreshToken", refreshToken);
    },
    clearCredentials: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem("wbToken");
      localStorage.removeItem("wbRefreshToken");
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const boardActions = boardSlice.actions;

export const toolbarActions = toolbarSlice.actions;

export const toolBoxActions = toolBoxSlice.actions;

export const authActions = authSlice.actions;

const store = configureStore({
  reducer: {
    toolbar: toolbarSlice.reducer,
    board: boardSlice.reducer,
    toolbox: toolBoxSlice.reducer,
    auth: authSlice.reducer,
  },
});

export default store;
