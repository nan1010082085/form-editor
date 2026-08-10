import type { WidgetConfig } from "../base/types";
import { treemapMock } from "./mock";

export const treemapConfig: WidgetConfig = {
  name: "FgTreemap",
  displayName: "Treemap",
  description: "Treemap for hierarchy proportion",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    staticData: treemapMock,
    title: "",
    showLabel: true,
    colorScheme: "default",
    rawOption: null as Record<string, unknown> | null,
  },
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading State" },
    { key: "chartData", type: "array", description: "Chart Data" },
  ],
  configPanels: ["api", "variables", "events", "chart-linkages"],
  eventTargets: [
    {
      id: "chart-click",
      label: "Chart Click",
      description: "On Chart Item Click",
    },
  ],
  receivableEvents: [
    { name: "refresh", description: "Reload Data" },
    { name: "set-data", description: "Set Chart Data" },
  ],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor", "borderRadius"],
    props: [
      { key: "title", label: "Chart Title", type: "text" },
      { key: "showLabel", label: "Show Label", type: "switch", default: true },
      {
        key: "colorScheme",
        label: "Color Scheme",
        type: "select",
        options: [
          { label: "Default", value: "default" },
          { label: "Warm", value: "warm" },
          { label: "Cool", value: "cool" },
        ],
      },
      { key: "rawOption", label: "Advanced Config (JSON)", type: "json" },
    ],
  },
};

export function createTreemapWidget(id: string) {
  return {
    id,
    name: treemapConfig.name,
    type: "treemap" as const,
    label: "Treemap",
    props: { ...treemapConfig.defaultProps },
    style: { ...treemapConfig.defaultStyle },
    position: {
      x: 0,
      y: 0,
      w: 600,
      h: 400,
      xUnit: "px" as const,
      yUnit: "px" as const,
      wUnit: "px" as const,
      hUnit: "px" as const,
      zIndex: 1,
    },
  };
}
