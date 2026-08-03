import type { WidgetConfig } from "../base/types";

export const treeLayoutConfig: WidgetConfig = {
  name: "FgTreeLayout",
  displayName: "Sidebar Panel",
  description:
    "Sidebar with title and search for draggable widgets",
  author: "yangdongnan",
  defaultPosition: { w: 100, wUnit: "%", h: 200 },
  defaultStyle: {},
  configPanels: ["events", "variables"],
  defaultProps: {
    title: "Sidebar Panel",
    showHeader: true,
    showSearch: true,
    searchPlaceholder: "搜索",
  },
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor", "border", "borderRadius"],
    props: [
      { key: "title", label: "Title", type: "input", default: "Sidebar Panel" },
      { key: "showHeader", label: "Show Header", type: "switch", default: true },
      { key: "showSearch", label: "Show Search Box", type: "switch", default: true },
      {
        key: "searchPlaceholder",
        label: "Search Placeholder",
        type: "input",
        default: "搜索",
      },
    ],
  },
};
