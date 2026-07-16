import type { WidgetConfig } from '../base/types'

export const marqueeTextConfig: WidgetConfig = {
  name: 'FgMarqueeText',
  displayName: '跑马灯',
  description: '水平滚动文本公告，支持数据源驱动和自定义速度',
  author: 'yangdongnan',
  defaultStyle: { width: '100%' },
  defaultProps: {
    text: '这是一条滚动公告，支持自定义内容和滚动速度',
    speed: 50,
    direction: 'left',
    pauseOnHover: true,
    loop: true,
  },
  exposedValues: [
    { key: 'text', type: 'string', description: '当前文本' },
  ],
  configPanels: ['api', 'variables'],
  receivableEvents: [
    { name: 'set-text', description: '设置滚动文本', params: { text: '文本内容' } },
    { name: 'pause', description: '暂停滚动' },
    { name: 'resume', description: '恢复滚动' },
  ],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding', 'backgroundColor'],
    props: [
      { key: 'text', label: '滚动文本', type: 'text' },
      { key: 'speed', label: '滚动速度', type: 'number', default: 50, desc: '越大越快' },
      { key: 'direction', label: '滚动方向', type: 'select', default: 'left', options: [
        { label: '向左', value: 'left' },
        { label: '向右', value: 'right' },
      ] },
      { key: 'pauseOnHover', label: '悬停暂停', type: 'switch', default: true },
      { key: 'loop', label: '循环播放', type: 'switch', default: true },
    ],
  },
}

export function createMarqueeTextWidget(id: string) {
  return {
    id,
    type: 'marquee-text' as const,
    label: '跑马灯',
    props: { ...marqueeTextConfig.defaultProps },
    style: { ...marqueeTextConfig.defaultStyle },
    position: { x: 0, y: 0, w: 600, h: 40, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 },
  }
}
