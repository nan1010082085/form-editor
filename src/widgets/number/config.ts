import type { WidgetConfig } from "../base/types";
export const numberConfig: WidgetConfig = {
  name: "FgNumber",
  displayName: "Number",
  description: "Number input with step/min/max",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
    fontSize: "14px",
  },
  defaultProps: {
    placeholder: "Please enter number",
    disabled: false,
    min: undefined as number | undefined,
    max: undefined as number | undefined,
    step: 1,
    precision: undefined as number | undefined,
  },
  exposedValues: [
    { key: "value", type: "string", description: "Current field value", example: "" },
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
        default: "Please enter number",
      },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "min", label: "Min", type: "number", default: undefined },
      { key: "max", label: "Max", type: "number", default: undefined },
      { key: "step", label: "Step", type: "number", default: 1 },
      { key: "precision", label: "Precision", type: "number", default: undefined },
    ],
  },
};
