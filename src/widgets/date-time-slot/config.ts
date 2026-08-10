import type { WidgetConfig } from "../base/types";

export const dateTimeSlotConfig: WidgetConfig = {
  name: "FgDateTimeSlot",
  displayName: "Date Range",
  description: "Date-time range picker",
  author: "yangdongnan",
  defaultStyle: { width: "400px", height: "40px" },
  defaultProps: {
    startPlaceholder: "Start time",
    endPlaceholder: "End time",
    format: "YYYY-MM-DD HH:mm:ss",
    rangeSeparator: "to",
  },
  exposedValues: [
    { key: "value", type: "string", description: "Current field value", example: "" },
  ],
  configPanels: ["events", "linkages", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label"],
    style: [],
    props: [
      {
        key: "startPlaceholder",
        label: "Start Placeholder",
        type: "input",
        default: "Start time",
      },
      {
        key: "endPlaceholder",
        label: "End Placeholder",
        type: "input",
        default: "End time",
      },
      {
        key: "format",
        label: "Format",
        type: "input",
        default: "YYYY-MM-DD HH:mm:ss",
      },
      { key: "rangeSeparator", label: "Separator", type: "input", default: "to" },
    ],
  },
};
