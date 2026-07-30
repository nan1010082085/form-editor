import type { WidgetConfig } from "../base/types";

export const iframeConfig: WidgetConfig = {
  name: "FgIframe",
  displayName: "iframe",
  description: "Embed External Page",
  author: "system",
  defaultStyle: {},
  defaultProps: {
    src: "",
    width: "100%",
    height: "400px",
    border: false,
    fullscreen: false,
    dialogMode: false,
  },
  propertyPanel: {
    basic: [
      {
        key: "src",
        label: "URL",
        type: "input",
        default: "",
        placeholder: "请输入 iframe 地址",
        desc: "iframe 嵌入的外部网页地址",
      },
      {
        key: "width",
        label: "Width",
        type: "input",
        default: "100%",
        placeholder: "例：100% 或 800px",
      },
      {
        key: "height",
        label: "Height",
        type: "input",
        default: "400px",
        placeholder: "例：400px 或 100%",
      },
      {
        key: "border",
        label: "Show Border",
        type: "switch",
        default: false,
      },
      {
        key: "fullscreen",
        label: "Fullscreen Mode",
        type: "switch",
        default: false,
        desc: "iframe 固定铺满整个视口",
      },
      {
        key: "dialogMode",
        label: "弹框模式",
        type: "switch",
        default: false,
        desc: "使用遮罩弹框包裹 iframe",
      },
    ],
    style: [],
    props: [],
  },
  configPanels: ["events"],
  exposedValues: [
    {
      key: "src",
      type: "string",
      description: "Current iframe URL",
      example: "https://example.com",
    },
  ],
  eventTargets: [],
  receivableEvents: [],
};
