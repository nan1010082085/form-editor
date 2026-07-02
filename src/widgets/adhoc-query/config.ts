import type { WidgetConfig } from '../base/types'

export interface AdhocQueryField {
  field: string
  label: string
  type?: 'input' | 'select'
  options?: Array<{ label: string; value: string | number }>
}

export interface AdhocCondition {
  field: string
  operator: 'eq' | 'contains'
  value: string
}

export const adhocQueryConfig: WidgetConfig = {
  name: 'FgAdhocQuery',
  displayName: 'Adhoc 查询',
  description: 'E-20 可视化筛选条件构建器，联动高级表格 set-search-params',
  author: 'yangdongnan',
  defaultStyle: { width: '100%' },
  defaultProps: {
    targetTableId: '',
    fields: [
      { field: 'keyword', label: '关键词', type: 'input' },
      {
        field: 'status',
        label: '状态',
        type: 'select',
        options: [
          { label: '审批中', value: 'submitted' },
          { label: '已通过', value: 'approved' },
          { label: '已驳回', value: 'rejected' },
        ],
      },
    ] as AdhocQueryField[],
  },
  exposedValues: [
    { key: 'lastParams', type: 'object', description: '最近一次查询参数' },
  ],
  configPanels: ['variables'],
  receivableEvents: [{ name: 'reset', description: '清空条件并重置表格' }],
  propertyPanel: {
    basic: ['label'],
    style: ['width'],
    props: [
      { key: 'targetTableId', label: '目标表格 ID', type: 'input' },
      { key: 'fields', label: '可选字段', type: 'json' },
    ],
  },
}
