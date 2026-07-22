/**
 * usePropertySections - 构建属性面板分区列表
 *
 * 从 PropertyPanel 抽出的核心逻辑：根据 widget 配置声明 + 布局模式，
 * 组装 basic / position / flex-layout / style / props 五个分区。
 *
 * 设计：
 * - 纯函数式组装，依赖通过参数注入（selectedWidget/panelDeclaration/t/stores）
 * - layoutMode 决定 position(free) vs flex-layout(flex) 分支
 * - row-container 子节点额外暴露 span 字段
 */
import { computed, type ComputedRef } from 'vue'
import type { TranslateFn } from '@/components/WidgetRenderer/types'
import type { Widget, ArrayFieldSchema } from '@/widgets/base/types'
import { publicStylePanel } from '@/widgets/base/publicSchema'
import { useWidgetStore } from '@/stores/widget'
import { useBoardStore } from '@/stores/board'
import { usePropertyAdapters } from './usePropertyAdapters'

export interface SelectOption {
  label: string
  value: string | number | boolean
}

export interface PropertyItem {
  key: string
  label: string
  type: string
  value: unknown
  desc?: string
  placeholder?: string
  options?: SelectOption[]
  fields?: ArrayFieldSchema[]
  remoteUrl?: string
  labelField?: string
  valueField?: string
  visibleOn?: string
  unit?: string
  unitKey?: string
}

export interface PropertySection {
  key: string
  label: string
  items: PropertyItem[]
}

interface PropertyPanelDeclaration {
  basic?: Array<string | { key: string; label: string; type: string; default?: unknown; desc?: string; options?: SelectOption[]; fields?: ArrayFieldSchema[]; visibleOn?: string; placeholder?: string; remoteUrl?: string; labelField?: string; valueField?: string }>
  style?: string[]
  props?: Array<string | { key: string; label: string; type: string; default?: unknown; desc?: string; options?: SelectOption[]; fields?: ArrayFieldSchema[]; visibleOn?: string; placeholder?: string; remoteUrl?: string; labelField?: string; valueField?: string }>
}

function getNestedValue(obj: Record<string, unknown> | undefined, path: string): unknown {
  if (!obj) return undefined
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj)
}

export function usePropertySections(
  selectedWidget: ComputedRef<Widget | null>,
  panelDeclaration: ComputedRef<PropertyPanelDeclaration | undefined>,
  t: TranslateFn,
) {
  const widgetStore = useWidgetStore()
  const boardStore = useBoardStore()
  const { getStyleLabel, getStyleInputType, getPropInputType, getStyleOptions } = usePropertyAdapters()

  function getBasicPropertyItem(prop: string, widget: Widget): PropertyItem {
    const map: Record<string, { label: string; type: string; value: unknown; desc: string }> = {
      field: { label: t('editor.property.field'), type: 'text', value: widget.field, desc: t('editor.property.fieldDesc') },
      label: { label: t('editor.property.label'), type: 'text', value: widget.label, desc: t('editor.property.labelDesc') },
      defaultValue: { label: t('editor.property.defaultValue'), type: 'text', value: widget.defaultValue, desc: t('editor.property.defaultValueDesc') },
      hidden: { label: t('editor.property.hidden'), type: 'switch', value: widget.hidden, desc: t('editor.property.hiddenDesc') },
      options: { label: t('editor.property.options'), type: 'options', value: widget.options, desc: t('editor.property.optionsDesc') },
      validationRules: { label: t('editor.property.validationRules'), type: 'rules', value: widget.validationRules, desc: t('editor.property.validationRulesDesc') },
    }
    const mapped = map[prop]
    if (mapped) {
      return { key: prop, ...mapped }
    }
    return { key: prop, label: prop, type: 'text', value: widget.props?.[prop] }
  }

  const propertySections = computed<PropertySection[]>(() => {
    if (!panelDeclaration.value || !selectedWidget.value) return []

    const sections: PropertySection[] = []
    const panel = panelDeclaration.value
    const widget = selectedWidget.value

    // 1. 基础属性
    const basicItems: PropertyItem[] = []
    if (panel.basic) {
      for (const prop of panel.basic) {
        if (typeof prop === 'string') {
          basicItems.push(getBasicPropertyItem(prop, widget))
        } else {
          basicItems.push({
            key: prop.key,
            label: prop.label,
            type: prop.type,
            value: widget.props?.[prop.key] ?? prop.default,
            desc: prop.desc,
            options: prop.options,
            fields: prop.fields,
            visibleOn: prop.visibleOn,
          })
        }
      }
    }
    if (basicItems.length) {
      sections.push({ key: 'basic', label: t('editor.property.basic'), items: basicItems })
    }

    // 2. 位置属性（Flex 流式布局无绝对坐标）
    if (boardStore.layoutMode !== 'flex') {
      sections.push({
        key: 'position',
        label: t('editor.property.position'),
        items: [
          { key: 'position.x', label: t('editor.property.posX'), type: 'number', value: widget.position?.x ?? 0, desc: t('editor.property.posXDesc'), unit: widget.position?.xUnit ?? 'px', unitKey: 'position.xUnit' },
          { key: 'position.y', label: t('editor.property.posY'), type: 'number', value: widget.position?.y ?? 0, desc: t('editor.property.posYDesc'), unit: widget.position?.yUnit ?? 'px', unitKey: 'position.yUnit' },
          { key: 'position.w', label: t('editor.property.width'), type: 'number', value: widget.position?.w ?? 240, desc: t('editor.property.widthDesc'), unit: widget.position?.wUnit ?? 'px', unitKey: 'position.wUnit' },
          { key: 'position.h', label: t('editor.property.height'), type: 'number', value: widget.position?.h ?? 40, desc: t('editor.property.heightDesc'), unit: widget.position?.hUnit ?? 'px', unitKey: 'position.hUnit' },
          { key: 'position.zIndex', label: t('editor.property.zIndex'), type: 'number', value: widget.position?.zIndex ?? 0, desc: t('editor.property.zIndexDesc') },
        ],
      })
    }

    // 2b. Flex 布局属性（仅流式模式）
    // Flex 模式为纵向流式堆叠，部件宽度通过 style.width 控制（如 100%/50%/240px）。
    // row-container 子节点额外暴露 span（1-24 栅格），由父容器决定单元格宽度。
    if (boardStore.layoutMode === 'flex') {
      const items: PropertyItem[] = [
        { key: 'style.width', label: t('editor.property.width'), type: 'text', value: widget.style?.width, desc: t('editor.property.flexWidthDesc') },
        { key: 'style.height', label: t('editor.property.height'), type: 'text', value: widget.style?.height, desc: t('editor.property.flexHeightDesc') },
        { key: 'style.marginTop', label: t('editor.property.marginTop'), type: 'text', value: widget.style?.marginTop, desc: t('editor.property.marginTopDesc') },
        { key: 'style.marginBottom', label: t('editor.property.marginBottom'), type: 'text', value: widget.style?.marginBottom, desc: t('editor.property.marginBottomDesc') },
      ]
      // 父容器为 row-container 时，暴露栅格 span（1-24）
      const parent = widget.id ? widgetStore.findParent(widget.id) : null
      if (parent?.type === 'row-container') {
        const currentSpan = typeof widget.span === 'number' ? widget.span : 24
        items.push({ key: 'span', label: t('editor.property.span'), type: 'number', value: currentSpan, desc: t('editor.property.spanDesc') })
      }
      sections.push({ key: 'flex-layout', label: t('editor.property.flexLayout'), items })
    }

    // 3. 样式属性
    const styleProps = [...publicStylePanel, ...(panel.style ?? [])]
    const uniqueStyleProps = [...new Set(styleProps)]
    const styleItems: PropertyItem[] = []
    for (const prop of uniqueStyleProps) {
      const styleLabel = getStyleLabel(prop)
      styleItems.push({
        key: `style.${prop}`,
        label: styleLabel,
        type: getStyleInputType(prop),
        value: widget.style?.[prop],
        desc: `组件${styleLabel}`,
        options: getStyleOptions(prop),
      })
    }
    if (styleItems.length) {
      sections.push({ key: 'style', label: t('editor.property.style'), items: styleItems })
    }

    // 4. 组件属性
    const propItems: PropertyItem[] = []
    if (panel.props) {
      for (const prop of panel.props) {
        if (typeof prop === 'string') {
          propItems.push({
            key: `props.${prop}`,
            label: prop,
            type: getPropInputType(prop),
            value: widget.props?.[prop],
          })
        } else {
          propItems.push({
            key: `props.${prop.key}`,
            label: prop.label,
            type: prop.type,
            value: getNestedValue(widget.props, prop.key) ?? prop.default,
            desc: prop.desc,
            placeholder: (prop as any).placeholder,
            options: prop.options,
            fields: prop.fields,
            remoteUrl: (prop as any).remoteUrl,
            labelField: (prop as any).labelField,
            valueField: (prop as any).valueField,
            visibleOn: prop.visibleOn,
          })
        }
      }
    }
    if (propItems.length) {
      sections.push({ key: 'props', label: t('editor.property.props'), items: propItems })
    }

    return sections
  })

  return { propertySections }
}
