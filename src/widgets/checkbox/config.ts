import type { WidgetConfig } from "../base/types";
export const checkboxConfig: WidgetConfig = {
  name: "FgCheckbox",
  displayName: "Checkbox",
  description: "Checkbox group with static/dynamic options",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
    fontSize: "14px",
  },
  defaultProps: {
    disabled: false,
  },
  exposedValues: [
    { key: "value", type: "string", description: "Current field value", example: "" },
  ],
  configPanels: ["events", "linkages", "api", "variables"],
  propertyPanel: {
    basic: ["field", "label", "defaultValue", "options"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [{ key: "disabled", label: "Disabled", type: "switch", default: false }],
  },
};
