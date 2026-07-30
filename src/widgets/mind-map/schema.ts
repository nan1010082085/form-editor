import { nanoid } from "nanoid";
import type { Widget } from "../base/types";
export function createMindMapWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(), name: "FgMindMap", type: "mind-map",
    field: "mindMap", label: "Mind Map",
    props: { data: { id: "root", label: "Central Topic", children: [] }, layout: "vertical", showIcon: false, expandAll: true },
    style: { width: "100%", height: "400px" },
    position: { x: 0, y: 0, w: 400, h: 300, zIndex: 1 }, children: [],
  };
}
