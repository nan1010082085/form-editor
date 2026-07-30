import type { WidgetConfig } from "../base/types";

export const dateTimeSlotConfig: WidgetConfig = {
  name: "FgDateTimeSlot",
  displayName: "Date Range",
  description: "Date-time range picker",
  author: "yangdongnan",
  defaultStyle: { width: "400px", height: "40px" },
  defaultProps: {
    startPlaceholder: "开始时间",
    endPlaceholder: "结束时间",
    format: "YYYY-MM-DD HH:mm:ss",
    rangeSeparator: "至",
  },
  exposedValues: [
    { key: "value", type: "string", description: "当前字段值", example: "" },
  ],
  configPanels: ["events", "linkages", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label"],
    style: [],
    props: [
      {
        key: "startPlaceholder",
        label: "开始占位",
        type: "input",
        default: "开始时间",
      },
      {
        key: "endPlaceholder",
        label: "结束占位",
        type: "input",
        default: "结束时间",
      },
      {
        key: "format",
        label: "Format",
        type: "input",
        default: "YYYY-MM-DD HH:mm:ss",
      },
      { key: "rangeSeparator", label: "Separator", type: "input", default: "至" },
    ],
  },
};
