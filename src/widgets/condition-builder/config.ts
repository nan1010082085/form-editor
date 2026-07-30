import type { WidgetConfig } from "../base/types";

export const conditionBuilderConfig: WidgetConfig = {
  name: "FgConditionBuilder",
  displayName: "Condition Builder",
  description:
    "Visual condition builder with AND/OR",
  author: "yangdongnan",
  defaultStyle: { width: "100%" },
  defaultProps: {
    fields: [
      { key: "name", label: "Name" },
      { key: "age", label: "Age" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Created At" },
    ] as Array<{ key: string; label: string }>,
  },
  exposedValues: [
    { key: "conditions", type: "array", description: "Condition Array" },
    { key: "logic", type: "string", description: "Logic (and/or)" },
  ],
  configPanels: ["variables"],
  receivableEvents: [{ name: "reset-conditions", description: "Reset All Conditions" }],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      {
        key: "fields",
        label: "Optional Fields",
        type: "array-editor",
        fields: [
          { key: "key", label: "Field Name", type: "text" },
          { key: "label", label: "Label", type: "text" },
        ],
      },
    ],
  },
};

export function createConditionBuilderWidget(id: string) {
  return {
    id,
    name: conditionBuilderConfig.name,
    type: "condition-builder" as const,
    label: "Condition Builder",
    props: { ...conditionBuilderConfig.defaultProps },
    style: { ...conditionBuilderConfig.defaultStyle },
    position: {
      x: 0,
      y: 0,
      w: 600,
      h: 200,
      xUnit: "px" as const,
      yUnit: "px" as const,
      wUnit: "px" as const,
      hUnit: "px" as const,
      zIndex: 1,
    },
  };
}
