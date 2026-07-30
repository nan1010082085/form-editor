import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createRiskBadgeWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgRiskBadge",
    type: "risk-badge",
    field: "riskBadge",
    label: "风险标签",
    props: {
      level: "medium",
      description: "",
    },
    style: { width: "auto", height: "auto", fontSize: "14px" },
    position: { x: 0, y: 0, w: 160, h: 40, zIndex: 1 },
    children: [],
  };
}
