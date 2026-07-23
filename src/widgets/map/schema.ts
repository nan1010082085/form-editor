import { publicSchema } from '../base/publicSchema'
import { mapConfig } from './config'
import type { Widget, WidgetConfig } from '../base/types'

export function createMapWidget(id: string, config: WidgetConfig = mapConfig): Widget {
  return {
    ...publicSchema(id, config.type || 'map'),
    name: config.name,
    label: config.displayName,
    position: { x: 0, y: 0, w: 600, h: 500, zIndex: 1 },
    style: { ...config.defaultStyle },
    props: { ...config.defaultProps },
  }
}
