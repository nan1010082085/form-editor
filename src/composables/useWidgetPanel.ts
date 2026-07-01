import { computed } from 'vue'
import { getWidgetsByGroup, type WidgetRegistryItem } from '../widgets/registry'

export interface WidgetPanelGroup {
  label: string
  key: WidgetRegistryItem['group']
  items: WidgetRegistryItem[]
}

/** 组件面板分组（顺序即展示顺序） */
export function useWidgetPanel() {
  const groups = computed<WidgetPanelGroup[]>(() => [
    { label: '布局部件', key: 'layout' as const, items: getWidgetsByGroup('layout') },
    { label: '容器部件', key: 'container' as const, items: getWidgetsByGroup('container') },
    { label: '表单部件', key: 'form' as const, items: getWidgetsByGroup('form') },
    { label: '表格部件', key: 'table' as const, items: getWidgetsByGroup('table') },
    { label: '图表部件', key: 'chart' as const, items: getWidgetsByGroup('chart') },
    { label: '展示部件', key: 'static' as const, items: getWidgetsByGroup('static') },
    { label: '操作部件', key: 'action' as const, items: getWidgetsByGroup('action') },
    { label: '业务部件', key: 'business' as const, items: getWidgetsByGroup('business') },
  ].filter(g => g.items.length > 0))

  return { groups }
}
