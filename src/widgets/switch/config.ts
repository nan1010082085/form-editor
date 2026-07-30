import type { WidgetConfig } from "../base/types";

export const switchConfig: WidgetConfig = {
  name: "FgSwitch",
  displayName: "Switch",
  description: "Toggle switch for boolean",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
  },
  defaultProps: {
    disabled: false,
    activeText: "",
    inactiveText: "",
    activeColor: "",
    inactiveColor: "",
    activeValue: true,
    inactiveValue: false,
  },
  exposedValues: [
    {
      key: "value",
      type: "boolean",
      description: "Current Switch State",
      example: false,
    },
  ],
  configPanels: ["events", "linkages", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "activeText", label: "On Text", type: "input", default: "" },
      { key: "inactiveText", label: "Off Text", type: "input", default: "" },
      { key: "activeColor", label: "On Color", type: "color", default: "" },
      { key: "inactiveColor", label: "Off Color", type: "color", default: "" },
    ],
  },
};
