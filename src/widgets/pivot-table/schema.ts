import { nanoid } from "nanoid";
import type { Widget } from "../base/types";
export function createPivotTableWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(), name: "FgPivotTable", type: "pivot-table",
    field: "pivotTable", label: "Pivot Table",
    props: { staticData: [], rowField: "", columnField: "", valueField: "", aggregation: "sum", showTotals: true },
    style: { width: "100%", height: "400px" },
    position: { x: 0, y: 0, w: 400, h: 300, zIndex: 1 }, children: [],
  };
}
