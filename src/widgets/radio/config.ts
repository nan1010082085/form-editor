import type { WidgetConfig } from "../base/types";
export const radioConfig: WidgetConfig = {
  name: "FgRadio",
  displayName: "Radio",
  description: "Radio group with static/dynamic options",
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
    { key: "value", type: "string", description: "当前字段值", example: "" },
  ],
  configPanels: ["events", "linkages", "api", "variables"],
  propertyPanel: {
    basic: ["field", "label", "defaultValue", "options"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [{ key: "disabled", label: "Disabled", type: "switch", default: false }],
  },
};
