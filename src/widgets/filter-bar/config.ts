import type { WidgetConfig } from '../base/types'

export const filterBarConfig: WidgetConfig = {
  name: 'FgFilterBar',
  displayName: '筛选栏',
  description: '全局筛选栏，水平排列筛选控件，输出筛选参数供图表/表格消费',
  author: 'yangdongnan',
  defaultStyle: { width: '100%', marginBottom: '16px' },
  defaultProps: {
    filters: [
      { key: 'status', label: '状态', type: 'select', options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' },
      ] },
      { key: 'dateRange', label: '日期', type: 'date-range' },
    ] as Array<Record<string, unknown>>,
    showSearch: true,
    searchPlaceholder: '请输入关键词',
  },
  exposedValues: [
    { key: 'filterData', type: 'object', description: '当前筛选数据' },
  ],
  eventTargets: [
    { id: 'filter-change', label: '筛选变化', description: '筛选条件变化时触发' },
  ],
  receivableEvents: [
    { name: 'reset-filters', description: '重置所有筛选条件' },
  ],
  configPanels: ['events', 'variables'],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding', 'backgroundColor', 'borderRadius'],
    props: [
      {
        key: 'filters', label: '筛选项', type: 'array-editor', fields: [
          { key: 'key', label: '字段名', type: 'text' },
          { key: 'label', label: '标签', type: 'text' },
          { key: 'type', label: '类型', type: 'select', options: [
            { label: '文本', value: 'text' },
            { label: '下拉选择', value: 'select' },
            { label: '日期', value: 'date' },
            { label: '日期范围', value: 'date-range' },
          ] },
        ],
      },
      { key: 'showSearch', label: '显示搜索', type: 'switch', default: true },
      { key: 'searchPlaceholder', label: '搜索占位符', type: 'text' },
    ],
  },
}

export function createFilterBarWidget(id: string) {
  return {
    id,
    type: 'filter-bar' as const,
    label: '筛选栏',
    props: { ...filterBarConfig.defaultProps },
    style: { ...filterBarConfig.defaultStyle },
    position: { x: 0, y: 0, w: 1200, h: 56, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 },
  }
}
