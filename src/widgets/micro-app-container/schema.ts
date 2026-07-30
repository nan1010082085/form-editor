import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createMicroAppContainerWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgMicroAppContainer",
    type: "micro-app-container",
    field: "microappcontainer",
    label: "Micro App Container",
    props: {},
    style: { "width": "100%", "height": "auto" },
    position: { x: 0, y: 0, w: 280, h: 100, zIndex: 1 },
    children: [],
  };
}
