import type { InjectionKey } from 'vue'
import type { AdvancedTableColumn, ActionButton } from './config'
import type { EventExecutionContext } from '../../engine/eventEngine'

export interface TableClickIntercept {
  onToolbarClick?: (btn: ActionButton, ctx: EventExecutionContext) => boolean | void
  onRowButtonClick?: (
    btn: ActionButton,
    row: Record<string, unknown>,
    rowIndex: number,
    ctx: EventExecutionContext,
  ) => boolean | void
  onLinkClick?: (
    col: AdvancedTableColumn,
    row: Record<string, unknown>,
    rowIndex: number,
    ctx: EventExecutionContext,
  ) => boolean | void
}

export const TABLE_CLICK_INTERCEPT_KEY: InjectionKey<TableClickIntercept> = Symbol('tableClickIntercept')
