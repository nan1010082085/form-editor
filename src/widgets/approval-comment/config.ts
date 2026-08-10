import type { WidgetConfig } from "../base/types";

export const approvalCommentConfig: WidgetConfig = {
  name: "FgApprovalComment",
  displayName: "Approval Comment",
  description: "Approval comment input",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "120px", fontSize: "14px" },
  defaultProps: {
    placeholder: "Please enterApproval Comment",
    rows: 4,
    maxlength: 1000,
    showWordLimit: true,
    clearable: true,
    disabled: false,
  },
  exposedValues: [
    {
      key: "value",
      type: "string",
      description: "Approval comment input",
      example: "",
    },
  ],
  configPanels: ["events", "linkages", "variables"],
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      {
        key: "placeholder",
        label: "Placeholder",
        type: "input",
        default: "Please enterApproval Comment",
      },
      { key: "rows", label: "Rows", type: "number", default: 4 },
      { key: "maxlength", label: "Max Chars", type: "number", default: 1000 },
      {
        key: "showWordLimit",
        label: "Show Count",
        type: "switch",
        default: true,
      },
      { key: "required", label: "Required", type: "switch", default: false },
    ],
  },
};
