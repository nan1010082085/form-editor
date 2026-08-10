import type { WidgetConfig } from "../base/types";
export const dateConfig: WidgetConfig = {
  name: "FgDate",
  displayName: "Date Picker",
  description: "Date picker with format config",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "40px",
    fontSize: "14px",
  },
  defaultProps: {
    placeholder: "Please select date",
    clearable: true,
    disabled: false,
    type: "date" as "date" | "datetime" | "daterange",
    format: "YYYY-MM-DD",
  },
  exposedValues: [
    { key: "value", type: "string", description: "Current field value", example: "" },
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
        default: "Please select date",
      },
      { key: "clearable", label: "Clearable", type: "switch", default: true },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          { label: "Date", value: "date" },
          { label: "DateTime", value: "datetime" },
          { label: "Date Range", value: "daterange" },
        ],
        default: "date",
      },
      { key: "format", label: "Format", type: "input", default: "YYYY-MM-DD" },
    ],
  },
};
