import { publicSchema } from '../base/publicSchema'
import { rowContainerConfig } from './config'
import type { Widget } from '../base/types'

export function createRowContainerWidget(id: string): Widget {
  return {
    ...publicSchema(id, 'row-container'),
    name: rowContainerConfig.name,
    label: rowContainerConfig.displayName,
    position: { x: 0, y: 0, w: 100, wUnit: '%', h: 60, zIndex: 1 },
    style: { ...rowContainerConfig.defaultStyle },
    props: { ...rowContainerConfig.defaultProps },
    children: [],
  }
}
