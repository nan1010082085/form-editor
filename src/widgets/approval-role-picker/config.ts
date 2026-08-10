import type { WidgetConfig } from "../base/types";

export const approvalRolePickerConfig: WidgetConfig = {
  name: "FgApprovalRolePicker",
  displayName: "Approval Role",
  description: "Approval role selector from Flow API",
  author: "yangdongnan",
  defaultStyle: { width: "240px", height: "40px", fontSize: "14px" },
  defaultProps: {
    placeholder: "Please selectApproval Role",
    clearable: true,
    disabled: false,
    multiple: false,
    apiBaseUrl: "",
  },
  exposedValues: [
    { key: "value", type: "string", description: "Selected Role ID", example: "" },
    { key: "label", type: "string", description: "Selected Role Name", example: "" },
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
        default: "Please selectApproval Role",
      },
      { key: "clearable", label: "Clearable", type: "switch", default: true },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "multiple", label: "Checkbox", type: "switch", default: false },
      { key: "apiBaseUrl", label: "Flow API URL", type: "input", default: "" },
    ],
  },
};
