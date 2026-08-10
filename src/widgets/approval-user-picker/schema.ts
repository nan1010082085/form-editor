import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createApprovalUserPickerWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgApprovalUserPicker",
    type: "approval-user-picker",
    field: "approver",
    label: "Approver",
    props: {
      placeholder: "Please selectApprover",
      clearable: true,
      multiple: false,
      apiBaseUrl: "",
    },
    style: { width: "240px", height: "40px", fontSize: "14px" },
    position: { x: 0, y: 0, w: 280, h: 40, zIndex: 1 },
    children: [],
  };
}
