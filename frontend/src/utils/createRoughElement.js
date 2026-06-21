import rough from "roughjs/bin/rough";
import { ARROW_LENGTH, TOOL_ITEMS } from "../constants";
import { getArrowHeadsCoordinates } from "./math";

const generator = rough.generator();

export const createRoughElement = ({
  toolItem,
  x1,
  y1,
  x2,
  y2,
  seed,
  stroke,
  fill,
  size,
}) => {
  const options = { seed: seed };
  if (stroke) {
    options.stroke = stroke;
  }
  if (fill) {
    options.fillStyle = "solid";
    options.fill = fill;
  }
  if (size) {
    options.strokeWidth = size;
  }
  switch (toolItem) {
    case TOOL_ITEMS.LINE: {
      return generator.line(x1, y1, x2, y2, options);
    }

    case TOOL_ITEMS.RECTANGLE: {
      return generator.rectangle(x1, y1, x2 - x1, y2 - y1, options);
    }

    case TOOL_ITEMS.CIRCLE: {
      return generator.ellipse(
        x1 + (x2 - x1) / 2,
        y1 + (y2 - y1) / 2,
        x2 - x1,
        y2 - y1,
        options,
      );
    }

    case TOOL_ITEMS.ARROW: {
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(
        x1,
        y1,
        x2,
        y2,
        ARROW_LENGTH,
      );
      const points = [
        [x1, y1],
        [x2, y2],
        [x3, y3],
        [x2, y2],
        [x4, y4],
      ];
      return generator.linearPath(points, options);
    }

    default:
      return generator.line(x1, y1, x2, y2, options);
  }
};
