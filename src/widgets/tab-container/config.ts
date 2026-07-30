import type { WidgetConfig } from "../base/types";

export const tabContainerConfig: WidgetConfig = {
  name: "FgTabContainer",
  displayName: "Tab Container",
  description:
    "Tab container with multiple sub-canvases",
  author: "yangdongnan",
  defaultStyle: { width: "100%", minHeight: "200px" },
  defaultProps: {
    tabs: [
      { key: "tab1", label: "Tab 1", children: [] },
      { key: "tab2", label: "Tab 2", children: [] },
    ] as Array<{ key: string; label: string; children: unknown[] }>,
  },
  exposedValues: [
    { key: "activeTab", type: "string", description: "Active Tab Key" },
  ],
  eventTargets: [
    { id: "tab-change", label: "Tab Switch", description: "On Tab Switch" },
  ],
  receivableEvents: [
    {
      name: "set-active-tab",
      description: "Set Active Tab",
      params: { key: "Tab key" },
    },
  ],
  configPanels: ["events", "variables"],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "minHeight"],
    props: [
      {
        key: "tabs",
        label: "Tab Config",
        type: "array-editor",
        fields: [
          { key: "key", label: "Key", type: "text" },
          { key: "label", label: "Label", type: "text" },
        ],
      },
    ],
  },
  contexts: ["free"],
};

export function createTabContainerWidget(id: string) {
  return {
    id,
    name: tabContainerConfig.name,
    type: "tab-container" as const,
    label: "Tab Container",
    props: { ...tabContainerConfig.defaultProps },
    style: { ...tabContainerConfig.defaultStyle },
    position: {
      x: 0,
      y: 0,
      w: 800,
      h: 300,
      xUnit: "px" as const,
      yUnit: "px" as const,
      wUnit: "px" as const,
      hUnit: "px" as const,
      zIndex: 1,
    },
  };
}
