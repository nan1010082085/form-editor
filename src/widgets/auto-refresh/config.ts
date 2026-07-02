import type { WidgetConfig } from '../base/types'

export const autoRefreshConfig: WidgetConfig = {
  name: 'FgAutoRefresh',
  displayName: '自动刷新',
  description: '大屏定时刷新目标组件数据（E-09）',
  author: 'yangdongnan',
  defaultStyle: { width: 'auto' },
  defaultProps: {
    intervalSeconds: 30,
    targets: '',
    showStatus: true,
  },
  configPanels: ['events', 'variables'],
  exposedValues: [
    { key: 'lastRefreshAt', type: 'string', description: '上次刷新时间' },
    { key: 'tickCount', type: 'number', description: '已刷新次数' },
  ],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding'],
    props: [
      { key: 'intervalSeconds', label: '刷新间隔(秒)', type: 'number', default: 30 },
      { key: 'targets', label: '目标组件 ID', type: 'input', placeholder: '逗号分隔，如 kpi-1,chart-1', default: '' },
      { key: 'showStatus', label: '显示状态', type: 'switch', default: true },
    ],
  },
}
