/**
 * Signature Pad Widget - Canvas 2D Sign绘制
 *
 * 适用场景：审批签字、合同Sign、Confirm签署
 * Output：base64 PNG 图片
 * 支持鼠标和触控设备
 */

import type { WidgetConfig } from "../base/types";

export const signatureConfig: WidgetConfig = {
  name: "FgSignature",
  displayName: "Signature Pad",
  description: "Canvas 2D signature drawing, outputs base64 PNG",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "200px" },
  defaultProps: {
    penWidth: 2,
    penColor: "#000000",
    backgroundColor: "#ffffff",
    showClear: true,
    clearText: "Clear",
    placeholder: "Sign here",
    outputFormat: "png",
  },
  exposedValues: [
    { key: "value", type: "string", description: "Base64 signature image", example: "data:image/png;base64,..." },
    { key: "isEmpty", type: "boolean", description: "Whether signature is empty", example: true },
  ],
  configPanels: ["events", "variables"],
  propertyPanel: {
    basic: ["field", "label"],
    style: ["backgroundColor"],
    props: [
      { key: "penWidth", label: "Pen Width", type: "number", default: 2 },
      { key: "penColor", label: "Pen Color", type: "color", default: "#000000" },
      { key: "backgroundColor", label: "Background", type: "color", default: "#ffffff" },
      { key: "showClear", label: "Show Clear Button", type: "switch", default: true },
      { key: "clearText", label: "Clear Button Text", type: "input", default: "Clear" },
      { key: "placeholder", label: "Placeholder Text", type: "input", default: "Sign here" },
    ],
  },
};
