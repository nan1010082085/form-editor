/**
 * usePropertyPanelLogic - Property面板的PropertyUpdate与可见性求Value逻辑
 *
 * 从 PropertyPanel 抽出的业务逻辑：
 * - updateProperty：按 key 路径Min发到 widgetStore.updateWidget（顶层 / position / style / props 嵌套）
 * - isItemVisible / compileVisibleOn：对 panelDeclaration 的 visibleOn 表达式求Value
 * - setNestedValue / getNestedValue：props 嵌套路径读写
 *
 * visibleOn 来自各 widget 的 config.ts（非UserInput）, 用 new Function 编译并Cache。
 */
import type { ComputedRef } from "vue";
import type { Widget } from "@/widgets/base/types";
import type { useWidgetStore } from "@/stores/widget";
import type { PropertyItem } from "./usePropertySections";

// 顶层Property key（直接写到 widget 根级, 而非 props 下）
const TOP_LEVEL_KEYS = new Set([
  "field",
  "label",
  "defaultValue",
  "hidden",
  "options",
  "validationRules",
  "span",
  "gridSpan",
]);

/** visibleOn 编译Cache（模块级, 跨Component实例共享） */
const visibleOnCache = new Map<
  string,
  (props: Record<string, unknown>) => boolean
>();

/** 编译 visibleOn 表达式为函数, 带Cache */
export function compileVisibleOn(
  expr: string,
): (props: Record<string, unknown>) => boolean {
  const cached = visibleOnCache.get(expr);
  if (cached) return cached;
  // 将 "props.xxx === 'yyy'" Transform为 Function
  // 安全：visibleOn 来自 config.ts, 非UserInput
  const fn = new Function("props", `"use strict"; return (${expr})`) as (
    props: Record<string, unknown>,
  ) => boolean;
  visibleOnCache.set(expr, fn);
  return fn;
}

/** Settings嵌套路径Value（不可变Update） */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): Record<string, unknown> {
  if (path.length === 1) {
    return { ...obj, [path[0]]: value };
  }
  const [head, ...rest] = path;
  return {
    ...obj,
    [head]: setNestedValue(
      (obj[head] as Record<string, unknown>) ?? {},
      rest,
      value,
    ),
  };
}

/** 读取嵌套路径Value */
export function getNestedValue(
  obj: Record<string, unknown> | undefined,
  path: string,
): unknown {
  if (!obj) return undefined;
  return path
    .split(".")
    .reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);
}

export function usePropertyPanelLogic(
  selectedWidget: ComputedRef<Widget | null>,
  widgetStore: ReturnType<typeof useWidgetStore>,
) {
  /** 按 key 路径Update选中WidgetProperty */
  function updateProperty(key: string, value: unknown) {
    if (!selectedWidget.value) return;

    const parts = key.split(".");
    if (parts.length === 1) {
      if (TOP_LEVEL_KEYS.has(key)) {
        widgetStore.updateWidget(selectedWidget.value.id, { [key]: value });
      } else {
        widgetStore.updateWidget(selectedWidget.value.id, {
          props: { ...(selectedWidget.value.props ?? {}), [key]: value },
        });
      }
    } else if (parts[0] === "position") {
      widgetStore.updateWidget(selectedWidget.value.id, {
        position: { ...selectedWidget.value.position, [parts[1]]: value },
      });
    } else if (parts[0] === "style") {
      widgetStore.updateWidget(selectedWidget.value.id, {
        style: { ...(selectedWidget.value.style ?? {}), [parts[1]]: value },
      });
    } else if (parts[0] === "responsivePosition") {
      // responsivePosition.tablet.x -> widget.responsivePosition.tablet.x
      const bp = parts[1]; // "tablet" | "mobile"
      const field = parts[2]; // "x" | "y" | "w" | "h" | "hidden"
      const current = selectedWidget.value.responsivePosition ?? {};
      const bpOverride = current[bp as "tablet" | "mobile"] ?? {};
      widgetStore.updateWidget(selectedWidget.value.id, {
        responsivePosition: {
          ...current,
          [bp]: { ...bpOverride, [field]: value },
        },
      });
    } else if (parts[0] === "props") {
      // 支持嵌套路径：props.selection.enabled -> props.selection.enabled
      widgetStore.updateWidget(selectedWidget.value.id, {
        props: setNestedValue(
          selectedWidget.value.props ?? {},
          parts.slice(1),
          value,
        ),
      });
    }
  }

  /** Style补丁Update - BorderEditor / BorderRadiusEditor 发出多Field patch, 合并到现有 style 上 */
  function updateStylePatch(patch: Record<string, string>) {
    if (!selectedWidget.value) return;
    widgetStore.updateWidget(selectedWidget.value.id, {
      style: { ...(selectedWidget.value.style ?? {}), ...patch },
    });
  }

  /** 判断Property项Visible（visibleOn 求Value） */
  function isItemVisible(item: PropertyItem): boolean {
    if (!item.visibleOn) return true;
    const widget = selectedWidget.value;
    if (!widget) return true;
    try {
      const fn = compileVisibleOn(item.visibleOn);
      return !!fn(widget.props ?? {});
    } catch {
      return true;
    }
  }

  return { updateProperty, updateStylePatch, isItemVisible };
}
