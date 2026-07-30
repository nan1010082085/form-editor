import type { WidgetConfig } from "../base/types";

export const mindMapConfig: WidgetConfig = {
  name: "FgMindMap",
  displayName: "Mind Map",
  description: "Hierarchical mind map visualization",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    data: { id: "root", label: "Central Topic", children: [] },
    layout: "vertical",
    showIcon: false,
    expandAll: true,
  },
  exposedValues: [
    { key: "selectedNode", type: "string", description: "Selected node label" },
  ],
  configPanels: ["api", "variables", "events"],
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      { key: "data", label: "Tree Data (JSON)", type: "json", default: {} },
      { key: "layout", label: "Layout", type: "select", default: "vertical", options: [
        { label: "Vertical", value: "vertical" }, { label: "Horizontal", value: "horizontal" },
      ]},
      { key: "showIcon", label: "Show Icons", type: "switch", default: false },
      { key: "expandAll", label: "Expand All", type: "switch", default: true },
    ],
  },
};
