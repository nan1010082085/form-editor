import type { WidgetConfig } from "../base/types";

export const richtextConfig: WidgetConfig = {
  name: "FgRichtext",
  displayName: "Rich Text",
  description:
    "Multi-line rich text (plain mode)",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    height: "200px",
  },
  defaultProps: {
    placeholder: "请输入内容",
    readonly: false,
  },
  exposedValues: [
    { key: "value", type: "string", description: "当前字段值", example: "" },
  ],
  configPanels: ["events", "linkages", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: [],
    props: [
      {
        key: "placeholder",
        label: "Placeholder",
        type: "input",
        default: "请输入内容",
      },
      { key: "readonly", label: "Read Only", type: "switch", default: false },
      {
        key: "showToolbar",
        label: "Show Toolbar",
        type: "switch",
        default: true,
      },
    ],
  },
};
