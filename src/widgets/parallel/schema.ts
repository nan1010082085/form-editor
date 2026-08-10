import { nanoid } from "nanoid";
import type { Widget } from "../base/types";
import { PARALLEL_MOCK_DIMENSIONS, PARALLEL_MOCK_DATA } from "./mock";

export function createParallelWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgParallel",
    type: "parallel",
    label: "Parallel Chart",
    props: {
      smooth: false,
      lineWidth: 1,
      opacity: 0.5,
      colorScheme: "default",
      dimensions: PARALLEL_MOCK_DIMENSIONS,
      data: PARALLEL_MOCK_DATA,
    },
    style: { width: "100%", height: "400px", fontSize: "14px" },
    position: { x: 0, y: 0, w: 600, h: 400, zIndex: 1 },
    children: [],
  };
}
