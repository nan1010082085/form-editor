import type { WidgetConfig } from "../base/types";

export const complianceChecklistConfig: WidgetConfig = {
  name: "FgComplianceChecklist",
  displayName: "Compliance Checklist",
  description: "Compliance checklist",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "16px",
  },
  exposedValues: [
    { key: "checkedItems", type: "object", description: "Checked Items" },
    { key: "remark", type: "string", description: "Remark" },
  ],
  configPanels: ["events"],
  defaultProps: {
    title: "Compliance Checklist",
    items: [
      { key: "item1", label: "Check Item 1" },
      { key: "item2", label: "Check Item 2" },
    ],
  },
  propertyPanel: {
    basic: ["label"],
    props: [
      { key: "title", label: "Title", type: "input", default: "Compliance Checklist" },
    ],
  },
};
