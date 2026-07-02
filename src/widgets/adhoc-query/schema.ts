import { publicSchema } from '../base/publicSchema'
import { adhocQueryConfig } from './config'
import type { Widget } from '../base/types'

export function createAdhocQueryWidget(id: string): Widget {
  return {
    ...publicSchema(id, 'adhoc-query'),
    name: adhocQueryConfig.name,
    label: adhocQueryConfig.displayName,
    position: { x: 0, y: 0, w: 900, h: 120, zIndex: 1 },
    style: { ...adhocQueryConfig.defaultStyle },
    props: { ...adhocQueryConfig.defaultProps },
  }
}
