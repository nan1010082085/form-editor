import type { WidgetConfig } from "../base/types";

export const realtimeClockConfig: WidgetConfig = {
  name: "FgRealtimeClock",
  displayName: "Real-time Clock",
  description: "Real-time clock with 12/24h",
  author: "yangdongnan",
  defaultStyle: { width: "auto" },
  defaultProps: {
    showDate: true,
    showTime: true,
    showWeekday: false,
    format: "24h",
    dateFormat: "YYYY-MM-DD",
  },
  exposedValues: [{ key: "now", type: "string", description: "Current Time" }],
  configPanels: ["variables"],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      { key: "showDate", label: "Show Date", type: "switch", default: true },
      { key: "showTime", label: "Show Time", type: "switch", default: true },
      { key: "showWeekday", label: "Show Weekday", type: "switch", default: false },
      {
        key: "format",
        label: "Time Format",
        type: "select",
        default: "24h",
        options: [
          { label: "24 Hour", value: "24h" },
          { label: "12 Hour", value: "12h" },
        ],
      },
      {
        key: "dateFormat",
        label: "Date Format",
        type: "select",
        default: "YYYY-MM-DD",
        options: [
          { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
          { label: "YYYY/MM/DD", value: "YYYY/MM/DD" },
        ],
      },
    ],
  },
};

export function createRealtimeClockWidget(id: string) {
  return {
    id,
    name: realtimeClockConfig.name,
    type: "realtime-clock" as const,
    label: "Real-time Clock",
    props: { ...realtimeClockConfig.defaultProps },
    style: { ...realtimeClockConfig.defaultStyle },
    position: {
      x: 0,
      y: 0,
      w: 300,
      h: 80,
      xUnit: "px" as const,
      yUnit: "px" as const,
      wUnit: "px" as const,
      hUnit: "px" as const,
      zIndex: 1,
    },
  };
}
