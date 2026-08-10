/**
 * 微应用Config模块 — 被 micro-app-container 和 dialog 两个 Widget 共用
 *
 * 提供统一的Property面板Configitems和DefaultValue。
 */
import type { PropertyPanelItem } from "./types";

/** 微应用Default props */
export const microappDefaults = {
  microappName: "",
  microappEntry: "",
  microappSandbox: true,
  microappStyleIsolation: "experimental" as const,
  microappTimeout: 10000,
  microappFallback: "Micro-app load failed",
  microappRouteBase: "",
  microappRoute: "",
};

/** 微应用Property面板Configitems（带 visibleOn Condition） */
export function createMicroappPropertyItems(
  visibleOn: string,
): PropertyPanelItem[] {
  return [
    {
      key: "microappName",
      label: "Micro-app name",
      type: "input",
      default: "",
      placeholder: "e.g. approval-flow",
      visibleOn,
    },
    {
      key: "microappEntry",
      label: "Entry URL",
      type: "input",
      default: "",
      placeholder: "e.g. http://localhost:6000",
      visibleOn,
    },
    {
      key: "microappRoute",
      label: "Load route",
      type: "input",
      default: "",
      placeholder: "e.g. /approval/123 (SPA route path)",
      visibleOn,
    },
    {
      key: "microappRouteBase",
      label: "Route Prefix",
      type: "input",
      default: "",
      placeholder: "Leave empty for auto-match",
      visibleOn,
    },
    {
      key: "microappSandbox",
      label: "Enable Sandbox",
      type: "switch",
      default: true,
      visibleOn,
    },
    {
      key: "microappStyleIsolation",
      label: "CSS Isolation",
      type: "select",
      options: [
        { label: "Experimental Isolation", value: "experimental" },
        { label: "Strict Isolation", value: "strict" },
        { label: "Close", value: "none" },
      ],
      default: "experimental",
      visibleOn,
    },
    {
      key: "microappTimeout",
      label: "Load timeout（ms）",
      type: "number",
      default: 10000,
      visibleOn,
    },
    {
      key: "microappFallback",
      label: "Load Failed Text",
      type: "input",
      default: "Micro-app load failed",
      placeholder: "Text shown when load fails",
      visibleOn,
    },
  ];
}
