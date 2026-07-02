import { publicSchema } from '../base/publicSchema'
import { kanbanConfig } from './config'
import type { Widget } from '../base/types'

export function createKanbanWidget(id: string): Widget {
  return {
    ...publicSchema(id, 'kanban'),
    name: kanbanConfig.name,
    label: kanbanConfig.displayName,
    position: { x: 0, y: 0, w: 900, h: 420, zIndex: 1 },
    style: { ...kanbanConfig.defaultStyle },
    props: { ...kanbanConfig.defaultProps },
  }
}
