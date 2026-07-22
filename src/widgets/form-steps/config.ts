import type { WidgetConfig } from '../base/types'

export const formStepsConfig: WidgetConfig = {
  name: 'FgFormSteps',
  displayName: '分步表单',
  description: '分步表单容器，内置步骤条 + 上一步/下一步按钮，每步可包含独立的 widget',
  author: 'yangdongnan',
  defaultStyle: { width: '100%', minHeight: '300px' },
  defaultProps: {
    steps: [
      { title: '基本信息', description: '填写基础信息', children: [] },
      { title: '详细信息', description: '填写详细资料', children: [] },
      { title: '确认提交', description: '检查并提交', children: [] },
    ] as Array<{ title: string; description?: string; children: unknown[] }>,
  },
  exposedValues: [
    { key: 'currentStep', type: 'number', description: '当前步骤索引' },
    { key: 'totalSteps', type: 'number', description: '总步骤数' },
  ],
  eventTargets: [
    { id: 'step-change', label: '步骤切换', description: '切换步骤时触发' },
    { id: 'complete', label: '完成', description: '点击完成按钮时触发' },
  ],
  receivableEvents: [
    { name: 'next-step', description: '跳转到下一步' },
    { name: 'prev-step', description: '跳转到上一步' },
    { name: 'go-to-step', description: '跳转到指定步骤', params: { step: '步骤索引' } },
  ],
  configPanels: ['events', 'variables'],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding', 'minHeight'],
    props: [
      {
        key: 'steps', label: '步骤配置', type: 'array-editor', fields: [
          { key: 'title', label: '标题', type: 'text' },
          { key: 'description', label: '描述', type: 'text' },
        ],
      },
    ],
  },
  contexts: ['free'],
}

export function createFormStepsWidget(id: string) {
  return {
    id,
    type: 'form-steps' as const,
    label: '分步表单',
    props: { ...formStepsConfig.defaultProps },
    style: { ...formStepsConfig.defaultStyle },
    position: { x: 0, y: 0, w: 800, h: 400, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 },
  }
}
