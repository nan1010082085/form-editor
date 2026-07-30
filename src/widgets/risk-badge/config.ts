import type { WidgetConfig } from "../base/types";

export const riskBadgeConfig: WidgetConfig = {
  name: "FgRiskBadge",
  displayName: "Risk Badge",
  description: "Risk level badge",
  author: "yangdongnan",
  defaultStyle: { width: "auto", height: "auto", fontSize: "14px" },
  defaultProps: {
    level: "medium",
    label: "Risk Level",
    description: "",
  },
  exposedValues: [
    { key: "level", type: "string", description: "Risk Level", example: "medium" },
  ],
  configPanels: ["events", "linkages", "api", "variables"],
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      {
        key: "level",
        label: "Risk Level",
        type: "select",
        default: "medium",
        options: [
          { label: "Low Risk", value: "low" },
          { label: "Medium Risk", value: "medium" },
          { label: "High Risk", value: "high" },
          { label: "Critical", value: "critical" },
        ],
      },
      { key: "label", label: "Title", type: "input", default: "Risk Level" },
      { key: "description", label: "Description", type: "input", default: "" },
    ],
  },
};
