import type { WidgetConfig } from "../base/types";
import { sankeyMock } from "./mock";

export const sankeyConfig: WidgetConfig = {
  name: "FgSankey",
  displayName: "Sankey Chart",
  description: "Sankey diagram for flow and conversion analysis",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    ...sankeyMock.defaultProps,
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
        key: "orientation",
        label: "Orientation",
        type: "select",
        default: "horizontal",
        options: [
          { label: "Horizontal", value: "horizontal" },
          { label: "Vertical", value: "vertical" },
        ],
        desc: "Layout direction of the sankey diagram",
      },
      {
        key: "nodeWidth",
        label: "Node Width",
        type: "number",
        default: 20,
        desc: "Width of each node in pixels",
      },
      {
        key: "nodeGap",
        label: "Node Gap",
        type: "number",
        default: 8,
        desc: "Gap between nodes in pixels",
      },
      {
        key: "linkCurvature",
        label: "Link Curvature",
        type: "number",
        default: 0.5,
        desc: "Curvature of the links (0-1)",
      },
      {
        key: "showLabels",
        label: "Show Labels",
        type: "switch",
        default: true,
      },
      {
        key: "labelPosition",
        label: "Label Position",
        type: "select",
        default: "right",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
          { label: "Inside", value: "inside" },
        ],
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
          { label: "Gradient", value: "gradient" },
        ],
      },
      {
        key: "emphasis",
        label: "Emphasis",
        type: "select",
        default: "adjacency",
        options: [
          { label: "Adjacency", value: "adjacency" },
          { label: "None", value: "none" },
        ],
        desc: "Highlight related nodes and links on hover",
      },
    ],
  },
};
