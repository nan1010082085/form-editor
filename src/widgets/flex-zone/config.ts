import type { WidgetConfig } from "../base/types";

export const flexZoneConfig: WidgetConfig = {
  name: "FgFlexZone",
  displayName: "Flex Zone",
  description: "Flex sub-area within Free canvas; children render as flow layout with full CSS flex support",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "300px" },
  defaultProps: {
    minHeight: 100,
    padding: 8,
    background: "transparent",
    direction: "row",
    gap: 8,
    wrap: true,
    justify: "flex-start",
    align: "stretch",
  },
  configPanels: ["events", "variables"],
  propertyPanel: {
    basic: ["label"],
    style: ["padding", "background", "borderRadius"],
    props: [
      { key: "minHeight", label: "Min Height", type: "number", default: 100 },
      { key: "direction", label: "Direction", type: "select", default: "row", options: [
        { label: "Row", value: "row" },
        { label: "Column", value: "column" },
        { label: "Row Reverse", value: "row-reverse" },
        { label: "Column Reverse", value: "column-reverse" },
      ]},
      { key: "gap", label: "Gap (px)", type: "number", default: 8 },
      { key: "wrap", label: "Wrap", type: "switch", default: true },
      { key: "justify", label: "Justify Content", type: "select", default: "flex-start", options: [
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Space Between", value: "space-between" },
        { label: "Space Around", value: "space-around" },
        { label: "Space Evenly", value: "space-evenly" },
      ]},
      { key: "align", label: "Align Items", type: "select", default: "stretch", options: [
        { label: "Stretch", value: "stretch" },
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Baseline", value: "baseline" },
      ]},
    ],
  },
};
