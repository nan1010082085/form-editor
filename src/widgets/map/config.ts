import type { WidgetConfig } from "../base/types";
import { mapChartMock } from "./mock";

export const mapConfig: WidgetConfig = {
  name: "FgMap",
  displayName: "Map Chart",
  description: "Map widget with China/world map, region coloring and drill-down",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "500px" },
  defaultProps: {
    staticData: mapChartMock.staticData,
    mapType: "china",
    nameField: "name",
    valueField: "value",
    title: "",
    showLabel: true,
    showScatter: false,
    roam: true,
    visualMapMin: 0,
    visualMapMax: 1000,
    colorScheme: "default",
    customColors: [
      "#5470c6",
      "#91cc75",
      "#fac858",
      "#ee6666",
      "#73c0de",
    ] as string[],
    animation: true,
    rawOption: null as Record<string, unknown> | null,
  },
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading state" },
    { key: "chartData", type: "array", description: "Chart data" },
  ],
  configPanels: ["api", "variables", "events", "chart-linkages"],
  eventTargets: [
    { id: "chart-click", label: "Map click", description: "Triggered when clicking map area" },
  ],
  receivableEvents: [
    { name: "refresh", description: "Reload data" },
    {
      name: "set-data",
      description: "Set map data",
      params: { data: "Data array" },
    },
  ],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor", "borderRadius"],
    props: [
      {
        key: "staticData",
        label: "Static Data",
        type: "array-editor",
        fields: [
          { key: "name", label: "Region name", type: "text" },
          { key: "value", label: "Value", type: "number" },
        ],
      },
      {
        key: "mapType",
        label: "Map Type",
        type: "select",
        default: "china",
        options: [
          { label: "China", value: "china" },
          { label: "World", value: "world" },
        ],
      },
      {
        key: "nameField",
        label: "Name Field",
        type: "text",
        placeholder: "e.g. name",
      },
      {
        key: "valueField",
        label: "Value Field",
        type: "text",
        placeholder: "e.g. value",
      },
      { key: "title", label: "Chart Title", type: "text" },
      { key: "showLabel", label: "Show Label", type: "switch", default: true },
      { key: "showScatter", label: "Show Scatter", type: "switch", default: false },
      { key: "roam", label: "Enable Roam", type: "switch", default: true },
      {
        key: "visualMapMin",
        label: "Visual Map Min",
        type: "number",
        default: 0,
      },
      {
        key: "visualMapMax",
        label: "Visual Map Max",
        type: "number",
        default: 1000,
      },
      {
        key: "colorScheme",
        label: "Color Scheme",
        type: "select",
        options: [
          { label: "Default", value: "default" },
          { label: "Dark", value: "dark" },
          { label: "Light", value: "light" },
        ],
      },
      { key: "customColors", label: "Custom Colors", type: "color-array" },
      { key: "animation", label: "Animation", type: "switch", default: true },
      { key: "rawOption", label: "Advanced Option (JSON)", type: "json" },
      {
        key: "refreshInterval",
        label: "Auto Refresh (s)",
        type: "number",
        default: 0,
        placeholder: "0=Close",
      },
    ],
  },
};
