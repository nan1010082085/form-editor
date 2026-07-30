import type { WidgetConfig } from "../base/types";

export const candlestickConfig: WidgetConfig = {
  name: "FgCandlestick",
  displayName: "K 线图",
  description: "K 线图组件，用于展示金融数据的开盘、收盘、最低、最高价格",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    staticData: [
      { date: "2024-01", open: 20, close: 30, low: 15, high: 35 },
      { date: "2024-02", open: 30, close: 25, low: 20, high: 35 },
      { date: "2024-03", open: 25, close: 35, low: 22, high: 38 },
      { date: "2024-04", open: 35, close: 28, low: 25, high: 40 },
      { date: "2024-05", open: 28, close: 38, low: 26, high: 42 },
    ] as Record<string, unknown>[],
    dateField: "date",
    openField: "open",
    closeField: "close",
    lowField: "low",
    highField: "high",
    title: "",
    showLegend: true,
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
          { key: "date", label: "Date", type: "text" },
          { key: "open", label: "Open", type: "number" },
          { key: "close", label: "Close", type: "number" },
          { key: "low", label: "Low", type: "number" },
          { key: "high", label: "High", type: "number" },
        ],
      },
      {
        key: "dateField",
        label: "Date Field",
        type: "text",
        placeholder: "如: date",
      },
      {
        key: "openField",
        label: "Open Field",
        type: "text",
        placeholder: "如: open",
      },
      {
        key: "closeField",
        label: "Close Field",
        type: "text",
        placeholder: "如: close",
      },
      {
        key: "lowField",
        label: "Low Field",
        type: "text",
        placeholder: "如: low",
      },
      {
        key: "highField",
        label: "High Field",
        type: "text",
        placeholder: "如: high",
      },
      { key: "title", label: "Chart Title", type: "text" },
      { key: "showLegend", label: "Show Legend", type: "switch", default: true },
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
