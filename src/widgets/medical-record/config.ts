import type { WidgetConfig } from "../base/types";

export const medicalRecordConfig: WidgetConfig = {
  name: "FgMedicalRecord",
  displayName: "Medical Record",
  description: "Structured medical record form with predefined fields (chief complaint, diagnosis, medications, etc.)",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "auto" },
  defaultProps: {
    showLabels: true,
    formData: {},
  },
  configPanels: ["events", "variables"],
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      { key: "showLabels", label: "Show Labels", type: "switch", default: true },
    ],
  },
};
