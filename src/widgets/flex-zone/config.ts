import type { WidgetConfig } from "../base/types";

export const flexZoneConfig: WidgetConfig = {
  name: "FgFlexZone",
  displayName: "Flex Zone",
  description: "Flex sub-area within Free canvas; children render as flow layout",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "300px" },
  defaultProps: {
    minHeight: 100,
    padding: 8,
    background: "transparent",
  },
  configPanels: ["events", "variables"],
  propertyPanel: {
    basic: ["label"],
    style: ["padding", "background", "borderRadius"],
    props: [
      { key: "minHeight", label: "Min Height", type: "number", default: 100 },
    ],
  },
};
