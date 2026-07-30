import type { WidgetConfig } from "../base/types";

export const fileViewerConfig: WidgetConfig = {
  name: "FgFileViewer",
  displayName: "File Viewer",
  description: "Preview images, PDFs, and other files inline",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    url: "",
    fileType: "image",
    alt: "Preview",
    fit: "contain",
    maxHeight: 400,
  },
  exposedValues: [
    { key: "url", type: "string", description: "File URL" },
  ],
  configPanels: ["api", "variables", "events"],
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      { key: "url", label: "File URL", type: "input", default: "" },
      { key: "fileType", label: "File Type", type: "select", default: "image", options: [
        { label: "Image", value: "image" }, { label: "PDF", value: "pdf" },
      ]},
      { key: "alt", label: "Alt Text", type: "input", default: "Preview" },
      { key: "fit", label: "Fit", type: "select", default: "contain", options: [
        { label: "Contain", value: "contain" }, { label: "Cover", value: "cover" },
        { label: "Fill", value: "fill" }, { label: "Scale-down", value: "scale-down" },
      ]},
      { key: "maxHeight", label: "Max Height", type: "number", default: 400 },
    ],
  },
};
