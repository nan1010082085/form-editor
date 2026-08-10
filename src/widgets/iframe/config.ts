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
        placeholder: "Please enter iframe URL",
        desc: "External webpage URL embedded in iframe",
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
        desc: "iframe fills the entire viewport",
      },
      {
        key: "dialogMode",
        label: "Dialog mode",
        type: "switch",
        default: false,
        desc: "Wrap iframe in a modal dialog",
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
