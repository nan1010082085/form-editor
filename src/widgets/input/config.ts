import type { WidgetConfig } from "../base/types";

export const inputConfig: WidgetConfig = {
  name: "FgInput",
  displayName: "Input",
  description: "Single-line text input with placeholder/clearable/disabled",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
    fontSize: "14px",
  },
  defaultProps: {
    placeholder: "请输入",
    clearable: true,
    disabled: false,
    readonly: false,
    maxlength: undefined as number | undefined,
    showPassword: false,
  },
  exposedValues: [
    { key: "value", type: "string", description: "当前字段值", example: "" },
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
        default: "请输入",
      },
      { key: "clearable", label: "Clearable", type: "switch", default: true },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "readonly", label: "Read Only", type: "switch", default: false },
      {
        key: "maxlength",
        label: "Max Length",
        type: "number",
        default: undefined,
      },
      {
        key: "showPassword",
        label: "Password",
        type: "switch",
        default: false,
      },
    ],
  },
};
