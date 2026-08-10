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
      { title: "Basic Info", description: "Fill Basic Info", children: [] },
      { title: "Detailed Info", description: "Fill Details", children: [] },
      { title: "ConfirmSubmit", description: "Check and Submit", children: [] },
    ] as Array<{ title: string; description?: string; children: unknown[] }>,
  },
  exposedValues: [
    { key: "currentStep", type: "number", description: "Current Step Index" },
    { key: "totalSteps", type: "number", description: "Total steps" },
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
      params: { step: "Step Index" },
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
