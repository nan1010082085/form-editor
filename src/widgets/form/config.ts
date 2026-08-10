import type { WidgetConfig } from "../base/types";
export const formConfig: WidgetConfig = {
  name: "FgForm",
  displayName: "Form Container",
  description: "Form wrapper with submit, validation, data collection",
  author: "yangdongnan",
  defaultPosition: { w: 100, wUnit: "%", h: 200 },
  defaultStyle: {
    padding: "16px",
  },
  defaultProps: {
    labelWidth: "100px",
    labelPosition: "right" as const,
  },
  propertyPanel: {
    basic: [
      {
        key: "labelWidth",
        label: "Label Width",
        type: "input",
        default: "100px",
        desc: "Width of form label",
      },
      {
        key: "labelPosition",
        label: "Label Position",
        type: "select",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
          { label: "Top", value: "top" },
        ],
        default: "right",
        desc: "Alignment of form label",
      },
    ],
    style: ["padding", "backgroundColor"],
    props: [],
  },
  exposedValues: [
    { key: "formData", type: "object", description: "Form Data Model" },
  ],
  configPanels: ["events", "api", "variables"],
};
