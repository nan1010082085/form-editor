import type { WidgetConfig } from "../base/types";

export const uploadConfig: WidgetConfig = {
  name: "FgUpload",
  displayName: "File Upload",
  description: "File upload with list/count/size limits",
  author: "yangdongnan",
  defaultStyle: {
    width: "240px",
    height: "80px",
  },
  defaultProps: {
    accept: "",
    multiple: false,
    maxSize: 10,
    limit: 5,
    buttonText: "Click to Upload",
    listType: "text",
  },
  exposedValues: [
    { key: "value", type: "array", description: "Selected Files", example: [] },
  ],
  configPanels: ["events", "linkages", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label"],
    style: [],
    props: [
      { key: "placeholder", label: "Placeholder Text", type: "input", default: "" },
      {
        key: "accept",
        label: "File Type",
        type: "input",
        placeholder: ".jpg,.png,.pdf",
      },
      { key: "multiple", label: "Checkbox", type: "switch", default: false },
      { key: "limit", label: "Max Count", type: "number", default: 5 },
      { key: "maxSize", label: "Max File Size (MB)", type: "number", default: 10 },
      {
        key: "buttonText",
        label: "Button Text",
        type: "input",
        default: "Click to Upload",
      },
      {
        key: "listType",
        label: "List Style",
        type: "select",
        default: "text",
        options: [
          { label: "Text List", value: "text" },
          { label: "Image Thumbnail", value: "picture" },
          { label: "Card Thumbnail", value: "picture-card" },
        ],
      },
    ],
  },
};
