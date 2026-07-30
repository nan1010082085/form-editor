import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createFlexZoneWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgFlexZone",
    type: "flex-zone",
    field: "flexZone",
    label: "Flex Zone",
    props: { minHeight: 100, padding: 8, background: "transparent" },
    style: { width: "100%", height: "300px" },
    position: { x: 0, y: 0, w: 280, h: 200, zIndex: 1 },
    children: [],
  };
}
