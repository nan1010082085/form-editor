import { publicSchema } from "../base/publicSchema";
import { radioConfig } from "./config";
import type { Widget } from "../base/types";

export function createRadioWidget(id: string): Widget {
  return {
    ...publicSchema(id, "radio"),
    name: radioConfig.name,
    label: radioConfig.displayName,
    position: { x: 0, y: 0, w: 280, h: 40, zIndex: 1 },
    style: { ...radioConfig.defaultStyle },
    props: { ...radioConfig.defaultProps },
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
      { label: "Option 3", value: "3" },
    ],
  };
}
