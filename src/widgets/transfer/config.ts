import type { WidgetConfig } from "../base/types";

export const transferConfig: WidgetConfig = {
  name: "FgTransfer",
  displayName: "Transfer",
  description: "Transfer with static/API options",
  author: "yangdongnan",
  defaultStyle: { width: "700px", height: "300px" },
  defaultProps: {
    leftTitle: "Available",
    rightTitle: "Selected",
    filterable: true,
  },
  exposedValues: [{ key: "value", type: "array", description: "Selected Value" }],
  configPanels: ["events", "linkages", "variables", "api"] as const,
  propertyPanel: {
    basic: ["field", "label", "options"],
    style: [],
    props: [
      { key: "leftTitle", label: "Left Title", type: "text", default: "Available" },
      { key: "rightTitle", label: "Right Title", type: "text", default: "Selected" },
      { key: "filterable", label: "Searchable", type: "switch", default: true },
    ],
  },
};
