import type { WidgetConfig } from "../base/types";
import { createMicroappPropertyItems } from "../base/microappConfig";

export const dialogConfig: WidgetConfig = {
  name: "FgDialog",
  displayName: "Dialog Container",
  description: "Dialog with edit/micro-app mode, configurable title/width/buttons",
  author: "yangdongnan",
  defaultStyle: {},
  defaultProps: {
    title: "弹窗标题",
    width: "600px",
    confirmText: "确定",
    cancelText: "取消",
    destroyOnClose: true,
    contentMode: "edit" as const,
    showFooter: true,
    closeOnClickModal: false,
    draggable: true,
    showFullscreenBtn: true,
  },
  propertyPanel: {
    basic: [
      { key: "title", label: "Title", type: "input", default: "弹窗标题" },
      { key: "width", label: "Width", type: "input", default: "600px" },
      {
        key: "confirmText",
        label: "Confirm Text",
        type: "input",
        default: "确定",
      },
      {
        key: "cancelText",
        label: "Cancel Text",
        type: "input",
        default: "取消",
      },
      {
        key: "destroyOnClose",
        label: "关闭时销毁",
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
        label: "点击遮罩关闭",
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
      // 子应用配置区块 — 仅微应用模式可见
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
