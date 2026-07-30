import type { WidgetConfig } from "../base/types";
export const selectConfig: WidgetConfig = {
  name: "FgSelect",
  displayName: "Select",
  description: "Select with static/dynamic options",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
    fontSize: "14px",
  },
  defaultProps: {
    placeholder: "请选择",
    clearable: true,
    disabled: false,
    multiple: false,
    filterable: false,
  },
  exposedValues: [
    { key: "value", type: "string", description: "当前字段值", example: "" },
  ],
  configPanels: ["events", "linkages", "api", "variables"],
  propertyPanel: {
    basic: ["field", "label", "defaultValue", "options"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      {
        key: "placeholder",
        label: "Placeholder",
        type: "input",
        default: "请选择",
      },
      { key: "clearable", label: "Clearable", type: "switch", default: true },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "multiple", label: "Checkbox", type: "switch", default: false },
      { key: "filterable", label: "Searchable", type: "switch", default: false },
    ],
  },
};
