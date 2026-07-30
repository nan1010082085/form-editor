import { nanoid } from "nanoid";
import type { Widget } from "../base/types";
export function createRiskMatrixWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(), name: "FgRiskMatrix", type: "risk-matrix",
    field: "riskMatrix", label: "Risk Matrix",
    props: { staticData: [], riskTypeField: "type", severityField: "severity", title: "Risk Matrix", levels: ["Low","Medium","High","Critical"], showLegend: true },
    style: { width: "100%", height: "300px" },
    position: { x: 0, y: 0, w: 400, h: 250, zIndex: 1 }, children: [],
  };
}
