import type { WidgetConfig } from "../base/types";
import { pieChartMock } from "./mock";

export const pieChartConfig: WidgetConfig = {
  name: "FgPieChart",
  displayName: "Pie Chart",
  description: "Pie chart with rose and donut variants",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    staticData: pieChartMock.staticData,
    nameField: "name",
    valueField: "value",
    title: "",
    showLegend: true,
    legendPosition: "left",
    showTooltip: true,
    showLabel: false,
    colorScheme: "default",
    customColors: [
      "#5470c6",
      "#91cc75",
      "#fac858",
      "#ee6666",
      "#73c0de",
    ] as string[],
    roseType: false,
    innerRadius: "",
    animation: true,
    rawOption: null as Record<string, unknown> | null,
  },
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading state" },
    { key: "chartData", type: "array", description: "Chart data" },
  ],
  configPanels: ["api", "variables", "events", "chart-linkages"],
  eventTargets: [
    {
      id: "chart-click",
      label: "Chart Click",
      description: "Triggered on chart data item click",
    },
  ],
  receivableEvents: [
    { name: "refresh", description: "Reload data" },
    {
      name: "set-data",
      description: "Set chart data",
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
          { key: "name", label: "Name", type: "text" },
          { key: "value", label: "Value", type: "number" },
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
      { key: "showLegend", label: "Show Legend", type: "switch", default: true },
      {
        key: "legendPosition",
        label: "Legend Position",
        type: "select",
        default: "left",
        options: [
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      { key: "showTooltip", label: "Show Tooltip", type: "switch", default: true },
      { key: "showLabel", label: "Show Label", type: "switch", default: false },
      { key: "roseType", label: "Rose Type", type: "switch", default: false },
      {
        key: "innerRadius",
        label: "Inner Radius",
        type: "text",
        placeholder: "e.g. 40%",
      },
      { key: "animation", label: "Animation", type: "switch", default: true },
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
      { key: "rawOption", label: "Advanced Option (JSON)", type: "json" },
    ],
  },
};
