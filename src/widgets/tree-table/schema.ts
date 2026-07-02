import { publicSchema } from '../base/publicSchema'
import { treeTableConfig } from './config'
import type { Widget } from '../base/types'

export function createTreeTableWidget(id: string): Widget {
  return {
    ...publicSchema(id, 'tree-table'),
    name: treeTableConfig.name,
    label: treeTableConfig.displayName,
    position: { x: 0, y: 0, w: 700, h: 400, zIndex: 1 },
    style: { ...treeTableConfig.defaultStyle },
    props: { ...treeTableConfig.defaultProps },
  }
}
