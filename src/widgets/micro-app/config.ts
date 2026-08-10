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
        placeholder: "e.g. my-sub-app",
        desc: "Micro-app unique key, corresponds to <micro-app> name property",
      },
      {
        key: "url",
        label: "Micro App URL",
        type: "input",
        default: "",
        placeholder: "e.g. http://localhost:8080",
        desc: "Micro-app entry URL or file resource path",
      },
      {
        key: "width",
        label: "Width",
        type: "input",
        default: "100%",
        placeholder: "e.g. 100% or 800px",
      },
      {
        key: "height",
        label: "Height",
        type: "input",
        default: "400px",
        placeholder: "e.g. 400px or 100%",
      },
      {
        key: "iframe",
        label: "iframe Mode",
        type: "switch",
        default: false,
        desc: "Whether to load micro-app in iframe mode",
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
