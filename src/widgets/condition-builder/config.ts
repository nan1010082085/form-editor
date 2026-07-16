import type { WidgetConfig } from '../base/types'

export const conditionBuilderConfig: WidgetConfig = {
  name: 'FgConditionBuilder',
  displayName: '条件构建器',
  description: '可视化条件表达式编辑器，支持多条件组合（AND/OR），替代手动写表达式',
  author: 'yangdongnan',
  defaultStyle: { width: '100%' },
  defaultProps: {
    fields: [
      { key: 'name', label: '名称' },
      { key: 'age', label: '年龄' },
      { key: 'status', label: '状态' },
      { key: 'createdAt', label: '创建时间' },
    ] as Array<{ key: string; label: string }>,
  },
  exposedValues: [
    { key: 'conditions', type: 'array', description: '条件数组' },
    { key: 'logic', type: 'string', description: '逻辑关系 (and/or)' },
  ],
  configPanels: ['variables'],
  receivableEvents: [
    { name: 'reset-conditions', description: '重置所有条件' },
  ],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding'],
    props: [
      {
        key: 'fields', label: '可选字段', type: 'array-editor', fields: [
          { key: 'key', label: '字段名', type: 'text' },
          { key: 'label', label: '标签', type: 'text' },
        ],
      },
    ],
  },
}

export function createConditionBuilderWidget(id: string) {
  return {
    id,
    type: 'condition-builder' as const,
    label: '条件构建器',
    props: { ...conditionBuilderConfig.defaultProps },
    style: { ...conditionBuilderConfig.defaultStyle },
    position: { x: 0, y: 0, w: 600, h: 200, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 },
  }
}
