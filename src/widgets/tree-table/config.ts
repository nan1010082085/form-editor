import type { WidgetConfig } from '../base/types'

export interface TreeTableColumn {
  prop: string
  label: string
  minWidth?: number
  width?: number
  align?: 'left' | 'center' | 'right'
}

export const treeTableConfig: WidgetConfig = {
  name: 'FgTreeTable',
  displayName: '树形表格',
  description: '层级数据表格（E-07），适用于组织架构、菜单树',
  author: 'yangdongnan',
  defaultStyle: { width: '100%', height: '600px' },
  defaultProps: {
    columns: [
      { prop: 'name', label: '名称', minWidth: 200 },
      { prop: 'status', label: '状态', minWidth: 100 },
      { prop: 'sort', label: '排序', minWidth: 80 },
    ] as TreeTableColumn[],
    rowKey: 'id',
    childrenKey: 'children',
    defaultExpandAll: true,
    stripe: true,
    border: true,
    height: 560,
  },
  exposedValues: [
    { key: 'loading', type: 'boolean', description: '加载状态' },
    { key: 'treeData', type: 'array', description: '树形数据' },
  ],
  configPanels: ['api', 'variables'],
  receivableEvents: [{ name: 'refresh', description: '重新加载数据' }],
  propertyPanel: {
    basic: ['label'],
    style: ['width', 'height'],
    props: [
      { key: 'columns', label: '列配置', type: 'columns' },
      { key: 'rowKey', label: '行主键', type: 'input' },
      { key: 'childrenKey', label: '子节点字段', type: 'input' },
      { key: 'defaultExpandAll', label: '默认展开', type: 'switch' },
      { key: 'height', label: '高度', type: 'number' },
      { key: 'stripe', label: '斑马纹', type: 'switch' },
      { key: 'border', label: '边框', type: 'switch' },
    ],
  },
}
