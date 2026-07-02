import type { WidgetConfig } from '../base/types'

export interface KanbanColumn {
  key: string
  title: string
  status: string
}

export const kanbanConfig: WidgetConfig = {
  name: 'FgKanban',
  displayName: '看板',
  description: 'Kanban 看板（E-06），按状态分列展示卡片，支持拖拽变更状态',
  author: 'yangdongnan',
  defaultStyle: { width: '100%', minHeight: '420px' },
  defaultProps: {
    columns: [
      { key: 'open', title: '待办', status: 'open' },
      { key: 'progress', title: '进行中', status: 'in_progress' },
      { key: 'done', title: '已关闭', status: 'closed' },
    ] as KanbanColumn[],
    cardTitleField: 'title',
    cardSubtitleField: 'severity',
    statusField: 'status',
    updateMethod: 'put',
  },
  exposedValues: [
    { key: 'cards', type: 'array', description: '卡片数据' },
    { key: 'loading', type: 'boolean', description: '加载状态' },
  ],
  configPanels: ['api', 'variables'],
  receivableEvents: [{ name: 'refresh', description: '重新加载看板数据' }],
  propertyPanel: {
    basic: ['label'],
    style: ['width', 'height'],
    props: [
      { key: 'columns', label: '列配置', type: 'json' },
      { key: 'cardTitleField', label: '标题字段', type: 'input' },
      { key: 'cardSubtitleField', label: '副标题字段', type: 'input' },
      { key: 'statusField', label: '状态字段', type: 'input' },
    ],
  },
}
