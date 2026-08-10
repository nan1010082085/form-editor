import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createApprovalCommentWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgApprovalComment",
    type: "approval-comment",
    field: "approvalComment",
    label: "Approval Comment",
    props: {
      placeholder: "Please enterApproval Comment",
      rows: 4,
      maxlength: 1000,
      showWordLimit: true,
    },
    style: { width: "100%", height: "120px", fontSize: "14px" },
    position: { x: 0, y: 0, w: 280, h: 120, zIndex: 1 },
    children: [],
  };
}
