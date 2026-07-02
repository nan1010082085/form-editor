import { publicSchema } from '../base/publicSchema'
import { crudListPageConfig } from './config'
import type { Widget } from '../base/types'

export function createCrudListPageWidget(id: string): Widget {
  return {
    ...publicSchema(id, 'crud-list-page'),
    name: crudListPageConfig.name,
    label: crudListPageConfig.displayName,
    position: { x: 0, y: 0, w: 1392, h: 780, zIndex: 1 },
    style: { ...crudListPageConfig.defaultStyle },
    props: { ...crudListPageConfig.defaultProps },
  }
}
