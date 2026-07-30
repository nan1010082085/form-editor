import type { WidgetConfig } from "../base/types";

export const riskMatrixConfig: WidgetConfig = {
  name: "FgRiskMatrix",
  displayName: "Risk Matrix",
  description: "Risk/impact matrix for compliance and risk management",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "300px" },
  defaultProps: {
    staticData: [],
    riskTypeField: "type",
    severityField: "severity",
    title: "Risk Matrix",
    levels: ["Low", "Medium", "High", "Critical"],
    showLegend: true,
  },
  configPanels: ["api", "variables", "events"],
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      { key: "staticData", label: "Data", type: "array-editor", fields: [
        { key: "type", label: "Risk Type", type: "text" },
        { key: "severity", label: "Severity", type: "select", options: [
          { label: "Low", value: "low" }, { label: "Medium", value: "medium" },
          { label: "High", value: "high" }, { label: "Critical", value: "critical" },
        ]},
        { key: "description", label: "Description", type: "text" },
      ]},
      { key: "riskTypeField", label: "Risk Type Field", type: "input", default: "type" },
      { key: "severityField", label: "Severity Field", type: "input", default: "severity" },
      { key: "title", label: "Title", type: "input", default: "Risk Matrix" },
      { key: "showLegend", label: "Show Legend", type: "switch", default: true },
    ],
  },
};
