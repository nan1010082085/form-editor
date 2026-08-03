import type { WidgetConfig } from "../base/types";
export const spacerConfig: WidgetConfig = {
  name: "FgSpacer",
  displayName: "间距",
  description: "Spacer for controlling element gap",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    height: "20px",
  },
  configPanels: ["events"],
  defaultProps: {
    height: 20,
  },
  propertyPanel: {
    basic: ["field", "label"],
    style: ["margin", "padding", "backgroundColor"],
    props: [{ key: "height", label: "Height", type: "number", default: 20 }],
  },
};
