import type { WidgetConfig } from "../base/types";

export const formStepsConfig: WidgetConfig = {
  name: "FgFormSteps",
  displayName: "Step Form",
  description:
    "Step form with progress and nav buttons",
  author: "yangdongnan",
  defaultStyle: { width: "100%", minHeight: "300px" },
  defaultProps: {
    steps: [
      { title: "基本信息", description: "Fill Basic Info", children: [] },
      { title: "详细信息", description: "Fill Details", children: [] },
      { title: "确认提交", description: "Check and Submit", children: [] },
    ] as Array<{ title: string; description?: string; children: unknown[] }>,
  },
  exposedValues: [
    { key: "currentStep", type: "number", description: "Current Step Index" },
    { key: "totalSteps", type: "number", description: "总步骤数" },
  ],
  eventTargets: [
    { id: "step-change", label: "Step Switch", description: "On Step Switch" },
    { id: "complete", label: "Complete", description: "On Complete" },
  ],
  receivableEvents: [
    { name: "next-step", description: "Go Next" },
    { name: "prev-step", description: "Go Prev" },
    {
      name: "go-to-step",
      description: "Go To Step",
      params: { step: "步骤索引" },
    },
  ],
  configPanels: ["events", "variables"],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "minHeight"],
    props: [
      {
        key: "steps",
        label: "Step Config",
        type: "array-editor",
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "text" },
        ],
      },
    ],
  },
  contexts: ["free"],
};

export function createFormStepsWidget(id: string) {
  return {
    id,
    name: formStepsConfig.name,
    type: "form-steps" as const,
    label: "Step Form",
    props: { ...formStepsConfig.defaultProps },
    style: { ...formStepsConfig.defaultStyle },
    position: {
      x: 0,
      y: 0,
      w: 800,
      h: 400,
      xUnit: "px" as const,
      yUnit: "px" as const,
      wUnit: "px" as const,
      hUnit: "px" as const,
      zIndex: 1,
    },
  };
}
