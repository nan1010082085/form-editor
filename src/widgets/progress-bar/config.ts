import type { WidgetConfig } from "../base/types";

export const progressBarConfig: WidgetConfig = {
  name: "FgProgressBar",
  displayName: "Progress",
  description: "Progress/ring with threshold colors",
  author: "yangdongnan",
  defaultStyle: { width: "100%" },
  defaultProps: {
    value: 65,
    max: 100,
    variant: "line",
    strokeWidth: 6,
    showText: true,
    format: "percent",
    color: "",
    thresholds: [
      { value: 30, color: "#e6a23c" },
      { value: 70, color: "#409eff" },
      { value: 100, color: "#67c23a" },
    ] as Array<{ value: number; color: string }>,
    size: 120,
  },
  exposedValues: [
    { key: "percent", type: "number", description: "Percentage (0-100)" },
    { key: "value", type: "number", description: "Current Value" },
  ],
  configPanels: ["api", "variables"],
  receivableEvents: [
    { name: "set-value", description: "Set Progress", params: { value: "Value" } },
  ],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      { key: "value", label: "Current Value", type: "number", default: 0 },
      { key: "max", label: "Max", type: "number", default: 100 },
      {
        key: "variant",
        label: "Shape",
        type: "select",
        default: "line",
        options: [
          { label: "Linear", value: "line" },
          { label: "Ring", value: "circle" },
        ],
      },
      { key: "strokeWidth", label: "Line Width", type: "number", default: 6 },
      { key: "showText", label: "Show Text", type: "switch", default: true },
      {
        key: "format",
        label: "Display Format",
        type: "select",
        default: "percent",
        options: [
          { label: "Percentage", value: "percent" },
          { label: "Value/Max", value: "value" },
        ],
      },
      { key: "color", label: "Custom Colors", type: "color" },
      {
        key: "thresholds",
        label: "Threshold Color",
        type: "array-editor",
        fields: [
          { key: "value", label: "Threshold", type: "number" },
          { key: "color", label: "Color", type: "color" },
        ],
      },
      {
        key: "size",
        label: "Ring Size",
        type: "number",
        default: 120,
        visibleOn: "props.variant === 'circle'",
      },
    ],
  },
};

export function createProgressBarWidget(id: string) {
  return {
    id,
    name: progressBarConfig.name,
    type: "progress-bar" as const,
    label: "Progress",
    props: { ...progressBarConfig.defaultProps },
    style: { ...progressBarConfig.defaultStyle },
    position: {
      x: 0,
      y: 0,
      w: 300,
      h: 40,
      xUnit: "px" as const,
      yUnit: "px" as const,
      wUnit: "px" as const,
      hUnit: "px" as const,
      zIndex: 1,
    },
  };
}
