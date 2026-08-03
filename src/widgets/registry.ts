import type { SchemaType, Widget, WidgetConfig } from "./base/types";
import type { Component } from "vue";

/** Widget 注册项 */
export interface WidgetRegistryItem {
  /** 组件名称 */
  name: string;
  /** 显示名称 */
  displayName: string;
  /** 组件类型 */
  type: SchemaType;
  /** 分组 */
  group:
    | "layout"
    | "form"
    | "container"
    | "table"
    | "action"
    | "static"
    | "business"
    | "chart";
  /** Vue 组件 */
  component: Component;
  /** 创建 Widget 的工厂函数 */
  create: (id: string) => Widget;
  /** 组件配置 */
  config: WidgetConfig;
  /** 可用布局模式 — undefined 表示两种模式都可用 */
  availableIn?: ("free" | "grid")[];
}

/** Widget 注册表 */
const registry = new Map<SchemaType, WidgetRegistryItem>();

/** 注册 Widget */
export function registerWidget(item: WidgetRegistryItem): void {
  // 未显式声明 availableIn 时，从 config.contexts 透传（声明式控制 widget 可用画布模式）
  if (item.availableIn === undefined && item.config?.contexts) {
    item.availableIn = item.config.contexts;
  }
  registry.set(item.type, item);
}

/** 获取 Widget 注册项 */
export function getWidget(type: SchemaType): WidgetRegistryItem | undefined {
  return registry.get(type);
}

/** 获取所有已注册的 Widget */
export function getAllWidgets(): WidgetRegistryItem[] {
  return Array.from(registry.values());
}

/** 按分组获取 Widget */
export function getWidgetsByGroup(
  group: WidgetRegistryItem["group"],
): WidgetRegistryItem[] {
  return Array.from(registry.values()).filter((w) => w.group === group);
}

/** Cached component map — registry is static after initialization */
let _cachedComponentMap: Record<string, Component> | null = null;

/** 获取组件映射表（用于 SchemaRender），带缓存 */
export function getComponentMap(): Record<string, Component> {
  if (!_cachedComponentMap) {
    const map: Record<string, Component> = {};
    for (const [type, item] of registry) {
      map[type] = item.component;
    }
    _cachedComponentMap = map;
  }
  return _cachedComponentMap;
}

/** 创建 Widget 实例 */
export function createWidget(type: SchemaType, id: string): Widget | null {
  const item = registry.get(type);
  if (!item) return null;
  return item.create(id);
}

/** 生成 Widget ID */
export function generateWidgetId(type: SchemaType): string {
  const hash = Math.random().toString(36).substring(2, 7);
  return `${type}_${hash}`;
}

/** 第三方 Widget 插件定义 */
export interface WidgetPlugin {
  widgets: WidgetRegistryItem[];
}

/**
 * 注册第三方 Widget 插件包
 * @example createWidgetPlugin({ widgets: [myWidgetItem] })
 */
export function createWidgetPlugin(plugin: WidgetPlugin): void {
  for (const item of plugin.widgets) {
    registerWidget(item);
    _cachedComponentMap = null;
  }
}

/** 获取所有已注册类型（运行时清单） */
export function getRegisteredTypes(): SchemaType[] {
  return Array.from(registry.keys());
}

/** SchemaType(kebab) → i18n key 兼容 camelCase 历史键 */
function widgetI18nTypeKey(type: string): string {
  return type.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/**
 * 解析 Widget 文案：先试 kebab type，再试 camelCase（兼容旧 locale 键）
 */
function resolveWidgetI18n(
  type: SchemaType,
  field: "displayName" | "description",
  t: (key: string) => string,
): string | null {
  const keys = [
    `editor.widgets.${type}.${field}`,
    `editor.widgets.${widgetI18nTypeKey(type)}.${field}`,
  ];
  for (const key of keys) {
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return null;
}

/**
 * 获取 Widget 翻译后的显示名称
 * 优先使用 i18n 翻译，回退到 config.displayName
 */
export function getWidgetDisplayName(
  type: SchemaType,
  t?: (key: string) => string,
): string {
  const item = registry.get(type);
  if (!item) return type;
  if (t) {
    const translated = resolveWidgetI18n(type, "displayName", t);
    if (translated) return translated;
  }
  return item.displayName;
}

/**
 * 获取 Widget 翻译后的描述
 * 优先使用 i18n 翻译，回退到 config.description
 */
export function getWidgetDescription(
  type: SchemaType,
  t?: (key: string) => string,
): string {
  const item = registry.get(type);
  if (!item) return "";
  if (t) {
    const translated = resolveWidgetI18n(type, "description", t);
    if (translated) return translated;
  }
  return item.config.description ?? "";
}
