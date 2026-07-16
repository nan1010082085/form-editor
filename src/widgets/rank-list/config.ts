import type { WidgetConfig } from '../base/types'

export const rankListConfig: WidgetConfig = {
  name: 'FgRankList',
  displayName: '排行榜',
  description: '数据源驱动的排名列表，支持动态排名、趋势箭头、Top N 高亮',
  author: 'yangdongnan',
  defaultStyle: { width: '100%' },
  defaultProps: {
    title: '排行榜',
    items: [
      { name: '张三', value: 9800, trend: 2 },
      { name: '李四', value: 8500, trend: -1 },
      { name: '王五', value: 7200, trend: 0 },
      { name: '赵六', value: 6100, trend: 3 },
      { name: '钱七', value: 5400, trend: -2 },
    ] as Array<Record<string, unknown>>,
    nameKey: 'name',
    valueKey: 'value',
    trendKey: 'trend',
    maxItems: 10,
    showRank: true,
    showTrend: true,
    highlightTop: 3,
  },
  exposedValues: [
    { key: 'sortedItems', type: 'array', description: '排序后的列表数据' },
  ],
  configPanels: ['api', 'variables'],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding', 'backgroundColor'],
    props: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'nameKey', label: '名称字段', type: 'text', default: 'name' },
      { key: 'valueKey', label: '数值字段', type: 'text', default: 'value' },
      { key: 'trendKey', label: '趋势字段', type: 'text', default: 'trend' },
      { key: 'maxItems', label: '最大条数', type: 'number', default: 10 },
      { key: 'showRank', label: '显示排名', type: 'switch', default: true },
      { key: 'showTrend', label: '显示趋势', type: 'switch', default: true },
      { key: 'highlightTop', label: '高亮前 N 名', type: 'number', default: 3 },
      { key: 'items', label: '静态数据', type: 'array-editor', fields: [
        { key: 'name', label: '名称', type: 'text' },
        { key: 'value', label: '数值', type: 'number' },
        { key: 'trend', label: '趋势', type: 'number' },
      ] },
    ],
  },
}

export function createRankListWidget(id: string) {
  return {
    id,
    type: 'rank-list' as const,
    label: '排行榜',
    props: { ...rankListConfig.defaultProps },
    style: { ...rankListConfig.defaultStyle },
    position: { x: 0, y: 0, w: 360, h: 300, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 },
  }
}
