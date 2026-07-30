import type { WidgetConfig } from "../base/types";

export const microAppConfig: WidgetConfig = {
  name: "FgMicroApp",
  displayName: "Micro App",
  description: "Embed micro-frontend app",
  author: "system",
  defaultStyle: {},
  defaultProps: {
    name: "",
    url: "",
    width: "100%",
    height: "400px",
    iframe: false,
  },
  propertyPanel: {
    basic: [
      {
        key: "name",
        label: "Micro App Name",
        type: "input",
        default: "",
        placeholder: "例：my-sub-app",
        desc: "微应用唯一标识，对应 <micro-app> 的 name 属性",
      },
      {
        key: "url",
        label: "Micro App URL",
        type: "input",
        default: "",
        placeholder: "例：http://localhost:8080",
        desc: "微应用入口地址或文件资源地址",
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
        key: "iframe",
        label: "iframe Mode",
        type: "switch",
        default: false,
        desc: "是否使用 iframe 模式加载微应用",
      },
    ],
    style: [],
    props: [],
  },
  configPanels: ["events"],
  exposedValues: [
    {
      key: "name",
      type: "string",
      description: "Micro App Name",
      example: "my-sub-app",
    },
    {
      key: "url",
      type: "string",
      description: "Micro App URL",
      example: "http://localhost:8080",
    },
  ],
  eventTargets: [],
  receivableEvents: [],
};
