import type { WidgetConfig } from "../base/types";

export const colorPickerConfig: WidgetConfig = {
  name: "FgColorPicker",
  displayName: "Color Picker",
  description: "Color picker for theme/visual config",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
  },
  defaultProps: {
    disabled: false,
    showAlpha: false,
    colorFormat: "",
    predefine: [],
  },
  exposedValues: [
    {
      key: "value",
      type: "string",
      description: "Current Color",
      example: "#409eff",
    },
  ],
  configPanels: ["events", "linkages", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "showAlpha", label: "Opacity", type: "switch", default: false },
      {
        key: "colorFormat",
        label: "Color Format",
        type: "select",
        default: "",
        options: [
          { label: "Default", value: "" },
          { label: "hex", value: "hex" },
          { label: "rgb", value: "rgb" },
          { label: "hsl", value: "hsl" },
          { label: "hsv", value: "hsv" },
        ],
      },
    ],
  },
};
