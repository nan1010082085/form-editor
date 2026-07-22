/**
 * usePropertyPanelLogic - 属性面板的属性更新与可见性求值逻辑
 *
 * 从 PropertyPanel 抽出的业务逻辑：
 * - updateProperty：按 key 路径分发到 widgetStore.updateWidget（顶层 / position / style / props 嵌套）
 * - isItemVisible / compileVisibleOn：对 panelDeclaration 的 visibleOn 表达式求值
 * - setNestedValue / getNestedValue：props 嵌套路径读写
 *
 * visibleOn 来自各 widget 的 config.ts（非用户输入），用 new Function 编译并缓存。
 */
import type { ComputedRef } from 'vue'
import type { Widget } from '@/widgets/base/types'
import type { useWidgetStore } from '@/stores/widget'
import type { PropertyItem } from './usePropertySections'

// 顶层属性 key（直接写到 widget 根级，而非 props 下）
const TOP_LEVEL_KEYS = new Set(['field', 'label', 'defaultValue', 'hidden', 'options', 'validationRules', 'span'])

/** visibleOn 编译缓存（模块级，跨组件实例共享） */
const visibleOnCache = new Map<string, (props: Record<string, unknown>) => boolean>()

/** 编译 visibleOn 表达式为函数，带缓存 */
export function compileVisibleOn(expr: string): (props: Record<string, unknown>) => boolean {
  const cached = visibleOnCache.get(expr)
  if (cached) return cached
  // 将 "props.xxx === 'yyy'" 转换为 Function
  // 安全：visibleOn 来自 config.ts，非用户输入
  const fn = new Function('props', `"use strict"; return (${expr})`) as (props: Record<string, unknown>) => boolean
  visibleOnCache.set(expr, fn)
  return fn
}

/** 设置嵌套路径值（不可变更新） */
export function setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  if (path.length === 1) {
    return { ...obj, [path[0]]: value }
  }
  const [head, ...rest] = path
  return {
    ...obj,
    [head]: setNestedValue((obj[head] as Record<string, unknown>) ?? {}, rest, value),
  }
}

/** 读取嵌套路径值 */
export function getNestedValue(obj: Record<string, unknown> | undefined, path: string): unknown {
  if (!obj) return undefined
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj)
}

export function usePropertyPanelLogic(
  selectedWidget: ComputedRef<Widget | null>,
  widgetStore: ReturnType<typeof useWidgetStore>,
) {
  /** 按 key 路径更新选中部件属性 */
  function updateProperty(key: string, value: unknown) {
    if (!selectedWidget.value) return

    const parts = key.split('.')
    if (parts.length === 1) {
      if (TOP_LEVEL_KEYS.has(key)) {
        widgetStore.updateWidget(selectedWidget.value.id, { [key]: value })
      } else {
        widgetStore.updateWidget(selectedWidget.value.id, {
          props: { ...(selectedWidget.value.props ?? {}), [key]: value },
        })
      }
    } else if (parts[0] === 'position') {
      widgetStore.updateWidget(selectedWidget.value.id, {
        position: { ...selectedWidget.value.position, [parts[1]]: value },
      })
    } else if (parts[0] === 'style') {
      widgetStore.updateWidget(selectedWidget.value.id, {
        style: { ...(selectedWidget.value.style ?? {}), [parts[1]]: value },
      })
    } else if (parts[0] === 'props') {
      // 支持嵌套路径：props.selection.enabled -> props.selection.enabled
      widgetStore.updateWidget(selectedWidget.value.id, {
        props: setNestedValue(selectedWidget.value.props ?? {}, parts.slice(1), value),
      })
    }
  }

  /** 样式补丁更新 - BorderEditor / BorderRadiusEditor 发出多字段 patch，合并到现有 style 上 */
  function updateStylePatch(patch: Record<string, string>) {
    if (!selectedWidget.value) return
    widgetStore.updateWidget(selectedWidget.value.id, {
      style: { ...(selectedWidget.value.style ?? {}), ...patch },
    })
  }

  /** 判断属性项是否可见（visibleOn 求值） */
  function isItemVisible(item: PropertyItem): boolean {
    if (!item.visibleOn) return true
    const widget = selectedWidget.value
    if (!widget) return true
    try {
      const fn = compileVisibleOn(item.visibleOn)
      return !!fn(widget.props ?? {})
    } catch {
      return true
    }
  }

  return { updateProperty, updateStylePatch, isItemVisible }
}
