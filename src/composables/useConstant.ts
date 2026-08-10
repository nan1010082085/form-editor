/**
 * useConstant — 全局常量集中管理
 *
 * 消除项目中的魔法数字/字符串, 统一引用。
 * ContainerType从 registry 动态获取, 支持CreateWidget自动适配。
 */
import { computed, type ComputedRef } from "vue";
import type { SchemaType } from "@/components/WidgetRenderer/types";
import { getAllWidgets, type WidgetRegistryItem } from "@/widgets/registry";

/**
 * 静态ContainerType集合（用于非Component上下文, 如工具函数、碰撞检测等）
 * 当 registry 未初始化Hrs作为 fallback。
 */
export const LAYOUT_CONTAINER_TYPES: ReadonlySet<SchemaType> =
  new Set<SchemaType>([
    "form",
    "card",
    "tabs",
    "dialog",
    "single-col",
    "double-col",
    "triple-col",
    "quad-col",
    "row-container",
  ]);

/** Edit历史Max快照数 */
export const MAX_HISTORY_SIZE = 30;

/** Component ID Hash 长度 */
export const ID_HASH_LENGTH = 5;

/**
 * 从 registry 动态获取ContainerType集合
 * container Group的 widget 都是Container
 * 当 registry 为空Hrs fallback 到 LAYOUT_CONTAINER_TYPES
 */
function getContainerTypesFromRegistry(): Set<SchemaType> {
  const types = new Set<SchemaType>();
  for (const item of getAllWidgets()) {
    if (item.group === "container" || item.group === "layout") {
      types.add(item.type);
    }
  }
  if (types.size === 0) {
    return new Set(LAYOUT_CONTAINER_TYPES);
  }
  return types;
}

/** 可容纳子节点的LayoutContainerType（动态） */
export function useLayoutContainerTypes(): ComputedRef<
  ReadonlySet<SchemaType>
> {
  return computed(() => getContainerTypesFromRegistry());
}

/** Edit器中可接受拖放的ContainerType（动态） */
export function useEditableContainerTypes(): ComputedRef<
  ReadonlySet<SchemaType>
> {
  return computed(() => getContainerTypesFromRegistry());
}

/** 交互模式 */
export const INTERACTION_MODES = [
  "edit",
  "preview",
  "publish-interactive",
  "publish-readonly",
] as const;

export type InteractionMode = (typeof INTERACTION_MODES)[number];

/** LayoutEdit模式 — 控制画布渲染和 widget 面板Row为 */
export const LAYOUT_EDIT_MODES = ["free", "grid"] as const;
export type LayoutEditMode = (typeof LAYOUT_EDIT_MODES)[number];

/**
 * 判断ComponentType是否为可嵌套Container（动态）
 */
export function canNest(type: SchemaType): boolean {
  return getContainerTypesFromRegistry().has(type);
}

/**
 * 获取所有ContainerType（静态Cache, 用于非响应式场景）
 * 注意：此函数每次调用都会遍历所有 widgets, 建议在非频繁调用场景使用
 */
export function useAllContainerTypes(): Set<SchemaType> {
  return getContainerTypesFromRegistry();
}

/** Layout/ContainerComponent（layout + container Group, 动态） */
export function useLayoutTypes(): ComputedRef<ReadonlySet<SchemaType>> {
  return computed(() => {
    const types = new Set<SchemaType>();
    for (const item of getAllWidgets()) {
      if (item.group === "layout" || item.group === "container") {
        types.add(item.type);
      }
    }
    return types;
  });
}

/** 静态基础Type fallback（registry 未初始化Hrs） */
const FALLBACK_BASIC_TYPES = new Set<SchemaType>([
  "input",
  "select",
  "number",
  "radio",
  "checkbox",
  "date",
  "textarea",
  "switch",
  "slider",
  "title",
  "divider",
  "spacer",
  "toolbar-buttons",
  "button",
  "table",
  "richtext",
  "upload",
  "banner",
  "date-time-slot",
  "time-picker",
  "file-list",
  "transfer",
  "cascader",
  "rate",
  "color-picker",
  "tag-input",
  "autocomplete",
  "descriptions",
  "advanced-table",
  "tree-table",
  "statistic",
  "permission-tree",
  "bar-chart",
  "stacked-bar-chart",
  "horizontal-bar-chart",
  "line-chart",
  "area-chart",
  "pie-chart",
  "donut-chart",
  "scatter-chart",
  "bubble-chart",
  "radar",
  "filled-radar",
  "gauge",
  "multi-gauge",
  "heatmap",
  "funnel",
  "compare-funnel",
  "candlestick",
]);

/** 静态业务Type fallback（registry 未初始化Hrs） */
const FALLBACK_BUSINESS_TYPES = new Set<SchemaType>([
  "approval-user-picker",
  "approval-role-picker",
  "approval-comment",
  "user-management",
  "role-management",
  "user-selector",
]);

/** Form控件 + Action + 展示 + 表格（动态） */
export function useBasicTypes(): ComputedRef<ReadonlySet<SchemaType>> {
  return computed(() => {
    const types = new Set<SchemaType>();
    for (const item of getAllWidgets()) {
      if (["form", "action", "static", "table"].includes(item.group)) {
        types.add(item.type);
      }
    }
    if (types.size === 0) {
      return FALLBACK_BASIC_TYPES;
    }
    return types;
  });
}

/** 业务Component（business Group, 动态） */
export function useBusinessTypes(): ComputedRef<ReadonlySet<SchemaType>> {
  return computed(() => {
    const types = new Set<SchemaType>();
    for (const item of getAllWidgets()) {
      if (item.group === "business") {
        types.add(item.type);
      }
    }
    if (types.size === 0) {
      return FALLBACK_BUSINESS_TYPES;
    }
    return types;
  });
}

/**
 * 获取指定Group的所有ComponentType
 */
export function useTypesByGroup(
  group: WidgetRegistryItem["group"],
): Set<SchemaType> {
  const types = new Set<SchemaType>();
  for (const item of getAllWidgets()) {
    if (item.group === group) {
      types.add(item.type);
    }
  }
  return types;
}
