import type { WidgetConfig } from "../base/types";

export const fileListConfig: WidgetConfig = {
  name: "FgFileList",
  displayName: "Attachment Panel",
  description:
    "Attachment list panel",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "200px" },
  exposedValues: [{ key: "value", type: "array", description: "File List Data" }],
  configPanels: ["events", "api", "variables"],
  defaultProps: {
    title: "Attachments",
    allowDelete: true,
    allowPreview: false,
    buttonText: "Select File",
  },
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      { key: "title", label: "Title", type: "input", default: "Attachments" },
      {
        key: "buttonText",
        label: "Button Text",
        type: "input",
        default: "Select File",
      },
      { key: "allowDelete", label: "Allow Delete", type: "switch", default: true },
      {
        key: "allowPreview",
        label: "Allow Preview",
        type: "switch",
        default: false,
      },
      {
        key: "accept",
        label: "File Type",
        type: "input",
        placeholder: ".jpg,.png,.pdf",
      },
      { key: "multiple", label: "Checkbox", type: "switch", default: true },
    ],
  },
};
