import type { WidgetConfig } from "../base/types";

export const cascaderConfig: WidgetConfig = {
  name: "FgCascader",
  displayName: "Cascader",
  description: "Cascader for province/city/multi-level categories",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
  },
  defaultProps: {
    placeholder: "Please select",
    clearable: true,
    disabled: false,
    showAllLevels: true,
    collapseTags: false,
    multiple: false,
    checkStrictly: false,
  },
  exposedValues: [
    {
      key: "value",
      type: "array",
      description: "Selected (Array)",
      example: [],
    },
  ],
  configPanels: ["events", "linkages", "api", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      {
        key: "placeholder",
        label: "Placeholder",
        type: "input",
        default: "Please select",
      },
      { key: "clearable", label: "Clearable", type: "switch", default: true },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      {
        key: "showAllLevels",
        label: "Show Full Path",
        type: "switch",
        default: true,
      },
      {
        key: "collapseTags",
        label: "Collapse Label",
        type: "switch",
        default: false,
      },
      { key: "multiple", label: "Checkbox", type: "switch", default: false },
      {
        key: "checkStrictly",
        label: "Any Level",
        type: "switch",
        default: false,
      },
      { key: "options", label: "Options Data", type: "options", default: [] },
    ],
  },
};
