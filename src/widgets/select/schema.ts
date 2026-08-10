import { publicSchema } from "../base/publicSchema";
import { selectConfig } from "./config";
import type { Widget } from "../base/types";

export function createSelectWidget(id: string): Widget {
  return {
    ...publicSchema(id, "select"),
    name: selectConfig.name,
    label: selectConfig.displayName,
    position: { x: 0, y: 0, w: 280, h: 40, zIndex: 1 },
    style: { ...selectConfig.defaultStyle },
    props: { ...selectConfig.defaultProps },
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
      { label: "Option 3", value: "3" },
    ],
  };
}
