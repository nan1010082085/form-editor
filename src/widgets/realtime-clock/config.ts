import type { WidgetConfig } from '../base/types'

export const realtimeClockConfig: WidgetConfig = {
  name: 'FgRealtimeClock',
  displayName: '实时时钟',
  description: '大屏实时时钟，显示当前日期和时间，支持 12/24 小时制',
  author: 'yangdongnan',
  defaultStyle: { width: 'auto' },
  defaultProps: {
    showDate: true,
    showTime: true,
    showWeekday: false,
    format: '24h',
    dateFormat: 'YYYY-MM-DD',
  },
  exposedValues: [
    { key: 'now', type: 'date', description: '当前时间' },
  ],
  configPanels: ['variables'],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding'],
    props: [
      { key: 'showDate', label: '显示日期', type: 'switch', default: true },
      { key: 'showTime', label: '显示时间', type: 'switch', default: true },
      { key: 'showWeekday', label: '显示星期', type: 'switch', default: false },
      { key: 'format', label: '时间格式', type: 'select', default: '24h', options: [
        { label: '24 小时制', value: '24h' },
        { label: '12 小时制', value: '12h' },
      ] },
      { key: 'dateFormat', label: '日期格式', type: 'select', default: 'YYYY-MM-DD', options: [
        { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
        { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
      ] },
    ],
  },
}

export function createRealtimeClockWidget(id: string) {
  return {
    id,
    type: 'realtime-clock' as const,
    label: '实时时钟',
    props: { ...realtimeClockConfig.defaultProps },
    style: { ...realtimeClockConfig.defaultStyle },
    position: { x: 0, y: 0, w: 300, h: 80, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 },
  }
}
