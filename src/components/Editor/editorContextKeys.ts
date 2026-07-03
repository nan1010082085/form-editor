import type { InjectionKey } from 'vue'
import type { Widget } from '@/widgets/base/types'

export type WidgetContextMenuHandler = (event: MouseEvent, widget: Widget) => void

export const EDITOR_CONTEXTMENU_KEY: InjectionKey<WidgetContextMenuHandler> = Symbol('editorContextMenu')
