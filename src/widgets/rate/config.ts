import type { WidgetConfig } from "../base/types";

export const rateConfig: WidgetConfig = {
  name: "FgRate",
  displayName: "Rate",
  description: "Rate control for scoring",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
  },
  defaultProps: {
    max: 5,
    disabled: false,
    allowHalf: false,
    showText: false,
    showScore: false,
    voidColor: "",
    voidIconClass: "",
    colors: [],
    iconClasses: [],
  },
  exposedValues: [
    { key: "value", type: "number", description: "Current Rate", example: 0 },
  ],
  configPanels: ["events", "linkages", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      { key: "max", label: "Max Score", type: "number", default: 5 },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "allowHalf", label: "Allow Half", type: "switch", default: false },
      { key: "showText", label: "显示文字", type: "switch", default: false },
      { key: "showScore", label: "Show Score", type: "switch", default: false },
    ],
  },
};
