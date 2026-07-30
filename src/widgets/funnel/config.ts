import type { WidgetConfig } from "../base/types";

export const funnelConfig: WidgetConfig = {
  name: "FgFunnel",
  displayName: "Funnel Chart",
  description: "漏斗图组件，用于展示转化流程各阶段数据",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    staticData: [
      { name: "展示", value: 100 },
      { name: "点击", value: 80 },
      { name: "访问", value: 60 },
      { name: "咨询", value: 40 },
      { name: "订单", value: 20 },
    ] as Record<string, unknown>[],
    nameField: "name",
    valueField: "value",
    title: "",
    showLegend: true,
    showLabel: true,
    colorScheme: "default",
    customColors: [
      "#5470c6",
      "#91cc75",
      "#fac858",
      "#ee6666",
      "#73c0de",
    ] as string[],
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
          { key: "name", label: "Name", type: "text" },
          { key: "value", label: "Value", type: "number" },
        ],
      },
      {
        key: "nameField",
        label: "Name Field",
        type: "text",
        placeholder: "如: name",
      },
      {
        key: "valueField",
        label: "Value Field",
        type: "text",
        placeholder: "如: value",
      },
      { key: "title", label: "Chart Title", type: "text" },
      { key: "showLegend", label: "Show Legend", type: "switch", default: true },
      { key: "showLabel", label: "Show Label", type: "switch", default: true },
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
