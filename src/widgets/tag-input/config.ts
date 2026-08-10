import type { WidgetConfig } from "../base/types";

export const tagInputConfig: WidgetConfig = {
  name: "FgTagInput",
  displayName: "Tag Input",
  description: "Tag input with dynamic add/remove",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
  },
  defaultProps: {
    placeholder: "Please enterLabel",
    disabled: false,
    maxlength: 20,
    maxTags: 10,
    closable: true,
  },
  exposedValues: [
    { key: "value", type: "array", description: "Current Tags", example: [] },
  ],
  configPanels: ["events", "linkages", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      {
        key: "placeholder",
        label: "Placeholder",
        type: "input",
        default: "Please enterLabel",
      },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "maxlength", label: "Max Label Length", type: "number", default: 20 },
      { key: "maxTags", label: "Max Tags", type: "number", default: 10 },
      { key: "closable", label: "Closable", type: "switch", default: true },
    ],
  },
};
