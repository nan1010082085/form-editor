import type { WidgetConfig } from "../base/types";

export const scoreCardConfig: WidgetConfig = {
  name: "FgScoreCard",
  displayName: "Score Card",
  description: "Score card for loan/grading/performance",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "auto", fontSize: "14px" },
  defaultProps: {
    score: 0,
    maxScore: 100,
    level: "medium",
    description: "",
    showLevel: true,
  },
  exposedValues: [
    { key: "score", type: "number", description: "Current Score", example: 85 },
  ],
  configPanels: ["events", "linkages", "api", "variables"],
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      { key: "score", label: "Score", type: "number", default: 0 },
      { key: "maxScore", label: "Full Score", type: "number", default: 100 },
      {
        key: "level",
        label: "Level",
        type: "select",
        default: "medium",
        options: [
          { label: "Excellent", value: "excellent" },
          { label: "Good", value: "good" },
          { label: "Medium", value: "medium" },
          { label: "Poor", value: "poor" },
        ],
      },
      { key: "description", label: "Description", type: "input", default: "" },
      { key: "showLevel", label: "Show Level", type: "switch", default: true },
    ],
  },
};
