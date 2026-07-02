import type { WidgetMockBundle } from '../base/widgetMock'

export const treeTableMockRows = [
  {
    id: '1',
    name: '总部',
    status: 'active',
    sort: 0,
    children: [
      { id: '1-1', name: '研发部', status: 'active', sort: 1 },
      { id: '1-2', name: '市场部', status: 'active', sort: 2 },
    ],
  },
]

export const treeTableMock: WidgetMockBundle = {
  kind: 'table',
  rows: treeTableMockRows,
}
