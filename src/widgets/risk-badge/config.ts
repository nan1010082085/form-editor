import type { WidgetConfig } from "../base/types";

export const riskBadgeConfig: WidgetConfig = {
  name: "FgRiskBadge",
  displayName: "风险标签",
  description: "展示风险等级标签，适用于贷款审查/合规检查/质检报告",
  author: "yangdongnan",
  defaultStyle: { width: "auto", height: "auto", fontSize: "14px" },
  defaultProps: {
    level: "medium",
    label: "风险等级",
    description: "",
  },
  exposedValues: [
    { key: "level", type: "string", description: "风险等级", example: "medium" },
  ],
  configPanels: ["events", "linkages", "api", "variables"],
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      {
        key: "level",
        label: "风险等级",
        type: "select",
        default: "medium",
        options: [
          { label: "低风险", value: "low" },
          { label: "中风险", value: "medium" },
          { label: "高风险", value: "high" },
          { label: "严重", value: "critical" },
        ],
      },
      { key: "label", label: "标题", type: "input", default: "风险等级" },
      { key: "description", label: "说明", type: "input", default: "" },
    ],
  },
};
