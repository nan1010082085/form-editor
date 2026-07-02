import { publicSchema } from '../base/publicSchema'
import { autoRefreshConfig } from './config'
import type { Widget } from '../base/types'

export function createAutoRefreshWidget(id: string): Widget {
  return {
    ...publicSchema(id, 'auto-refresh'),
    name: autoRefreshConfig.name,
    label: autoRefreshConfig.displayName,
    position: { x: 0, y: 0, w: 200, h: 32, zIndex: 99 },
    style: { ...autoRefreshConfig.defaultStyle },
    props: { ...autoRefreshConfig.defaultProps },
  }
}
