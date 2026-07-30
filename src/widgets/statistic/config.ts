import type { WidgetConfig } from "../base/types";
import { statisticMock } from "./mock";

export const statisticConfig: WidgetConfig = {
  name: "FgStatistic",
  displayName: "Statistic Card",
  description: "KPI card with value and trend",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    height: "120px",
  },
  defaultProps: {
    ...statisticMock.defaultProps,
    icon: "",
    valueFontSize: "28px",
    titleFontSize: "14px",
  },
  configPanels: ["api", "variables"],
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading State" },
    { key: "currentValue", type: "number", description: "Current Number" },
  ],
  receivableEvents: [
    { name: "refresh", description: "Reload Data" },
    { name: "set-value", description: "Set Value", params: { value: "Value" } },
  ],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor", "borderRadius"],
    props: [
      { key: "title", label: "Title", type: "input", default: "总用户数" },
      { key: "value", label: "Value", type: "number", default: 12345 },
      {
        key: "prefix",
        label: "Prefix",
        type: "input",
        placeholder: "如: ¥",
        default: "",
      },
      {
        key: "suffix",
        label: "Suffix",
        type: "input",
        placeholder: "如: 万",
        default: "",
      },
      { key: "precision", label: "Decimal Places", type: "number", default: 0 },
      {
        key: "trend",
        label: "Trend Direction",
        type: "select",
        options: [
          { label: "Up", value: "up" },
          { label: "Down", value: "down" },
          { label: "Flat", value: "flat" },
        ],
        default: "up",
      },
      {
        key: "trendValue",
        label: "Compare Label",
        type: "input",
        placeholder: "如: +12.5%",
        default: "",
      },
      {
        key: "icon",
        label: "Icon",
        type: "input",
        placeholder: "Element Plus 图标名",
        default: "",
      },
      { key: "color", label: "Value Color", type: "color", default: "#409EFF" },
      {
        key: "valueFontSize",
        label: "Value Font Size",
        type: "input",
        default: "28px",
      },
      {
        key: "titleFontSize",
        label: "Title Font Size",
        type: "input",
        default: "14px",
      },
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
