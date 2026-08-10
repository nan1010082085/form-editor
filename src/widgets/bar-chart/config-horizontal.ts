import type { WidgetConfig } from "../base/types";

export const horizontalBarChartConfig: WidgetConfig = {
  name: "FgHorizontalBarChart",
  displayName: "水平柱状图",
  type: "horizontal-bar-chart",
  description: "水平柱状图, 适合展示RankingData",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    staticData: [
      { category: "产品A", value: 335 },
      { category: "产品B", value: 310 },
      { category: "产品C", value: 234 },
      { category: "产品D", value: 135 },
      { category: "产品E", value: 548 },
    ] as Record<string, unknown>[],
    xField: "category",
    yField: "value",
    xAxisName: "",
    yAxisName: "",
    title: "",
    showLegend: false,
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
          { key: "category", label: "Category", type: "text" },
          { key: "value", label: "Value", type: "number" },
        ],
      },
      {
        key: "xField",
        label: "Category Field",
        type: "text",
        placeholder: "如: category",
      },
      {
        key: "yField",
        label: "Value Field",
        type: "text",
        placeholder: "如: value",
      },
      { key: "title", label: "Chart Title", type: "text" },
      { key: "showTooltip", label: "Show Tooltip", type: "switch", default: true },
      { key: "showLabel", label: "Show Label", type: "switch", default: true },
      { key: "animation", label: "Animation", type: "switch", default: true },
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
