import type { WidgetConfig } from "../base/types";
import { createMicroappPropertyItems } from "../base/microappConfig";

export const dialogConfig: WidgetConfig = {
  name: "FgDialog",
  displayName: "Dialog Container",
  description: "Dialog with edit/micro-app mode, configurable title/width/buttons",
  author: "yangdongnan",
  defaultStyle: {},
  defaultProps: {
    title: "Dialog title",
    width: "600px",
    confirmText: "OK",
    cancelText: "Cancel",
    destroyOnClose: true,
    contentMode: "edit" as const,
    showFooter: true,
    closeOnClickModal: false,
    draggable: true,
    showFullscreenBtn: true,
  },
  propertyPanel: {
    basic: [
      { key: "title", label: "Title", type: "input", default: "Dialog title" },
      { key: "width", label: "Width", type: "input", default: "600px" },
      {
        key: "confirmText",
        label: "Confirm Text",
        type: "input",
        default: "OK",
      },
      {
        key: "cancelText",
        label: "Cancel Text",
        type: "input",
        default: "Cancel",
      },
      {
        key: "destroyOnClose",
        label: "Destroy on close",
        type: "switch",
        default: true,
      },
      {
        key: "showFooter",
        label: "Show Footer",
        type: "switch",
        default: true,
      },
      {
        key: "closeOnClickModal",
        label: "Close on mask click",
        type: "switch",
        default: false,
      },
      {
        key: "contentMode",
        label: "Content Mode",
        type: "select",
        options: [
          { label: "Edit Mode", value: "edit" },
          { label: "Micro App Mode", value: "microapp" },
        ],
        default: "edit",
      },
      // Micro-app config section — Only visible in micro-app mode
      ...createMicroappPropertyItems("props.contentMode === 'microapp'"),
    ],
    style: [],
    props: [
      { key: "draggable", label: "Draggable", type: "switch", default: true },
      {
        key: "showFullscreenBtn",
        label: "Show Fullscreen",
        type: "switch",
        default: true,
      },
    ],
  },
  exposedValues: [
    { key: "visible", type: "boolean", description: "Dialog Visible" },
    { key: "dialogData", type: "object", description: "Dialog Form Data" },
  ],
  eventTargets: [
    { id: "confirm", label: "Confirm Button", description: "On Confirm" },
    { id: "cancel", label: "Cancel Button", description: "On Cancel" },
  ],
  configPanels: ["events", "variables"],
  receivableEvents: [
    { name: "open", description: "Open Dialog" },
    { name: "close", description: "Close Dialog" },
  ],
};
