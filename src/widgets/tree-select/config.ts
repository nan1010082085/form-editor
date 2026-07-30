import type { WidgetConfig } from "../base/types";

export const treeSelectConfig: WidgetConfig = {
  name: "FgTreeSelect",
  displayName: "Tree Select",
  description: "Tree select for hierarchical data",
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
    checkStrictly: true,
    showCheckbox: false,
  },
  exposedValues: [
    { key: "value", type: "string", description: "Selected Value", example: "" },
    { key: "label", type: "string", description: "Selected Tags", example: "" },
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
      {
        key: "checkStrictly",
        label: "Check Independently",
        type: "switch",
        default: true,
      },
      {
        key: "showCheckbox",
        label: "Show Checkbox",
        type: "switch",
        default: false,
      },
    ],
  },
};
