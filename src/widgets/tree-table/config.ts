import type { WidgetConfig } from "../base/types";

export interface TreeTableColumn {
  prop: string;
  label: string;
  minWidth?: number;
  width?: number;
  align?: "left" | "center" | "right";
}

export const treeTableConfig: WidgetConfig = {
  name: "FgTreeTable",
  displayName: "Tree Table",
  description: "Tree table for org/menu hierarchy",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "600px" },
  defaultProps: {
    columns: [
      { prop: "name", label: "Name", minWidth: 200 },
      { prop: "status", label: "Status", minWidth: 100 },
      { prop: "sort", label: "Sort", minWidth: 80 },
    ] as TreeTableColumn[],
    rowKey: "id",
    childrenKey: "children",
    defaultExpandAll: true,
    stripe: true,
    border: true,
    height: 560,
  },
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading State" },
    { key: "treeData", type: "array", description: "Tree Data" },
  ],
  configPanels: ["api", "variables"],
  receivableEvents: [{ name: "refresh", description: "Reload Data" }],
  propertyPanel: {
    basic: ["label"],
    style: ["width", "height"],
    props: [
      { key: "columns", label: "Column Config", type: "columns" },
      { key: "rowKey", label: "Row Key", type: "input" },
      { key: "childrenKey", label: "子节点字段", type: "input" },
      { key: "defaultExpandAll", label: "Default Expanded", type: "switch" },
      { key: "height", label: "Height", type: "number" },
      { key: "stripe", label: "Stripe", type: "switch" },
      { key: "border", label: "Border", type: "switch" },
    ],
  },
};
