import type { WidgetConfig } from "../base/types";

export const iconPickerConfig: WidgetConfig = {
  name: "FgIconPicker",
  displayName: "Icon Picker",
  description: "Icon picker from EP Icons",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
    fontSize: "14px",
  },
  defaultProps: {
    placeholder: "请选择图标",
    clearable: true,
    disabled: false,
  },
  exposedValues: [
    { key: "value", type: "string", description: "Icon Name", example: "Edit" },
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
        default: "请选择图标",
      },
      { key: "clearable", label: "Clearable", type: "switch", default: true },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
    ],
  },
};
