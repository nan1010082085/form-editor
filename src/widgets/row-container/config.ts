import type { WidgetConfig } from '../base/types'

export const rowContainerConfig: WidgetConfig = {
  name: 'FgRowContainer',
  displayName: '栅格行',
  description: '24 栅格行容器，子节点按 span（1-24）分配宽度，超出自动换行。Flex 画布专用。',
  author: 'yangdongnan',
  defaultStyle: { width: '100%' },
  defaultProps: {
    gutter: 12,
  },
  propertyPanel: {
    basic: [
      { key: 'gutter', label: '列间距', type: 'number', default: 12, desc: '单元格之间的间距（px）' },
    ],
    style: ['margin', 'padding', 'backgroundColor'],
    props: [],
  },
  configPanels: ['events', 'variables'],
  contexts: ['flex'],
}
