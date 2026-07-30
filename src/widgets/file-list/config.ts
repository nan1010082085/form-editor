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
    title: "附件",
    allowDelete: true,
    allowPreview: false,
    buttonText: "选择文件",
  },
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      { key: "title", label: "Title", type: "input", default: "附件" },
      {
        key: "buttonText",
        label: "Button Text",
        type: "input",
        default: "选择文件",
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
