import type { WidgetConfig } from "../base/types";

export const rowContainerConfig: WidgetConfig = {
  name: "FgRowContainer",
  displayName: "Grid Row",
  description:
    "24-grid row container, Flex only",
  author: "yangdongnan",
  defaultStyle: { width: "100%" },
  defaultProps: {
    gutter: 12,
  },
  propertyPanel: {
    basic: [
      {
        key: "gutter",
        label: "Col Gap",
        type: "number",
        default: 12,
        desc: "Gap between cells (px)",
      },
    ],
    style: ["margin", "padding", "backgroundColor"],
    props: [],
  },
  configPanels: ["events", "variables"],
  contexts: ["grid"],
};
