import { nanoid } from "nanoid";
import type { Widget } from "../base/types";
import { APPROVAL_MOCK_NODES } from "./mock";

export function createApprovalProcessWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgApprovalProcess",
    type: "approval-process",
    label: "Approval Process",
    props: {
      orientation: "horizontal",
      showTimeline: true,
      nodeSize: "medium",
      activeColor: "#409eff",
      approvedColor: "#67c23a",
      rejectedColor: "#f56c6c",
      nodes: APPROVAL_MOCK_NODES,
    },
    style: { width: "100%", height: "300px", fontSize: "14px" },
    position: { x: 0, y: 0, w: 600, h: 300, zIndex: 1 },
    children: [],
  };
}
