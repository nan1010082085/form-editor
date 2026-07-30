import type { WidgetConfig } from "../base/types";
import { mapChartMock } from "./mock";

export const mapConfig: WidgetConfig = {
  name: "FgMap",
  displayName: "Map Chart",
  description: "地图组件，支持中国/世界地图，区域着色与散点标注，点击下钻",
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
    { id: "chart-click", label: "地图点击", description: "点击地图区域时触发" },
  ],
  receivableEvents: [
    { name: "refresh", description: "Reload data" },
    {
      name: "set-data",
      description: "设置地图数据",
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
          { key: "name", label: "区域名称", type: "text" },
          { key: "value", label: "Value", type: "number" },
        ],
      },
      {
        key: "mapType",
        label: "Map Type",
        type: "select",
        default: "china",
        options: [
          { label: "中国", value: "china" },
          { label: "世界", value: "world" },
        ],
      },
      {
        key: "nameField",
        label: "Name Field",
        type: "text",
        placeholder: "如: name",
      },
      {
        key: "valueField",
        label: "Value Field",
        type: "text",
        placeholder: "如: value",
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
          { label: "默认", value: "default" },
          { label: "暗色", value: "dark" },
          { label: "浅色", value: "light" },
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
        placeholder: "0=关闭",
      },
    ],
  },
};
