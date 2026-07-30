import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createMicroAppWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgMicroApp",
    type: "micro-app",
    field: "microapp",
    label: "Micro App",
    props: {},
    style: { "width": "100%", "height": "auto" },
    position: { x: 0, y: 0, w: 280, h: 100, zIndex: 1 },
    children: [],
  };
}
