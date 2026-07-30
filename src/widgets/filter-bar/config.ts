import type { WidgetConfig } from "../base/types";

export const filterBarConfig: WidgetConfig = {
  name: "FgFilterBar",
  displayName: "Filter Bar",
  description: "Global filter bar for charts/tables",
  author: "yangdongnan",
  defaultStyle: { width: "100%", marginBottom: "16px" },
  defaultProps: {
    filters: [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "All", value: "" },
          { label: "Enabled", value: "active" },
          { label: "Disabled", value: "inactive" },
        ],
      },
      { key: "dateRange", label: "Date", type: "date-range" },
    ] as Array<Record<string, unknown>>,
    showSearch: true,
    searchPlaceholder: "请输入关键词",
  },
  exposedValues: [
    { key: "filterData", type: "object", description: "Current Filter" },
  ],
  eventTargets: [
    {
      id: "filter-change",
      label: "Filter Change",
      description: "On Filter Change",
    },
  ],
  receivableEvents: [
    { name: "reset-filters", description: "Reset All Filters" },
  ],
  configPanels: ["events", "variables"],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor", "borderRadius"],
    props: [
      {
        key: "filters",
        label: "Filter Items",
        type: "array-editor",
        fields: [
          { key: "key", label: "Field Name", type: "text" },
          { key: "label", label: "Label", type: "text" },
          {
            key: "type",
            label: "Type",
            type: "select",
            options: [
              { label: "Text", value: "text" },
              { label: "Select", value: "select" },
              { label: "Date", value: "date" },
              { label: "日期范围", value: "date-range" },
            ],
          },
        ],
      },
      { key: "showSearch", label: "Show Search", type: "switch", default: true },
      { key: "searchPlaceholder", label: "Search Placeholder", type: "text" },
    ],
  },
};

export function createFilterBarWidget(id: string) {
  return {
    id,
    name: filterBarConfig.name,
    type: "filter-bar" as const,
    label: "Filter Bar",
    props: { ...filterBarConfig.defaultProps },
    style: { ...filterBarConfig.defaultStyle },
    position: {
      x: 0,
      y: 0,
      w: 1200,
      h: 56,
      xUnit: "px" as const,
      yUnit: "px" as const,
      wUnit: "px" as const,
      hUnit: "px" as const,
      zIndex: 1,
    },
  };
}
