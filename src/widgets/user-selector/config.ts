import type { WidgetConfig } from "../base/types";

export const userSelectorConfig: WidgetConfig = {
  name: "FgUserSelector",
  displayName: "User Selector",
  description: "User selector with search and multi-select",
  author: "yangdongnan",
  defaultStyle: { width: "240px", height: "40px", fontSize: "14px" },
  defaultProps: {
    placeholder: "Please selectUser",
    clearable: true,
    disabled: false,
    multiple: false,
    filterable: true,
  },
  exposedValues: [
    { key: "value", type: "string", description: "Selected User ID", example: "" },
    { key: "label", type: "string", description: "Selected User Name", example: "" },
  ],
  configPanels: ["events", "linkages", "variables"],
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      {
        key: "placeholder",
        label: "Placeholder",
        type: "input",
        default: "Please selectUser",
      },
      { key: "clearable", label: "Clearable", type: "switch", default: true },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "multiple", label: "Checkbox", type: "switch", default: false },
    ],
  },
};
