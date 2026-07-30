import type { WidgetConfig } from "../base/types";

export const scoreCardConfig: WidgetConfig = {
  name: "FgScoreCard",
  displayName: "评分卡",
  description: "展示评分（分数 + 等级 + 说明），适用于贷款评估/作业评分/绩效考核",
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
    { key: "score", type: "number", description: "当前分数", example: 85 },
  ],
  configPanels: ["events", "linkages", "api", "variables"],
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      { key: "score", label: "分数", type: "number", default: 0 },
      { key: "maxScore", label: "满分", type: "number", default: 100 },
      {
        key: "level",
        label: "等级",
        type: "select",
        default: "medium",
        options: [
          { label: "优秀", value: "excellent" },
          { label: "良好", value: "good" },
          { label: "中等", value: "medium" },
          { label: "较差", value: "poor" },
        ],
      },
      { key: "description", label: "说明", type: "input", default: "" },
      { key: "showLevel", label: "显示等级", type: "switch", default: true },
    ],
  },
};
