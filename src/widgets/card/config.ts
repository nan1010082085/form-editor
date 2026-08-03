import type { WidgetConfig } from "../base/types";
export const cardConfig: WidgetConfig = {
  name: "FgCard",
  displayName: "Card Container",
  description: "Card with title and shadow for content grouping",
  author: "yangdongnan",
  defaultPosition: { w: 100, wUnit: "%", h: 200 },
  defaultStyle: {},
  configPanels: ["events", "variables"],
  defaultProps: {
    title: "卡片标题",
    shadow: "hover" as const,
    showHeader: true,
  },
  propertyPanel: {
    basic: [
      { key: "title", label: "Title", type: "input", default: "卡片标题" },
      {
        key: "shadow",
        label: "Shadow",
        type: "select",
        options: [
          { label: "Always Show", value: "always" },
          { label: "Hover Show", value: "hover" },
          { label: "Hidden", value: "never" },
        ],
        default: "hover",
      },
      { key: "showHeader", label: "Show Header", type: "switch", default: true },
    ],
    style: ["margin", "padding", "backgroundColor", "borderRadius"],
    props: [],
  },
};
