import type { WidgetConfig } from "../base/types";

export const compareFunnelConfig: WidgetConfig = {
  name: "FgCompareFunnel",
  displayName: "Compare漏斗图",
  type: "compare-funnel",
  description: "Compare漏斗图, 用于展示两个流程的转化Compare",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    staticData: [
      { name: "展示", value1: 100, value2: 100 },
      { name: "点击", value1: 80, value2: 70 },
      { name: "访问", value1: 60, value2: 50 },
      { name: "咨询", value1: 40, value2: 30 },
      { name: "订单", value1: 20, value2: 15 },
    ] as Record<string, unknown>[],
    nameField: "name",
    seriesFields: ["value1", "value2"],
    seriesNames: ["流程A", "流程B"],
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
          { key: "value1", label: "流程A", type: "number" },
          { key: "value2", label: "流程B", type: "number" },
        ],
      },
      {
        key: "nameField",
        label: "Name Field",
        type: "text",
        placeholder: "如: name",
      },
      {
        key: "seriesFields",
        label: "SeriesField (JSON)",
        type: "json",
        placeholder: '["value1", "value2"]',
      },
      {
        key: "seriesNames",
        label: "系Column name称 (JSON)",
        type: "json",
        placeholder: '["流程A", "流程B"]',
      },
      { key: "title", label: "Chart Title", type: "text" },
      { key: "showLegend", label: "Show Legend", type: "switch", default: true },
      { key: "showLabel", label: "Show Label", type: "switch", default: true },
      {
        key: "colorScheme",
        label: "Color Scheme",
        type: "select",
        options: [
          { label: "Default", value: "default" },
          { label: "Dark", value: "dark" },
          { label: "Light", value: "light" },
        ],
      },
      { key: "customColors", label: "Custom Colors", type: "color-array" },
      { key: "rawOption", label: "Advanced Option (JSON)", type: "json" },
    ],
  },
};
