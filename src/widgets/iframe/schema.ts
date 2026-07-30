import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createIframeWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgIframe",
    type: "iframe",
    field: "iframe",
    label: "iframe",
    props: {},
    style: { "width": "100%", "height": "auto" },
    position: { x: 0, y: 0, w: 280, h: 100, zIndex: 1 },
    children: [],
  };
}
