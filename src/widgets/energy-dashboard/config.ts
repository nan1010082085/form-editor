import type { WidgetConfig } from "../base/types";

export const energyDashboardConfig: WidgetConfig = {
  name: "FgEnergyDashboard",
  displayName: "Energy Dashboard",
  description: "Energy consumption dashboard with trend chart and summary stats",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    staticData: [],
    title: "Energy Dashboard",
    timeField: "time",
    valueField: "value",
    unit: "kWh",
    showChart: true,
    showStats: true,
  },
  configPanels: ["api", "variables", "events"],
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      { key: "staticData", label: "Data", type: "array-editor", fields: [
        { key: "time", label: "Time", type: "text" },
        { key: "value", label: "Value", type: "number" },
      ]},
      { key: "title", label: "Title", type: "input", default: "Energy Dashboard" },
      { key: "timeField", label: "Time Field", type: "input", default: "time" },
      { key: "valueField", label: "Value Field", type: "input", default: "value" },
      { key: "unit", label: "Unit", type: "input", default: "kWh" },
      { key: "showChart", label: "Show Chart", type: "switch", default: true },
      { key: "showStats", label: "Show Stats", type: "switch", default: true },
    ],
  },
};
