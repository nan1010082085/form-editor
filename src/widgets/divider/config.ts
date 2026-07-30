import type { WidgetConfig } from "../base/types";
export const dividerConfig: WidgetConfig = {
  name: "FgDivider",
  displayName: "Divider",
  description: "Divider for content separation",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
  },
  configPanels: ["events"],
  defaultProps: {
    direction: "horizontal" as "horizontal" | "vertical",
    contentPosition: "center" as "left" | "center" | "right",
    content: "",
  },
  propertyPanel: {
    basic: ["field", "label"],
    style: ["margin", "padding"],
    props: [
      {
        key: "direction",
        label: "Direction",
        type: "select",
        options: [
          { label: "Horizontal", value: "horizontal" },
          { label: "Vertical", value: "vertical" },
        ],
        default: "horizontal",
      },
      {
        key: "contentPosition",
        label: "Text Position",
        type: "select",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        default: "center",
      },
      { key: "content", label: "Text Content", type: "input", default: "" },
    ],
  },
};
