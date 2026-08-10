import type { WidgetConfig } from "../base/types";
import { parallelMock } from "./mock";

export const parallelConfig: WidgetConfig = {
  name: "FgParallel",
  displayName: "Parallel Chart",
  description: "Parallel coordinates for multi-dimensional data analysis",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    ...parallelMock.defaultProps,
  },
  configPanels: ["api", "events", "variables"],
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading State" },
  ],
  receivableEvents: [
    { name: "refresh", description: "Reload Data" },
  ],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor", "borderRadius"],
    props: [
      {
        key: "smooth",
        label: "Smooth Lines",
        type: "switch",
        default: false,
        desc: "Use smooth curves instead of straight lines",
      },
      {
        key: "lineWidth",
        label: "Line Width",
        type: "number",
        default: 1,
      },
      {
        key: "opacity",
        label: "Line Opacity",
        type: "number",
        default: 0.5,
        desc: "Opacity of the lines (0-1)",
      },
      {
        key: "colorScheme",
        label: "Color Scheme",
        type: "select",
        default: "default",
        options: [
          { label: "Default", value: "default" },
          { label: "Warm", value: "warm" },
          { label: "Cool", value: "cool" },
        ],
      },
    ],
  },
};
