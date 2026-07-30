import type { WidgetConfig } from "../base/types";

export const heatmapConfig: WidgetConfig = {
  name: "FgHeatmap",
  displayName: "Heatmap Chart",
  description: "热力图组件，用于展示二维数据密度",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    staticData: [
      { x: 0, y: 0, value: 5 },
      { x: 0, y: 1, value: 1 },
      { x: 0, y: 2, value: 0 },
      { x: 1, y: 0, value: 7 },
      { x: 1, y: 1, value: 3 },
      { x: 1, y: 2, value: 1 },
      { x: 2, y: 0, value: 2 },
      { x: 2, y: 1, value: 4 },
      { x: 2, y: 2, value: 6 },
    ] as Record<string, unknown>[],
    xField: "x",
    yField: "y",
    valueField: "value",
    title: "",
    showLabel: false,
    colorScheme: "default",
    rawOption: null as Record<string, unknown> | null,
  },
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading state" },
    { key: "chartData", type: "array", description: "Chart data" },
  ],
  configPanels: ["api", "variables", "events", "chart-linkages"],
  eventTargets: [
    {
      id: "chart-click",
      label: "Chart Click",
      description: "Triggered on chart data item click",
    },
  ],
  receivableEvents: [
    { name: "refresh", description: "Reload data" },
    {
      name: "set-data",
      description: "Set chart data",
      params: { data: "Data array" },
    },
  ],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor", "borderRadius"],
    props: [
      {
        key: "staticData",
        label: "Static Data",
        type: "array-editor",
        fields: [
          { key: "x", label: "X", type: "number" },
          { key: "y", label: "Y", type: "number" },
          { key: "value", label: "Value", type: "number" },
        ],
      },
      { key: "xField", label: "X Axis Field", type: "text", placeholder: "如: x" },
      { key: "yField", label: "Y Axis Field", type: "text", placeholder: "如: y" },
      {
        key: "valueField",
        label: "Value Field",
        type: "text",
        placeholder: "如: value",
      },
      { key: "title", label: "Chart Title", type: "text" },
      { key: "showLabel", label: "Show Label", type: "switch", default: false },
      {
        key: "colorScheme",
        label: "Color Scheme",
        type: "select",
        options: [
          { label: "默认", value: "default" },
          { label: "暗色", value: "dark" },
          { label: "浅色", value: "light" },
        ],
      },
      { key: "rawOption", label: "Advanced Option (JSON)", type: "json" },
    ],
  },
};
