import { publicSchema } from "../base/publicSchema";
import { treeSelectConfig } from "./config";
import type { Widget } from "../base/types";

export function createTreeSelectWidget(id: string): Widget {
  return {
    ...publicSchema(id, "tree-select"),
    name: treeSelectConfig.name,
    label: treeSelectConfig.displayName,
    position: { x: 0, y: 0, w: 280, h: 40, zIndex: 1 },
    style: { ...treeSelectConfig.defaultStyle },
    props: { ...treeSelectConfig.defaultProps },
    options: [
      {
        label: "Node One",
        value: "1",
        children: [
          { label: "Child Node 1-1", value: "1-1" },
          { label: "Child Node 1-2", value: "1-2" },
        ],
      },
      {
        label: "Node Two",
        value: "2",
        children: [{ label: "Child Node 2-1", value: "2-1" }],
      },
      { label: "Node Three", value: "3" },
    ],
  };
}
