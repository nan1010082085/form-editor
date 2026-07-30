import type { WidgetConfig } from "../base/types";
export const buttonConfig: WidgetConfig = {
  name: "FgButton",
  displayName: "Button",
  description: "Button with event config and custom style",
  author: "yangdongnan",
  defaultStyle: {
    width: "100px",
    height: "40px",
  },
  defaultProps: {
    type: "primary",
    size: "default",
    plain: false,
    round: false,
    circle: false,
    disabled: false,
    text: "Button",
  },
  configPanels: ["events"],
  propertyPanel: {
    basic: [
      "label",
      {
        key: "type",
        label: "Button Type",
        type: "select",
        options: [
          { label: "Default", value: "" },
          { label: "Primary", value: "primary" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Danger", value: "danger" },
          { label: "Info", value: "info" },
        ],
        default: "primary",
      },
      {
        key: "size",
        label: "Size",
        type: "select",
        options: [
          { label: "Large", value: "large" },
          { label: "Med", value: "default" },
          { label: "Small", value: "small" },
        ],
        default: "default",
      },
      { key: "plain", label: "Plain Button", type: "switch", default: false },
      { key: "round", label: "Round Button", type: "switch", default: false },
      { key: "circle", label: "Circle Button", type: "switch", default: false },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
    ],
    style: ["backgroundColor", "border", "borderRadius", "fontSize", "color"],
    props: [],
  },
};
