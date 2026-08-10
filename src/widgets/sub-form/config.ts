import type { WidgetConfig } from "../base/types";

export const subFormConfig: WidgetConfig = {
  name: "FgSubForm",
  displayName: "Sub Form",
  description: "Sub form with dynamic add/remove rows",
  author: "yangdongnan",
  defaultStyle: { width: "100%" },
  defaultProps: {
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Please enterName" },
      { key: "quantity", label: "Count", type: "number", placeholder: "0" },
    ] as Array<{
      key: string;
      label: string;
      type: string;
      placeholder?: string;
    }>,
    minRows: 0,
    maxRows: 10,
    addButtonText: "Add Row",
  },
  exposedValues: [
    { key: "rows", type: "array", description: "Sub Form Data" },
  ],
  eventTargets: [
    { id: "row-add", label: "Add Row", description: "On Add Row" },
    { id: "row-remove", label: "Delete Row", description: "On Delete Row" },
  ],
  receivableEvents: [{ name: "reset-rows", description: "Reset Sub Form" }],
  configPanels: ["events", "variables"],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      {
        key: "fields",
        label: "Field Definition",
        type: "array-editor",
        fields: [
          { key: "key", label: "Field Name", type: "text" },
          { key: "label", label: "Label", type: "text" },
          {
            key: "type",
            label: "Type",
            type: "select",
            options: [
              { label: "Text", value: "text" },
              { label: "Number", value: "number" },
              { label: "Select", value: "select" },
            ],
          },
          { key: "placeholder", label: "Placeholder", type: "text" },
        ],
      },
      { key: "minRows", label: "Min Rows", type: "number", default: 0 },
      { key: "maxRows", label: "Max Rows", type: "number", default: 10 },
      { key: "addButtonText", label: "Add Button Text", type: "text" },
    ],
  },
};

export function createSubFormWidget(id: string) {
  return {
    id,
    name: subFormConfig.name,
    type: "sub-form" as const,
    label: "Sub Form",
    props: { ...subFormConfig.defaultProps },
    style: { ...subFormConfig.defaultStyle },
    position: {
      x: 0,
      y: 0,
      w: 800,
      h: 300,
      xUnit: "px" as const,
      yUnit: "px" as const,
      wUnit: "px" as const,
      hUnit: "px" as const,
      zIndex: 1,
    },
  };
}
