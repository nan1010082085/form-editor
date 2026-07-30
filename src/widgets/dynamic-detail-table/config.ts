import type { WidgetConfig } from "../base/types";
import { dynamicDetailTableMock } from "./mock";

export interface DetailColumn {
  prop: string;
  label: string;
  type?: "input" | "number" | "select";
  width?: number;
}

export const dynamicDetailTableConfig: WidgetConfig = {
  name: "FgDynamicDetailTable",
  displayName: "Dynamic Detail Table",
  description: "Editable expense/purchase detail",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "12px",
  },
  exposedValues: [{ key: "rows", type: "array", description: "Detail Row Data" }],
  configPanels: ["events", "variables"],
  defaultProps: {
    title: "费用明细",
    field: "items",
    columns: dynamicDetailTableMock.defaultProps.columns,
    staticData: dynamicDetailTableMock.staticData.rows,
  },
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      { key: "title", label: "Title", type: "input", default: "费用明细" },
      { key: "field", label: "Bound Field", type: "input", default: "items" },
    ],
  },
};
