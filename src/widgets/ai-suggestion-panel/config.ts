/**
 * AI 建议面板 Widget - 展示 AI 生成的建议/推荐
 *
 * 适用场景：审批建议、风险提示、智能推荐、质检改进建议
 * 与 ai 项目呼应：AI 生成建议 -> editor 表单内嵌展示
 */

import type { WidgetConfig } from "../base/types";

export const aiSuggestionPanelConfig: WidgetConfig = {
  name: "FgAiSuggestionPanel",
  displayName: "AI建议面板",
  description: "展示 AI 生成的建议列表，适用于审批建议/风险提示/智能推荐",
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
    { key: "suggestions", type: "array", description: "建议列表", example: [] },
  ],
  configPanels: ["events", "linkages", "api", "variables"],
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      { key: "title", label: "标题", type: "input", default: "AI 建议" },
      {
        key: "suggestions",
        label: "建议列表",
        type: "json",
        default: [],
      },
      { key: "showIcon", label: "显示图标", type: "switch", default: true },
      { key: "collapsible", label: "可折叠", type: "switch", default: true },
      { key: "defaultExpanded", label: "默认展开", type: "switch", default: true },
    ],
  },
};
