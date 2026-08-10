import type { WidgetConfig } from "../base/types";

export const timePickerConfig: WidgetConfig = {
  name: "FgTimePicker",
  displayName: "Time Picker",
  description: "Time picker with fixed/range mode",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
  },
  defaultProps: {
    placeholder: "Please select time",
    clearable: true,
    disabled: false,
    readonly: false,
    isRange: false,
    format: "HH:mm:ss",
    arrowControl: false,
  },
  exposedValues: [
    { key: "value", type: "string", description: "Current Time Value", example: "" },
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
        default: "Please select time",
      },
      { key: "clearable", label: "Clearable", type: "switch", default: true },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "readonly", label: "Read Only", type: "switch", default: false },
      { key: "isRange", label: "Range Select", type: "switch", default: false },
      { key: "format", label: "Time Format", type: "input", default: "HH:mm:ss" },
      {
        key: "arrowControl",
        label: "Arrow Control",
        type: "switch",
        default: false,
      },
    ],
  },
};
