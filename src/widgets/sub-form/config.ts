import type { WidgetConfig } from '../base/types'

export const subFormConfig: WidgetConfig = {
  name: 'FgSubForm',
  displayName: '子表单',
  description: '子表单/明细表单，支持动态增删行，每行包含一组子字段',
  author: 'yangdongnan',
  defaultStyle: { width: '100%' },
  defaultProps: {
    fields: [
      { key: 'name', label: '名称', type: 'text', placeholder: '请输入名称' },
      { key: 'quantity', label: '数量', type: 'number', placeholder: '0' },
    ] as Array<{ key: string; label: string; type: string; placeholder?: string }>,
    minRows: 0,
    maxRows: 10,
    addButtonText: '添加一行',
  },
  exposedValues: [
    { key: 'rows', type: 'array', description: '子表单数据（不含 _id）' },
  ],
  eventTargets: [
    { id: 'row-add', label: '添加行', description: '添加新行时触发' },
    { id: 'row-remove', label: '删除行', description: '删除行时触发' },
  ],
  receivableEvents: [
    { name: 'reset-rows', description: '重置子表单数据' },
  ],
  configPanels: ['events', 'variables'],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding'],
    props: [
      {
        key: 'fields', label: '字段定义', type: 'array-editor', fields: [
          { key: 'key', label: '字段名', type: 'text' },
          { key: 'label', label: '标签', type: 'text' },
          { key: 'type', label: '类型', type: 'select', options: [
            { label: '文本', value: 'text' },
            { label: '数字', value: 'number' },
            { label: '选择', value: 'select' },
          ] },
          { key: 'placeholder', label: '占位符', type: 'text' },
        ],
      },
      { key: 'minRows', label: '最小行数', type: 'number', default: 0 },
      { key: 'maxRows', label: '最大行数', type: 'number', default: 10 },
      { key: 'addButtonText', label: '添加按钮文字', type: 'text' },
    ],
  },
}

export function createSubFormWidget(id: string) {
  return {
    id,
    type: 'sub-form' as const,
    label: '子表单',
    props: { ...subFormConfig.defaultProps },
    style: { ...subFormConfig.defaultStyle },
    position: { x: 0, y: 0, w: 800, h: 300, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 },
  }
}
