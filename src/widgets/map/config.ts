import type { WidgetConfig } from '../base/types'
import { mapChartMock } from './mock'

export const mapConfig: WidgetConfig = {
  name: 'FgMap',
  displayName: '地图',
  description: '地图组件，支持中国/世界地图，区域着色与散点标注，点击下钻',
  author: 'yangdongnan',
  defaultStyle: { width: '100%', height: '500px' },
  defaultProps: {
    staticData: mapChartMock.staticData,
    mapType: 'china',
    nameField: 'name',
    valueField: 'value',
    title: '',
    showLabel: true,
    showScatter: false,
    roam: true,
    visualMapMin: 0,
    visualMapMax: 1000,
    colorScheme: 'default',
    customColors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'] as string[],
    animation: true,
    rawOption: null as Record<string, unknown> | null,
  },
  exposedValues: [
    { key: 'loading', type: 'boolean', description: '加载状态' },
    { key: 'chartData', type: 'array', description: '图表数据' },
  ],
  configPanels: ['api', 'variables', 'events', 'chart-linkages'],
  eventTargets: [
    { id: 'chart-click', label: '地图点击', description: '点击地图区域时触发' },
  ],
  receivableEvents: [
    { name: 'refresh', description: '重新加载数据' },
    { name: 'set-data', description: '设置地图数据', params: { data: '数据数组' } },
  ],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding', 'backgroundColor', 'borderRadius'],
    props: [
      { key: 'staticData', label: '静态数据', type: 'array-editor', fields: [
        { key: 'name', label: '区域名称', type: 'text' },
        { key: 'value', label: '值', type: 'number' },
      ]},
      { key: 'mapType', label: '地图类型', type: 'select', default: 'china', options: [
        { label: '中国', value: 'china' },
        { label: '世界', value: 'world' },
      ]},
      { key: 'nameField', label: '名称字段', type: 'text', placeholder: '如: name' },
      { key: 'valueField', label: '值字段', type: 'text', placeholder: '如: value' },
      { key: 'title', label: '图表标题', type: 'text' },
      { key: 'showLabel', label: '显示标签', type: 'switch', default: true },
      { key: 'showScatter', label: '显示散点', type: 'switch', default: false },
      { key: 'roam', label: '允许缩放拖拽', type: 'switch', default: true },
      { key: 'visualMapMin', label: '视觉映射最小值', type: 'number', default: 0 },
      { key: 'visualMapMax', label: '视觉映射最大值', type: 'number', default: 1000 },
      { key: 'colorScheme', label: '颜色主题', type: 'select', options: [
        { label: '默认', value: 'default' },
        { label: '暗色', value: 'dark' },
        { label: '浅色', value: 'light' },
      ]},
      { key: 'customColors', label: '自定义颜色', type: 'color-array' },
      { key: 'animation', label: '动画', type: 'switch', default: true },
      { key: 'rawOption', label: '高级配置 (JSON)', type: 'json' },
      { key: 'refreshInterval', label: '自动刷新(秒)', type: 'number', default: 0, placeholder: '0=关闭' },
    ],
  },
}
