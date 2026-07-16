import type { WidgetConfig } from '../base/types'

export const tabContainerConfig: WidgetConfig = {
  name: 'FgTabContainer',
  displayName: 'Tab 容器',
  description: 'Tab 容器，内部切换多个子画布，每个 Tab 页可包含独立的 widget 集合',
  author: 'yangdongnan',
  defaultStyle: { width: '100%', minHeight: '200px' },
  defaultProps: {
    tabs: [
      { key: 'tab1', label: 'Tab 1', children: [] },
      { key: 'tab2', label: 'Tab 2', children: [] },
    ] as Array<{ key: string; label: string; children: unknown[] }>,
  },
  exposedValues: [
    { key: 'activeTab', type: 'string', description: '当前活跃 Tab 的 key' },
  ],
  eventTargets: [
    { id: 'tab-change', label: 'Tab 切换', description: '切换 Tab 页时触发' },
  ],
  receivableEvents: [
    { name: 'set-active-tab', description: '设置活跃 Tab', params: { key: 'Tab key' } },
  ],
  configPanels: ['events', 'variables'],
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding', 'minHeight'],
    props: [
      {
        key: 'tabs', label: 'Tab 页配置', type: 'array-editor', fields: [
          { key: 'key', label: 'Key', type: 'text' },
          { key: 'label', label: '标签', type: 'text' },
        ],
      },
    ],
  },
}

export function createTabContainerWidget(id: string) {
  return {
    id,
    type: 'tab-container' as const,
    label: 'Tab 容器',
    props: { ...tabContainerConfig.defaultProps },
    style: { ...tabContainerConfig.defaultStyle },
    position: { x: 0, y: 0, w: 800, h: 300, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 },
  }
}
