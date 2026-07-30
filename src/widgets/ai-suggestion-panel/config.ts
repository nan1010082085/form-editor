/**
 * AI 建议面板 Widget - 展示 AI 生成的建议/推荐
 *
 * 适用场景：审批建议、风险提示、智能推荐、质检改进建议
 * 与 ai 项目呼应：AI 生成建议 -> editor 表单内嵌展示
 */

import type { WidgetConfig } from "../base/types";

export const aiSuggestionPanelConfig: WidgetConfig = {
  name: "FgAiSuggestionPanel",
  displayName: "AI Suggestion Panel",
  description: "AI suggestion list panel",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "auto", fontSize: "14px" },
  defaultProps: {
    title: "AI 建议",
    suggestions: [],
    showIcon: true,
    collapsible: true,
    defaultExpanded: true,
  },
  exposedValues: [
    { key: "suggestions", type: "array", description: "Suggestion List", example: [] },
  ],
  configPanels: ["events", "linkages", "api", "variables"],
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      { key: "title", label: "Title", type: "input", default: "AI 建议" },
      {
        key: "suggestions",
        label: "Suggestion List",
        type: "json",
        default: [],
      },
      { key: "showIcon", label: "Show Icon", type: "switch", default: true },
      { key: "collapsible", label: "Collapsible", type: "switch", default: true },
      { key: "defaultExpanded", label: "Default Expanded", type: "switch", default: true },
    ],
  },
};
