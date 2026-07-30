import type { WidgetConfig } from "../base/types";

export const rankListConfig: WidgetConfig = {
  name: "FgRankList",
  displayName: "Ranking",
  description: "Ranking list with trend and Top N",
  author: "yangdongnan",
  defaultStyle: { width: "100%" },
  defaultProps: {
    title: "Ranking",
    items: [
      { name: "张三", value: 9800, trend: 2 },
      { name: "李四", value: 8500, trend: -1 },
      { name: "王五", value: 7200, trend: 0 },
      { name: "赵六", value: 6100, trend: 3 },
      { name: "钱七", value: 5400, trend: -2 },
    ] as Array<Record<string, unknown>>,
    nameKey: "name",
    valueKey: "value",
    trendKey: "trend",
    maxItems: 10,
    showRank: true,
    showTrend: true,
    highlightTop: 3,
  },
  exposedValues: [
    { key: "sortedItems", type: "array", description: "Sorted List" },
  ],
  configPanels: ["api", "variables"],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor"],
    props: [
      { key: "title", label: "Title", type: "text" },
      { key: "nameKey", label: "Name Field", type: "text", default: "name" },
      { key: "valueKey", label: "Value Field", type: "text", default: "value" },
      { key: "trendKey", label: "Trend Field", type: "text", default: "trend" },
      { key: "maxItems", label: "Max Items", type: "number", default: 10 },
      { key: "showRank", label: "Show Ranking", type: "switch", default: true },
      { key: "showTrend", label: "Show Trend", type: "switch", default: true },
      { key: "highlightTop", label: "Highlight Top N", type: "number", default: 3 },
      {
        key: "items",
        label: "Static Data",
        type: "array-editor",
        fields: [
          { key: "name", label: "Name", type: "text" },
          { key: "value", label: "Value", type: "number" },
          { key: "trend", label: "Trend", type: "number" },
        ],
      },
    ],
  },
};

export function createRankListWidget(id: string) {
  return {
    id,
    name: rankListConfig.name,
    type: "rank-list" as const,
    label: "Ranking",
    props: { ...rankListConfig.defaultProps },
    style: { ...rankListConfig.defaultStyle },
    position: {
      x: 0,
      y: 0,
      w: 360,
      h: 300,
      xUnit: "px" as const,
      yUnit: "px" as const,
      wUnit: "px" as const,
      hUnit: "px" as const,
      zIndex: 1,
    },
  };
}
