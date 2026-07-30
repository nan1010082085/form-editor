import type { WidgetConfig } from "../base/types";
export const textareaConfig: WidgetConfig = {
  name: "FgTextarea",
  displayName: "Textarea",
  description: "Multi-line text input with rows config",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "80px",
    fontSize: "14px",
  },
  defaultProps: {
    placeholder: "请输入",
    disabled: false,
    readonly: false,
    rows: 3,
    maxlength: undefined as number | undefined,
    showWordLimit: false,
  },
  exposedValues: [
    { key: "value", type: "string", description: "当前字段值", example: "" },
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
        default: "请输入",
      },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "readonly", label: "Read Only", type: "switch", default: false },
      { key: "rows", label: "Rows", type: "number", default: 3 },
      {
        key: "maxlength",
        label: "Max Length",
        type: "number",
        default: undefined,
      },
      {
        key: "showWordLimit",
        label: "Char Count",
        type: "switch",
        default: false,
      },
    ],
  },
};
