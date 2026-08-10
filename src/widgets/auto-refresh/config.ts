import type { WidgetConfig } from "../base/types";

export const autoRefreshConfig: WidgetConfig = {
  name: "FgAutoRefresh",
  displayName: "Auto Refresh",
  description: "Dashboard auto-refresh target",
  author: "yangdongnan",
  defaultStyle: { width: "auto" },
  defaultProps: {
    intervalSeconds: 30,
    targets: "",
    showStatus: true,
  },
  configPanels: ["events", "variables"],
  exposedValues: [
    { key: "lastRefreshAt", type: "string", description: "Last Refresh" },
    { key: "tickCount", type: "number", description: "Refresh Count" },
  ],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      {
        key: "intervalSeconds",
        label: "Refresh Interval (s)",
        type: "number",
        default: 30,
      },
      {
        key: "targets",
        label: "Target Widget ID",
        type: "input",
        placeholder: "Comma-separated, e.g. kpi-1,chart-1",
        default: "",
      },
      { key: "showStatus", label: "Show Status", type: "switch", default: true },
    ],
  },
};
