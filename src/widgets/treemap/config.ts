import type { WidgetConfig } from '../base/types'
import { treemapMock } from './mock'

export const treemapConfig: WidgetConfig = {
  name: 'FgTreemap',
  displayName: '矩形树图',
  description: '矩形树图，适合层级占比展示',
  author: 'yangdongnan',
  defaultStyle: { width: '100%', height: '400px' },
  defaultProps: {
    staticData: treemapMock,
    title: '',
    showLabel: true,
    colorScheme: 'default',
    rawOption: null as Record<string, unknown> | null,
  },
  exposedValues: [
    { key: 'loading', type: 'boolean', description: '加载状态' },
    { key: 'chartData', type: 'array', description: '图表数据' },
  ],
  configPanels: ['api', 'variables', 'events', 'chart-linkages'],
  eventTargets: [
    { id: 'chart-click', label: '图表点击', description: '点击图表数据项时触发' },
  ],
  receivableEvents: [
    { name: 'refresh', description: '重新加载数据' },
    { name: 'set-data', description: '设置图表数据' },
  ],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding', 'backgroundColor', 'borderRadius'],
    props: [
      { key: 'title', label: '图表标题', type: 'text' },
      { key: 'showLabel', label: '显示标签', type: 'switch', default: true },
      { key: 'colorScheme', label: '颜色主题', type: 'select', options: [
        { label: '默认', value: 'default' },
        { label: '暖色', value: 'warm' },
        { label: '冷色', value: 'cool' },
      ] },
      { key: 'rawOption', label: '高级配置 (JSON)', type: 'json' },
    ],
  },
}

export function createTreemapWidget(id: string) {
  return {
    id,
    type: 'treemap' as const,
    label: '矩形树图',
    props: { ...treemapConfig.defaultProps },
    style: { ...treemapConfig.defaultStyle },
    position: { x: 0, y: 0, w: 600, h: 400, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 },
  }
}
