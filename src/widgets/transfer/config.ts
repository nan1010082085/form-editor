import type { WidgetConfig } from '../base/types'

export const transferConfig: WidgetConfig = {
  name: 'FgTransfer',
  displayName: '穿梭框',
  description: '双栏穿梭选择字段，数据源来自静态 options 或 API',
  author: 'yangdongnan',
  defaultStyle: { width: '700px', height: '300px' },
  defaultProps: {
    leftTitle: '待选',
    rightTitle: '已选',
    filterable: true,
  },
  exposedValues: [
    { key: 'value', type: 'array', description: '已选值' },
  ],
  configPanels: ['events', 'linkages', 'variables', 'api'] as const,
  eventTargets: [
    { id: 'change', label: '值变更', description: '穿梭选择变更时触发' },
  ],
  propertyPanel: {
    basic: ['field', 'label', 'options'],
    style: [],
    props: [
      { key: 'leftTitle', label: '左侧标题', type: 'text', default: '待选' },
      { key: 'rightTitle', label: '右侧标题', type: 'text', default: '已选' },
      { key: 'filterable', label: '可搜索', type: 'switch', default: true },
    ],
  },
}
