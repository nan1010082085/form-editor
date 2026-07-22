/**
 * useAdvancedTableEvents - advanced-table 事件分发
 *
 * 从 FgAdvancedTable 抽出：sort/selection/filter/page/row-click/toolbar/row-button/
 * link-click 等事件处理，统一走 clickIntercept + triggerWidgetEvent。
 */
import type { ComputedRef, Ref } from 'vue'
import type { Widget } from '../base/types'
import type { EventExecutionContext } from '../../components/WidgetRenderer/types'
import type { AdvancedTableColumn, ActionButton } from './config'
import { triggerWidgetEvent, evaluateCondition } from '../../engine/eventEngine'
import type { TableClickIntercept } from './clickIntercept'

export interface AdvancedTableEventHandlers {
  onSortChange: (e: { prop: string; order: 'ascending' | 'descending' | null }) => void
  onSelectionChange: (rows: Record<string, unknown>[]) => void
  onFilterChange: (filters: Record<string, unknown>) => boolean
  onPageChange: (page: number) => void
  onRowClick: (row: Record<string, unknown>) => void
  handleToolbarClick: (btn: ActionButton) => void
  handleRowButtonClick: (btn: ActionButton, row: Record<string, unknown>, rowIndex: number) => void
  handleLinkClick: (col: AdvancedTableColumn, row: Record<string, unknown>, rowIndex: number) => void
  isToolbarVisible: (btn: ActionButton) => boolean
  isRowButtonVisible: (btn: ActionButton, row: Record<string, unknown>) => boolean
}

interface UseAdvancedTableEventsOptions {
  widgetData: Ref<Widget>
  eventCtx: EventExecutionContext | null
  clickIntercept: TableClickIntercept | null
  tableData: ComputedRef<Record<string, unknown>[]> | Ref<Record<string, unknown>[]>
  selectedRows: ComputedRef<Record<string, unknown>[]> | Ref<Record<string, unknown>[]>
  serverSideFilter: ComputedRef<boolean> | Ref<boolean>
  columns: ComputedRef<AdvancedTableColumn[]>
  handleSortChange: (sort: { prop: string; order: string }) => void
  handleSelectionChange: (rows: Record<string, unknown>[]) => void
  handlePageChange: (page: number) => void
  handleSearch: () => void
  setSearchParams: (params: Record<string, unknown>) => void
  buildServerFilterParams: (
    filters: Record<string, unknown>,
    columns: AdvancedTableColumn[],
  ) => Record<string, unknown>
}

export function useAdvancedTableEvents(opts: UseAdvancedTableEventsOptions): AdvancedTableEventHandlers {
  const {
    widgetData,
    eventCtx,
    clickIntercept,
    tableData,
    selectedRows,
    serverSideFilter,
    columns,
    handleSortChange,
    handleSelectionChange,
    handlePageChange,
    handleSearch,
    setSearchParams,
    buildServerFilterParams,
  } = opts

  function onSortChange({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) {
    handleSortChange({ prop, order: order ?? '' })
    if (eventCtx) triggerWidgetEvent(widgetData.value, 'click', eventCtx, 'sort-change')
  }

  function onSelectionChange(rows: Record<string, unknown>[]) {
    handleSelectionChange(rows)
    if (eventCtx) triggerWidgetEvent(widgetData.value, 'click', eventCtx, 'selection-change')
  }

  /** 返回是否已处理（服务端过滤场景由调用方据返回值决定是否阻止默认） */
  function onFilterChange(filters: Record<string, unknown>): boolean {
    if (!serverSideFilter.value) return false
    setSearchParams(buildServerFilterParams(filters, columns.value))
    handleSearch()
    return true
  }

  function onPageChange(page: number) {
    handlePageChange(page)
    if (eventCtx) triggerWidgetEvent(widgetData.value, 'click', eventCtx, 'page-change')
  }

  function onRowClick(row: Record<string, unknown>) {
    if (eventCtx) {
      const ctx = { ...eventCtx, row, rowIndex: tableData.value.indexOf(row) }
      triggerWidgetEvent(widgetData.value, 'click', ctx, 'row-click')
    }
  }

  function handleToolbarClick(btn: ActionButton) {
    if (!eventCtx) return
    const ctx = {
      ...eventCtx,
      selectedRows: selectedRows.value,
      selectedCount: selectedRows.value.length,
      tableData: tableData.value,
    }
    if (btn.confirm && !window.confirm(btn.confirm)) return
    if (clickIntercept?.onToolbarClick?.(btn, ctx)) return
    triggerWidgetEvent(widgetData.value, 'click', ctx, `toolbar-${btn.key}`)
  }

  function handleRowButtonClick(btn: ActionButton, row: Record<string, unknown>, rowIndex: number) {
    if (!eventCtx) return
    const ctx = {
      ...eventCtx,
      row,
      rowIndex,
      selectedRows: selectedRows.value,
      selectedCount: selectedRows.value.length,
      tableData: tableData.value,
    }
    if (btn.confirm && !window.confirm(btn.confirm)) return
    if (clickIntercept?.onRowButtonClick?.(btn, row, rowIndex, ctx)) return
    triggerWidgetEvent(widgetData.value, 'click', ctx, `row-${btn.key}`)
  }

  function handleLinkClick(col: AdvancedTableColumn, row: Record<string, unknown>, rowIndex: number) {
    if (!eventCtx) return
    const ctx = {
      ...eventCtx,
      row,
      rowIndex,
      selectedRows: selectedRows.value,
      tableData: tableData.value,
    }
    if (clickIntercept?.onLinkClick?.(col, row, rowIndex, ctx)) return
    triggerWidgetEvent(widgetData.value, 'click', ctx, `link-${col.prop}`)
  }

  function isToolbarVisible(btn: ActionButton): boolean {
    if (!btn.visibleCondition) return true
    const context = {
      selectedRows: selectedRows.value,
      selectedCount: selectedRows.value.length,
      tableData: tableData.value,
    }
    return evaluateCondition(btn.visibleCondition, context) === true
  }

  function isRowButtonVisible(btn: ActionButton, row: Record<string, unknown>): boolean {
    if (!btn.visibleCondition) return true
    const context = { row, ...row }
    return evaluateCondition(btn.visibleCondition, context) === true
  }

  return {
    onSortChange,
    onSelectionChange,
    onFilterChange,
    onPageChange,
    onRowClick,
    handleToolbarClick,
    handleRowButtonClick,
    handleLinkClick,
    isToolbarVisible,
    isRowButtonVisible,
  }
}
