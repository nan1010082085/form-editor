import type { WidgetConfig } from '../base/types'

export const comparisonCardConfig: WidgetConfig = {
  name: 'FgComparisonCard',
  displayName: '对比卡片',
  description: '展示两个指标对比（同比/环比），带趋势箭头和百分比',
  author: 'yangdongnan',
  defaultStyle: { width: '240px' },
  defaultProps: {
    title: '月活用户',
    currentValue: 128500,
    previousValue: 115200,
    unit: '',
    prefix: '',
    comparisonLabel: '同比',
    precision: 1,
  },
  exposedValues: [
    { key: 'currentValue', type: 'number', description: '当前值' },
    { key: 'changePercent', type: 'number', description: '变化百分比' },
  ],
  configPanels: ['api', 'variables'],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding', 'backgroundColor', 'borderRadius'],
    props: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'currentValue', label: '当前值', type: 'number' },
      { key: 'previousValue', label: '对比值', type: 'number' },
      { key: 'prefix', label: '前缀', type: 'text', placeholder: '如 ¥' },
      { key: 'unit', label: '单位', type: 'text', placeholder: '如 人' },
      { key: 'comparisonLabel', label: '对比标签', type: 'text', default: '同比' },
      { key: 'precision', label: '小数精度', type: 'number', default: 1 },
    ],
  },
}

export function createComparisonCardWidget(id: string) {
  return {
    id,
    type: 'comparison-card' as const,
    label: '对比卡片',
    props: { ...comparisonCardConfig.defaultProps },
    style: { ...comparisonCardConfig.defaultStyle },
    position: { x: 0, y: 0, w: 240, h: 100, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 },
  }
}
