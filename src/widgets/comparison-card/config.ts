import type { WidgetConfig } from "../base/types";

export const comparisonCardConfig: WidgetConfig = {
  name: "FgComparisonCard",
  displayName: "Comparison Card",
  description: "Comparison card with trend arrow and percentage",
  author: "yangdongnan",
  defaultStyle: { width: "240px" },
  defaultProps: {
    title: "Monthly Active Users",
    currentValue: 128500,
    previousValue: 115200,
    unit: "",
    prefix: "",
    comparisonLabel: "Year-over-year",
    precision: 1,
  },
  exposedValues: [
    { key: "currentValue", type: "number", description: "Current Value" },
    { key: "changePercent", type: "number", description: "Change Percent" },
  ],
  configPanels: ["api", "variables"],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor", "borderRadius"],
    props: [
      { key: "title", label: "Title", type: "text" },
      { key: "currentValue", label: "Current Value", type: "number" },
      { key: "previousValue", label: "Compare Value", type: "number" },
      { key: "prefix", label: "Prefix", type: "text", placeholder: "e.g. ¥" },
      { key: "unit", label: "Unit", type: "text", placeholder: "e.g. users" },
      {
        key: "comparisonLabel",
        label: "Compare Label",
        type: "text",
        default: "Year-over-year",
      },
      { key: "precision", label: "Decimal Precision", type: "number", default: 1 },
    ],
  },
};

export function createComparisonCardWidget(id: string) {
  return {
    id,
    name: comparisonCardConfig.name,
    type: "comparison-card" as const,
    label: "Comparison Card",
    props: { ...comparisonCardConfig.defaultProps },
    style: { ...comparisonCardConfig.defaultStyle },
    position: {
      x: 0,
      y: 0,
      w: 240,
      h: 100,
      xUnit: "px" as const,
      yUnit: "px" as const,
      wUnit: "px" as const,
      hUnit: "px" as const,
      zIndex: 1,
    },
  };
}
