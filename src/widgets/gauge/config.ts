import type { WidgetConfig } from "../base/types";

export const gaugeConfig: WidgetConfig = {
  name: "FgGauge",
  displayName: "Gauge Chart",
  description: "仪表盘组件，用于展示单个指标的完成度",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    staticData: [{ value: 75 }] as Record<string, unknown>[],
    valueField: "value",
    min: 0,
    max: 100,
    unit: "",
    title: "",
    showTooltip: true,
    showLabel: true,
    colorScheme: "default",
    customColors: [
      "#5470c6",
      "#91cc75",
      "#fac858",
      "#ee6666",
      "#73c0de",
    ] as string[],
    animation: true,
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
        fields: [{ key: "value", label: "Value", type: "number" }],
      },
      {
        key: "valueField",
        label: "Value Field",
        type: "text",
        placeholder: "如: value",
      },
      { key: "min", label: "Min", type: "number", default: 0 },
      { key: "max", label: "Max", type: "number", default: 100 },
      { key: "unit", label: "Unit", type: "text", placeholder: "如: %" },
      { key: "title", label: "Chart Title", type: "text" },
      { key: "showTooltip", label: "Show Tooltip", type: "switch", default: true },
      { key: "showLabel", label: "Show Label", type: "switch", default: true },
      { key: "animation", label: "Animation", type: "switch", default: true },
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
      { key: "customColors", label: "Custom Colors", type: "color-array" },
      { key: "rawOption", label: "Advanced Option (JSON)", type: "json" },
    ],
  },
};
