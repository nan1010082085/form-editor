import type { WidgetConfig } from "../base/types";
export const tabsConfig: WidgetConfig = {
  name: "FgTabs",
  displayName: "Tabs Container",
  description: "Tabs with dynamic add/remove, bind to specified tab",
  author: "yangdongnan",
  defaultPosition: { w: 100, wUnit: "%", h: 200 },
  defaultStyle: {},
  exposedValues: [
    { key: "activeKey", type: "string", description: "Active Tab" },
  ],
  configPanels: ["events", "variables"],
  defaultProps: {
    tabs: [
      { key: "tab1", label: "Tab 1" },
      { key: "tab2", label: "Tab 2" },
    ],
    activeKey: "tab1",
    type: "border-card" as const,
    tabPosition: "top" as const,
  },
  propertyPanel: {
    basic: [
      {
        key: "type",
        label: "Style Type",
        type: "select",
        options: [
          { label: "Default", value: "" },
          { label: "Card", value: "card" },
          { label: "Border Card", value: "border-card" },
        ],
        default: "border-card",
      },
      {
        key: "tabPosition",
        label: "Label Position",
        type: "select",
        options: [
          { label: "Top", value: "top" },
          { label: "Right", value: "right" },
          { label: "Bottom", value: "bottom" },
          { label: "Left", value: "left" },
        ],
        default: "top",
      },
      {
        key: "closable",
        label: "Closable",
        type: "switch",
        default: false,
      },
      {
        key: "addable",
        label: "Addable",
        type: "switch",
        default: false,
      },
      {
        key: "stretch",
        label: "Auto Width",
        type: "switch",
        default: false,
      },
    ],
    style: ["margin", "padding", "width", "height"],
    props: [
      {
        key: "tabs",
        label: "Tab",
        type: "array-editor",
        fields: [
          { key: "key", label: "标识", type: "text", placeholder: "tab1" },
          { key: "label", label: "Label", type: "text", placeholder: "标签名" },
        ],
      },
      {
        key: "activeKey",
        label: "Default Active",
        type: "text",
        default: "",
        placeholder: "tab1",
      },
    ],
  },
  contexts: ["free"],
};
