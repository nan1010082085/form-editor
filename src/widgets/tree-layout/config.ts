import type { WidgetConfig } from '../base/types'

export const treeLayoutConfig: WidgetConfig = {
  name: 'FgTreeLayout',
  displayName: '侧栏面板',
  description: '带标题栏与搜索框的侧栏容器，用于承载可拖入的子部件（非树形数据组件）',
  author: 'yangdongnan',
  defaultPosition: { w: 100, wUnit: '%', h: 200 },
  defaultStyle: {},
  configPanels: ['events', 'variables'],
  defaultProps: {
    title: '侧栏面板',
    showHeader: true,
    showSearch: true,
    searchPlaceholder: '搜索',
  },
  propertyPanel: {
    basic: ['label'],
    style: ['margin', 'padding', 'backgroundColor', 'border', 'borderRadius'],
    props: [
      { key: 'title', label: '标题', type: 'input', default: '侧栏面板' },
      { key: 'showHeader', label: '显示标题栏', type: 'switch', default: true },
      { key: 'showSearch', label: '显示搜索框', type: 'switch', default: true },
      { key: 'searchPlaceholder', label: '搜索占位', type: 'input', default: '搜索' },
    ],
  },
  contexts: ['free'],
}
