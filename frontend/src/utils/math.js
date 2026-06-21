import getStroke from "perfect-freehand";
import { TOOL_ITEMS } from "../constants";
import { getSvgPathFromStroke } from "./createFreeHandPath";

export const getArrowHeadsCoordinates = (x1, y1, x2, y2, arrowLength) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);

  const x3 = x2 - arrowLength * Math.cos(angle - Math.PI / 6);
  const y3 = y2 - arrowLength * Math.sin(angle - Math.PI / 6);

  const x4 = x2 - arrowLength * Math.cos(angle + Math.PI / 6);
  const y4 = y2 - arrowLength * Math.sin(angle + Math.PI / 6);

  return {
    x3,
    y3,
    x4,
    y4,
  };
};

export const isPointCloseToLine = (
  x1,
  y1,
  x2,
  y2,
  pointX,
  pointY,
  eraserThreshold,
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.hypot(pointX - x1, pointY - y1) < eraserThreshold;
  }

  let t = ((pointX - x1) * dx + (pointY - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.hypot(pointX - projX, pointY - projY) < eraserThreshold;
};

export const isNearPoint = (x, y, x1, y1) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5;
};

const isPointInsideRectangle = (x1, y1, x2, y2, pointX, pointY) => {
  return (
    pointX >= Math.min(x1, x2) &&
    pointX <= Math.max(x1, x2) &&
    pointY >= Math.min(y1, y2) &&
    pointY <= Math.max(y1, y2)
  );
};

const isPointInsideEllipse = (cx, cy, rx, ry, px, py) => {
  const dx = px - cx;
  const dy = py - cy;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
};

const distanceToEllipse = (cx, cy, rx, ry, px, py) => {
  const dx = px - cx;
  const dy = py - cy;
  const rx2 = rx * rx;
  const ry2 = ry * ry;

  const f = (dx * dx) / rx2 + (dy * dy) / ry2 - 1;

  const gradX = (2 * dx) / rx2;
  const gradY = (2 * dy) / ry2;
  const gradMag = Math.hypot(gradX, gradY);

  if (gradMag === 0) {
    return Math.min(rx, ry);
  }

  return Math.abs(f) / gradMag;
};

const isPointInsideTextBounds = (
  context,
  x,
  y,
  text,
  textSize,
  stroke,
  pointX,
  pointY,
  eraserThreshold,
) => {
  if (!context) return false;

  context.save();
  context.fillStyle = stroke;
  context.font = `${Number(textSize)}px Caveat`;
  const lines = (text || " ").split("\n");
  const width = Math.max(...lines.map((l) => context.measureText(l).width));
  context.restore();

  const height = Number(textSize) * 1.25 * lines.length;

  return (
    pointX >= x - eraserThreshold &&
    pointX <= x + width + eraserThreshold &&
    pointY >= y - eraserThreshold &&
    pointY <= y + height + eraserThreshold
  );
};

export const isPointNearElement = (
  element,
  pointX,
  pointY,
  eraserThreshold,
  context,
) => {
  const { x1, y1, x2, y2, toolItem, fill, stroke, points, text, size } =
    element;

  switch (toolItem) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.ARROW:
      return isPointCloseToLine(
        x1,
        y1,
        x2,
        y2,
        pointX,
        pointY,
        eraserThreshold,
      );

    case TOOL_ITEMS.RECTANGLE:
      if (
        isPointCloseToLine(x1, y1, x2, y1, pointX, pointY, eraserThreshold) ||
        isPointCloseToLine(x2, y1, x2, y2, pointX, pointY, eraserThreshold) ||
        isPointCloseToLine(x2, y2, x1, y2, pointX, pointY, eraserThreshold) ||
        isPointCloseToLine(x1, y2, x1, y1, pointX, pointY, eraserThreshold)
      ) {
        return true;
      }
      if (fill) {
        return isPointInsideRectangle(x1, y1, x2, y2, pointX, pointY);
      }
      return false;

    case TOOL_ITEMS.CIRCLE: {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;

      if (rx === 0 || ry === 0) {
        return isPointCloseToLine(
          x1,
          y1,
          x2,
          y2,
          pointX,
          pointY,
          eraserThreshold,
        );
      }

      if (fill && isPointInsideEllipse(cx, cy, rx, ry, pointX, pointY)) {
        return true;
      }

      return (
        distanceToEllipse(cx, cy, rx, ry, pointX, pointY) < eraserThreshold
      );
    }

    case TOOL_ITEMS.BRUSH:
      return context.isPointInPath(
        new Path2D(getSvgPathFromStroke(getStroke(points))),
        pointX,
        pointY,
      );

    case TOOL_ITEMS.TEXT:
      return isPointInsideTextBounds(
        context,
        x1,
        y1,
        text,
        size,
        stroke,
        pointX,
        pointY,
        eraserThreshold,
      );

    default:
      throw new Error("Type not recognized");
  }
};

export const isSegmentNearElement = (
  element,
  startX,
  startY,
  endX,
  endY,
  eraserThreshold,
  context,
) => {
  const distance = Math.hypot(endX - startX, endY - startY);
  const stepSize = Math.max(1, Number(eraserThreshold));
  const steps = Math.max(1, Math.ceil(distance / stepSize));

  for (let step = 0; step <= steps; step++) {
    const progress = step / steps;
    const pointX = startX + (endX - startX) * progress;
    const pointY = startY + (endY - startY) * progress;

    if (isPointNearElement(element, pointX, pointY, eraserThreshold, context)) {
      return true;
    }
  }

  return false;
};

export const midPointBtw = (p1, p2) => {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2,
  };
};
