<script setup lang="ts">
import { inject, computed, reactive, watch, onMounted } from 'vue'
import { TABLE_CLICK_INTERCEPT_KEY } from './clickIntercept'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import { widgetDataKey } from '../base/types'
import { EVENT_CONTEXT_KEY, FORM_GRID_CONTEXT_KEY } from '../../components/WidgetRenderer/types'
import { useListData } from '../../composables/useListData'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { triggerWidgetEvent } from '../../engine/eventEngine'
import { evaluateCondition } from '../../engine/eventEngine'
import type { ListApiConfig } from '../../components/WidgetRenderer/types'
import type { AdvancedTableColumn, ActionButton, AdvPaginationConfig, AdvSelectionConfig, SearchBarConfig, SearchField } from './config'
import { getRowCellValue } from './tableRowValue'
import { resolveColumnFilters } from './columnFilters'
import { buildServerFilterParams, shouldUseServerSideFilter } from './columnServerFilter'
import { resolveEffectiveColumn } from './columnOptions'
import {
  WIDGET_SURFACE_KEY,
  getTableRowsFromMock,
  shouldUseWidgetMock,
} from '../base/widgetMock'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const eventCtx = inject(EVENT_CONTEXT_KEY, null)
const clickIntercept = inject(TABLE_CLICK_INTERCEPT_KEY, null)
const gridContext = inject(FORM_GRID_CONTEXT_KEY, null)
const surface = inject(WIDGET_SURFACE_KEY, 'runtime')

// ---- Schema config ----

const columns = computed<AdvancedTableColumn[]>(() =>
  (widgetData.value.props?.columns as AdvancedTableColumn[]) ?? [],
)

const toolbar = computed<ActionButton[]>(() =>
  (widgetData.value.props?.toolbar as ActionButton[]) ?? [],
)

const stripe = computed(() => (widgetData.value.props?.stripe as boolean) ?? true)
const border = computed(() => (widgetData.value.props?.border as boolean) ?? true)
const tableHeight = computed(() => (widgetData.value.props?.height as number) ?? 350)
const globalSortable = computed(() => (widgetData.value.props?.sortable as boolean) ?? false)

const paginationConfig = computed<AdvPaginationConfig>(() =>
  (widgetData.value.props?.pagination as AdvPaginationConfig) ?? { enabled: true, pageSize: 20, pageSizes: [10, 20, 50, 100] },
)

const serverSideFilter = computed(() =>
  shouldUseServerSideFilter(
    widgetData.value.props as Record<string, unknown> | undefined,
    !!listApiConfig.url,
    columns.value,
  ),
)

const selectionConfig = computed<AdvSelectionConfig>(() =>
  (widgetData.value.props?.selection as AdvSelectionConfig) ?? { enabled: false },
)

const searchBarConfig = computed<SearchBarConfig>(() =>
  (widgetData.value.props?.searchBar as SearchBarConfig) ?? { enabled: false, fields: [] },
)

const searchFields = computed<SearchField[]>(() => searchBarConfig.value.fields ?? [])

const searchEnabled = computed(() =>
  searchBarConfig.value.enabled !== false && searchFields.value.length > 0,
)

const searchForm = reactive<Record<string, string>>({})

watch(searchFields, (fields) => {
  for (const field of fields) {
    if (!(field.field in searchForm)) searchForm[field.field] = ''
  }
}, { immediate: true })

function applySearch() {
  const params: Record<string, unknown> = {}
  for (const field of searchFields.value) {
    const val = searchForm[field.field]
    if (val !== undefined && val !== '') params[field.field] = val
  }
  setSearchParams(params)
  fetchData()
}

function resetSearch() {
  for (const field of searchFields.value) {
    searchForm[field.field] = ''
  }
  setSearchParams({})
  fetchData()
}

// ---- Build ListApiConfig ----

function buildListApiConfig(): ListApiConfig {
  const api = widgetData.value.api
  if (api?.url) {
    return {
      url: api.url,
      method: api.method ?? 'post',
      dataPath: api.dataPath,
      pageParam: (api as ListApiConfig).pageParam ?? 'page',
      sizeParam: (api as ListApiConfig).sizeParam ?? 'pageSize',
      immediate: false,
    }
  }
  return { url: '', immediate: false }
}

const listApiConfig = reactive<ListApiConfig>(buildListApiConfig())

watch(
  () => widgetData.value.api?.url,
  () => Object.assign(listApiConfig, buildListApiConfig()),
)

// ---- useListData ----

const {
  tableData,
  total,
  loading,
  currentPage,
  pageSize,
  selectedRows,
  setSearchParams,
  fetchData,
  handleSearch,
  handlePageChange,
  handleSizeChange,
  handleSortChange,
  handleSelectionChange,
  clearSelection,
} = useListData({
  listApi: listApiConfig,
  pageSize: paginationConfig.value.pageSize,
  autoLoad: false,
})

watch(
  () => paginationConfig.value.pageSize,
  (newSize) => { pageSize.value = newSize },
)

// ---- Expose ----

useExposeWidget(() => ({
  get loading() { return loading.value },
  get tableData() { return tableData.value },
  get selectedRows() { return selectedRows.value },
  get selectedCount() { return selectedRows.value.length },
  refresh: () => { fetchData() },
  'set-search-params': (params: Record<string, unknown> = {}) => {
    setSearchParams(params)
    handleSearch()
  },
}))

// ---- Sort ----

function onSortChange({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) {
  handleSortChange({ prop, order: order ?? '' })
  if (eventCtx) triggerWidgetEvent(widgetData.value, 'click', eventCtx, 'sort-change')
}

// ---- Selection ----

function onSelectionChange(rows: Record<string, unknown>[]) {
  handleSelectionChange(rows)
  if (eventCtx) triggerWidgetEvent(widgetData.value, 'click', eventCtx, 'selection-change')
}

// ---- Filter ----

function defaultFilterMethod(prop: string) {
  if (serverSideFilter.value) return () => true
  return (value: unknown, row: Record<string, unknown>) => getRowCellValue(row, prop) === value
}

function onFilterChange(filters: Record<string, unknown>) {
  if (!serverSideFilter.value) return
  setSearchParams(buildServerFilterParams(filters, columns.value))
  handleSearch()
}

function columnFilters(col: AdvancedTableColumn) {
  const effective = resolveEffectiveColumn(col, gridContext?.global?.dictMap)
  return resolveColumnFilters(effective, tableData.value)
}

function effectiveColumn(col: AdvancedTableColumn): AdvancedTableColumn {
  return resolveEffectiveColumn(col, gridContext?.global?.dictMap)
}

// ---- Page change ----

function onPageChange(page: number) {
  handlePageChange(page)
  if (eventCtx) triggerWidgetEvent(widgetData.value, 'click', eventCtx, 'page-change')
}

// ---- Row click ----

function onRowClick(row: Record<string, unknown>) {
  if (eventCtx) {
    const ctx = { ...eventCtx, row, rowIndex: tableData.value.indexOf(row) }
    triggerWidgetEvent(widgetData.value, 'click', ctx, 'row-click')
  }
}

// ---- Toolbar button click ----

function handleToolbarClick(btn: ActionButton) {
  if (!eventCtx) return
  const ctx = {
    ...eventCtx,
    selectedRows: selectedRows.value,
    selectedCount: selectedRows.value.length,
    tableData: tableData.value,
  }
  // Quick confirm shortcut
  if (btn.confirm && !window.confirm(btn.confirm)) return
  if (clickIntercept?.onToolbarClick?.(btn, ctx)) return
  triggerWidgetEvent(widgetData.value, 'click', ctx, `toolbar-${btn.key}`)
}

// ---- Row button click ----

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
  // Quick confirm shortcut
  if (btn.confirm && !window.confirm(btn.confirm)) return
  if (clickIntercept?.onRowButtonClick?.(btn, row, rowIndex, ctx)) return
  triggerWidgetEvent(widgetData.value, 'click', ctx, `row-${btn.key}`)
}

// ---- Link click ----

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

// ---- Resolve tag type from colorMap ----

function getTagType(colorMap?: Record<string, string>, value?: unknown): string {
  if (!colorMap) return ''
  return (colorMap[String(value)] ?? '') as string
}

// ---- Resolve option label ----

function getOptionLabel(options?: Array<{ label: string; value: unknown }>, value?: unknown): string {
  if (!options) return String(value ?? '')
  const found = options.find(o => o.value === value)
  return found?.label ?? String(value ?? '')
}

const FLOW_STATUS_COLOR: Record<string, string> = {
  running: 'warning',
  completed: 'success',
  terminated: 'danger',
  cancelled: 'info',
}

function getFlowStatusLabel(row: Record<string, unknown>): string {
  const label = row.flowStatusLabel ?? row.flowStatus
  if (label) return String(label)
  return row.status != null ? String(row.status) : '—'
}

function getFlowStatusTagType(row: Record<string, unknown>): string {
  const raw = String(row.flowStatus ?? '')
  return FLOW_STATUS_COLOR[raw] ?? ''
}

const EXPIRY_COLOR: Record<string, string> = {
  valid: 'success',
  expiring: 'warning',
  expired: 'danger',
}

function getExpiryLabel(row: Record<string, unknown>): string {
  const status = String(row.expiryStatus ?? row.status ?? '')
  if (status === 'expiring') return '即将到期'
  if (status === 'expired') return '已过期'
  if (status === 'valid') return '有效'
  const days = row.daysUntilDue
  if (typeof days === 'number' && days <= 30) return `${days} 天后到期`
  return status || '—'
}

function getExpiryTagType(row: Record<string, unknown>): string {
  const status = String(row.expiryStatus ?? row.status ?? '')
  return EXPIRY_COLOR[status] ?? ''
}

// ---- Toolbar button visibility ----

function isToolbarVisible(btn: ActionButton): boolean {
  if (!btn.visibleCondition) return true
  const context = {
    selectedRows: selectedRows.value,
    selectedCount: selectedRows.value.length,
    tableData: tableData.value,
  }
  return evaluateCondition(btn.visibleCondition, context) === true
}

// ---- Row button visibility ----

function isRowButtonVisible(btn: ActionButton, row: Record<string, unknown>): boolean {
  if (!btn.visibleCondition) return true
  const context = { row, ...row }
  return evaluateCondition(btn.visibleCondition, context) === true
}

// ---- Tooltip content ----

function getTooltipContent(col: AdvancedTableColumn, row: Record<string, unknown>): string {
  if (col.tooltipField) return String(getRowCellValue(row, col.tooltipField) ?? '')
  return String(getRowCellValue(row, col.prop) ?? '')
}

function cellValue(row: Record<string, unknown>, prop: string): unknown {
  return getRowCellValue(row, prop)
}

// ---- Auto-load ----

function applyEditorMockIfNeeded() {
  const hasApi = !!listApiConfig.url
  if (!shouldUseWidgetMock(surface, hasApi)) return
  const mock = getTableRowsFromMock(widgetData.value.type)
  if (!mock) return
  tableData.value = mock.rows
  total.value = mock.total
}

onMounted(() => {
  if (listApiConfig.url) {
    fetchData()
  } else {
    applyEditorMockIfNeeded()
  }
})

watch(
  () => listApiConfig.url,
  (url) => {
    if (url) fetchData()
    else {
      tableData.value = []
      total.value = 0
      applyEditorMockIfNeeded()
    }
  },
)

// ---- Expose methods ----

defineExpose({
  refresh: fetchData,
  setSearchParams,
  clearSelection,
})
</script>

<template>
  <div :class="styles.container">
    <!-- E-32 Search bar -->
    <div v-if="searchEnabled" :class="styles.searchBar">
      <div v-for="field in searchFields" :key="field.field" :class="styles.searchField">
        <span :class="styles.searchLabel">{{ field.label }}</span>
        <el-input
          v-if="!field.type || field.type === 'input'"
          v-model="searchForm[field.field]"
          :placeholder="field.placeholder || `请输入${field.label}`"
          clearable
          size="default"
          @keyup.enter="applySearch"
        />
        <el-select
          v-else-if="field.type === 'select'"
          v-model="searchForm[field.field]"
          :placeholder="field.placeholder || `请选择${field.label}`"
          clearable
          size="default"
          style="width: 100%"
        >
          <el-option
            v-for="opt in field.options ?? []"
            :key="String(opt.value)"
            :label="opt.label"
            :value="String(opt.value)"
          />
        </el-select>
      </div>
      <div :class="styles.searchActions">
        <el-button type="primary" @click="applySearch">
          <AppIcon name="search" :class="styles.toolbarBtnIcon" />
          查询
        </el-button>
        <el-button @click="resetSearch">
          <AppIcon name="refresh-left" :class="styles.toolbarBtnIcon" />
          重置
        </el-button>
      </div>
    </div>

    <!-- Toolbar -->
    <div v-if="toolbar.length > 0" :class="styles.toolbar">
      <template v-for="btn in toolbar" :key="btn.key">
        <el-button
          v-if="isToolbarVisible(btn)"
          :type="btn.type || undefined"
          :size="btn.size || 'default'"
          @click="handleToolbarClick(btn)"
        >
          <AppIcon v-if="btn.icon" :name="btn.icon" :class="styles.toolbarBtnIcon" />
          {{ btn.label }}
        </el-button>
      </template>
    </div>

    <!-- Batch actions bar -->
    <div v-if="selectionConfig.enabled && selectedRows.length > 0" :class="styles.batchBar">
      <span :class="styles.batchInfo">已选 {{ selectedRows.length }} 项</span>
      <el-button size="small" text @click="clearSelection">取消选择</el-button>
    </div>

    <!-- Table -->
    <el-table
      v-loading="loading"
      :data="tableData"
      :stripe="stripe"
      :border="border"
      :height="tableHeight"
      size="default"
      :class="styles.table"
      @sort-change="onSortChange"
      @filter-change="onFilterChange"
      @selection-change="onSelectionChange"
      @row-click="onRowClick"
    >
      <!-- Selection column -->
      <el-table-column
        v-if="selectionConfig.enabled"
        type="selection"
        width="50"
        fixed="left"
      />

      <!-- Data columns -->
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width === 'auto' ? undefined : col.width"
        :min-width="col.minWidth"
        :fixed="col.fixed"
        :align="col.align"
        :sortable="col.sortable !== undefined ? col.sortable : (globalSortable ? 'custom' : false)"
        :filters="columnFilters(col)"
        :filter-method="columnFilters(col) ? (col.filterMethod ?? defaultFilterMethod(col.prop)) : undefined"
        :show-overflow-tooltip="col.showTooltip && col.render !== 'tooltip'"
      >
        <template #default="{ row, $index }">
          <!-- text (default) -->
          <template v-if="!col.render || col.render === 'text'">
            {{ cellValue(row, col.prop) }}
          </template>

          <!-- tooltip -->
          <template v-else-if="col.render === 'tooltip'">
            <el-tooltip :content="getTooltipContent(col, row)" placement="top">
              <span>{{ cellValue(row, col.prop) }}</span>
            </el-tooltip>
          </template>

          <!-- link -->
          <template v-else-if="col.render === 'link'">
            <el-link type="primary" @click.stop="handleLinkClick(col, row, $index)">
              {{ cellValue(row, col.prop) }}
            </el-link>
          </template>

          <!-- tag -->
          <template v-else-if="col.render === 'tag'">
            <el-tag
              :type="getTagType(effectiveColumn(col).colorMap, cellValue(row, col.prop)) as any"
              size="small"
            >
              {{ getOptionLabel(effectiveColumn(col).options as any, cellValue(row, col.prop)) }}
            </el-tag>
          </template>

          <!-- flowStatus (E-13) -->
          <template v-else-if="col.render === 'flowStatus'">
            <el-tag
              :type="getFlowStatusTagType(row) as any"
              size="small"
            >
              {{ getFlowStatusLabel(row) }}
            </el-tag>
          </template>

          <!-- expiryAlert (E-18) -->
          <template v-else-if="col.render === 'expiryAlert'">
            <el-tag
              :type="getExpiryTagType(row) as any"
              size="small"
            >
              {{ getExpiryLabel(row) }}
            </el-tag>
          </template>

          <!-- badge -->
          <template v-else-if="col.render === 'badge'">
            <el-badge
              :type="getTagType(effectiveColumn(col).colorMap, cellValue(row, col.prop)) as any"
              :value="getOptionLabel(effectiveColumn(col).options as any, cellValue(row, col.prop))"
            />
          </template>

          <!-- image -->
          <template v-else-if="col.render === 'image'">
            <el-image
              :src="cellValue(row, col.prop) as string"
              :style="{ width: (col.imageWidth || 40) + 'px', height: (col.imageWidth || 40) + 'px' }"
              fit="cover"
            />
          </template>

          <!-- buttons -->
          <template v-else-if="col.render === 'buttons'">
            <div :class="styles.cellButtons">
              <template v-for="btn in col.buttons" :key="btn.key">
                <el-button
                  v-if="isRowButtonVisible(btn, row)"
                  :type="btn.type || undefined"
                  :size="btn.size || 'small'"
                  link
                  @click.stop="handleRowButtonClick(btn, row, $index)"
                >
                  <AppIcon v-if="btn.icon" :name="btn.icon" :class="styles.toolbarBtnIcon" />
                  {{ btn.label }}
                </el-button>
              </template>
            </div>
          </template>

          <!-- custom -->
          <template v-else-if="col.render === 'custom'">
            <span>{{ cellValue(row, col.prop) }}</span>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <el-pagination
      v-if="paginationConfig.enabled"
      :class="styles.pagination"
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="paginationConfig.pageSizes"
      layout="prev, pager, next, sizes, jumper"
      @current-change="onPageChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>
