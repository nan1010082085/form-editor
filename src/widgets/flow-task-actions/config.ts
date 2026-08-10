import type { WidgetConfig } from "../base/types";

export const flowTaskActionsConfig: WidgetConfig = {
  name: "FgFlowTaskActions",
  displayName: "Flow Task Actions",
  description: "Approval actions area",
  author: "yangdongnan",
  defaultStyle: { width: "100%" },
  exposedValues: [
    { key: "taskId", type: "string", description: "Current Task ID" },
    { key: "loading", type: "boolean", description: "Operation in progress" },
  ],
  configPanels: ["events", "variables"],
  defaultProps: {
    title: "Approval Actions",
    taskIdVariable: "taskId",
    instanceIdVariable: "flowInstanceId",
    commentWidgetId: "detail-comment",
    showAiSuggestion: true,
  },
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      { key: "title", label: "Title", type: "input", default: "Approval Actions" },
      {
        key: "taskIdVariable",
        label: "Task ID Var",
        type: "input",
        default: "taskId",
      },
      {
        key: "instanceIdVariable",
        label: "Instance ID Var",
        type: "input",
        default: "flowInstanceId",
      },
      {
        key: "commentWidgetId",
        label: "Comment Widget ID",
        type: "input",
        default: "detail-comment",
      },
      {
        key: "showAiSuggestion",
        label: "Show AI Suggestions",
        type: "switch",
        default: true,
      },
    ],
  },
};
