import type { WidgetConfig } from "../base/types";

export const singleColConfig: WidgetConfig = {
  name: "FgSingleCol",
  displayName: "Single Column",
  description: "Single column layout, holds 1 component",
  author: "yangdongnan",
  defaultPosition: { w: 100, wUnit: "%", h: 200 },
  defaultStyle: {},
  configPanels: ["events", "variables"],
  defaultProps: {
    gutter: 16,
    colWidths: [100],
  },
  propertyPanel: {
    basic: [
      { key: "gutter", label: "Col Gap", type: "number", default: 16 },
      {
        key: "colWidths",
        label: "Col Width (%)",
        type: "number-array",
      },
    ],
    style: ["margin", "padding"],
    props: [],
  },
};
