import { publicSchema } from '../base/publicSchema'
import { transferConfig } from './config'
import type { Widget } from '../base/types'

export function createTransferWidget(id: string): Widget {
  return {
    ...publicSchema(id, 'transfer'),
    name: transferConfig.name,
    label: transferConfig.displayName,
    position: { x: 0, y: 0, w: 700, h: 300, zIndex: 1 },
    style: { ...transferConfig.defaultStyle },
    props: { ...transferConfig.defaultProps },
    options: [
      { label: '选项A', value: 'a' },
      { label: '选项B', value: 'b' },
      { label: '选项C', value: 'c' },
    ],
    defaultValue: [],
  }
}
