import type { WidgetConfig } from "../base/types";

export const pivotTableConfig: WidgetConfig = {
  name: "FgPivotTable",
  displayName: "Pivot Table",
  description: "Grouped aggregation table for data analysis",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    staticData: [],
    rowField: "",
    columnField: "",
    valueField: "",
    aggregation: "sum",
    showTotals: true,
  },
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading state" },
    { key: "pivotData", type: "array", description: "Aggregated pivot data" },
  ],
  configPanels: ["api", "variables", "events"],
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      { key: "staticData", label: "Static Data", type: "array-editor", fields: [] },
      { key: "rowField", label: "Row Field", type: "input", default: "" },
      { key: "columnField", label: "Column Field", type: "input", default: "" },
      { key: "valueField", label: "Value Field", type: "input", default: "" },
      { key: "aggregation", label: "Aggregation", type: "select", default: "sum", options: [
        { label: "Sum", value: "sum" }, { label: "Average", value: "avg" },
        { label: "Count", value: "count" }, { label: "Min", value: "min" }, { label: "Max", value: "max" },
      ]},
      { key: "showTotals", label: "Show Totals", type: "switch", default: true },
    ],
  },
};
