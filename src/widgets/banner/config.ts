import type { WidgetConfig } from "../base/types";

export const bannerConfig: WidgetConfig = {
  name: "FgBanner",
  displayName: "Banner",
  description: "Banner with info/success/warning/error types",
  author: "yangdongnan",
  defaultStyle: { width: "100%" },
  configPanels: ["events"],
  defaultProps: {
    text: "提示信息",
    type: "info" as const,
    closable: true,
  },
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      { key: "text", label: "Hint", type: "input", default: "提示信息" },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          { label: "Info", value: "info" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
        ],
        default: "info",
      },
      { key: "closable", label: "Closable", type: "switch", default: true },
    ],
  },
};
