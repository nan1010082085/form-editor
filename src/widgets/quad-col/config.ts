import type { WidgetConfig } from "../base/types";

export const quadColConfig: WidgetConfig = {
  name: "FgQuadCol",
  displayName: "Quad Column",
  description: "Quad column layout, 1 component per column",
  author: "yangdongnan",
  defaultPosition: { w: 100, wUnit: "%", h: 200 },
  defaultStyle: {},
  configPanels: ["events", "variables"],
  defaultProps: {
    gutter: 16,
    colWidths: [0, 0, 0, 0],
    colWidthUnit: "px",
  },
  propertyPanel: {
    basic: [
      { key: "gutter", label: "Col Gap", type: "number", default: 16 },
      {
        key: "colWidths",
        label: "Col Width (px, 0=auto)",
        type: "number-array",
      },
    ],
    style: ["margin", "padding"],
    props: [],
  },
};
