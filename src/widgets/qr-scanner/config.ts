import type { WidgetConfig } from "../base/types";

export const qrScannerConfig: WidgetConfig = {
  name: "FgQrScanner",
  displayName: "Scan Input",
  description: "Barcode/QR scan field",
  author: "yangdongnan",
  defaultStyle: { width: "100%" },
  exposedValues: [{ key: "value", type: "string", description: "Scan Result" }],
  configPanels: ["events"],
  defaultProps: { label: "Scan Input" },
  propertyPanel: {
    basic: ["label", "field"],
    props: [
      { key: "label", label: "Label", type: "input", default: "Scan Input" },
    ],
  },
};
