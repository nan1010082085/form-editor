import type { WidgetConfig } from '../base/types'

export const progressBarConfig: WidgetConfig = {
  name: 'FgProgressBar',
  displayName: '进度条',
  description: '进度条/环形进度，支持阈值颜色和百分比/数值显示',
  author: 'yangdongnan',
  defaultStyle: { width: '100%' },
  defaultProps: {
    value: 65,
    max: 100,
    variant: 'line',
    strokeWidth: 6,
    showText: true,
    format: 'percent',
    color: '',
    thresholds: [
      { value: 30, color: '#e6a23c' },
      { value: 70, color: '#409eff' },
      { value: 100, color: '#67c23a' },
    ] as Array<{ value: number; color: string }>,
    size: 120,
  },
  exposedValues: [
    { key: 'percent', type: 'number', description: '百分比 (0-100)' },
    { key: 'value', type: 'number', description: '当前值' },
  ],
  configPanels: ['api', 'variables'],
  receivableEvents: [
    { name: 'set-value', description: '设置进度值', params: { value: '数值' } },
  ],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding'],
    props: [
      { key: 'value', label: '当前值', type: 'number', default: 0 },
      { key: 'max', label: '最大值', type: 'number', default: 100 },
      { key: 'variant', label: '形态', type: 'select', default: 'line', options: [
        { label: '线性', value: 'line' },
        { label: '环形', value: 'circle' },
      ] },
      { key: 'strokeWidth', label: '线条宽度', type: 'number', default: 6 },
      { key: 'showText', label: '显示文字', type: 'switch', default: true },
      { key: 'format', label: '显示格式', type: 'select', default: 'percent', options: [
        { label: '百分比', value: 'percent' },
        { label: '数值/最大值', value: 'value' },
      ] },
      { key: 'color', label: '自定义颜色', type: 'color' },
      {
        key: 'thresholds', label: '阈值颜色', type: 'array-editor', fields: [
          { key: 'value', label: '阈值', type: 'number' },
          { key: 'color', label: '颜色', type: 'color' },
        ],
      },
      { key: 'size', label: '环形尺寸', type: 'number', default: 120, visibleOn: "props.variant === 'circle'" },
    ],
  },
}

export function createProgressBarWidget(id: string) {
  return {
    id,
    type: 'progress-bar' as const,
    label: '进度条',
    props: { ...progressBarConfig.defaultProps },
    style: { ...progressBarConfig.defaultStyle },
    position: { x: 0, y: 0, w: 300, h: 40, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 },
  }
}
