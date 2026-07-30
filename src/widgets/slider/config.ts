import type { WidgetConfig } from "../base/types";

export const sliderConfig: WidgetConfig = {
  name: "FgSlider",
  displayName: "Slider",
  description: "Slider for range/rating",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
  },
  defaultProps: {
    min: 0,
    max: 100,
    step: 1,
    showInput: false,
    showStops: false,
    showTooltip: true,
    disabled: false,
    range: false,
  },
  exposedValues: [
    { key: "value", type: "number", description: "Current Slider", example: 0 },
  ],
  configPanels: ["events", "linkages", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      { key: "min", label: "Min", type: "number", default: 0 },
      { key: "max", label: "Max", type: "number", default: 100 },
      { key: "step", label: "Step", type: "number", default: 1 },
      { key: "showInput", label: "Show Input", type: "switch", default: false },
      { key: "showStops", label: "Show Steps", type: "switch", default: false },
      { key: "showTooltip", label: "Show Tooltip", type: "switch", default: true },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "range", label: "Range Select", type: "switch", default: false },
    ],
  },
};
