<script setup lang="ts">
import { inject, computed, watch, onMounted } from 'vue'
import { TABLE_CLICK_INTERCEPT_KEY } from './clickIntercept'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import FgSearchForm from '../../components/SearchForm/FgSearchForm.vue'
import WidgetStateShell from '../../components/WidgetRenderer/WidgetStateShell.vue'
import FgAdvancedTableVirtual from './FgAdvancedTableVirtual.vue'
import { widgetDataKey } from '../base/types'
import { EVENT_CONTEXT_KEY, FORM_GRID_CONTEXT_KEY } from '../../components/WidgetRenderer/types'
import { useListData } from '../../composables/useListData'
import { useExposeWidget } from '../../composables/useExposeWidget'
import type { AdvancedTableColumn, ActionButton } from './config'
import { getRowCellValue } from './tableRowValue'
import { resolveColumnFilters } from './columnFilters'
import { buildServerFilterParams } from './columnServerFilter'
import { resolveEffectiveColumn } from './columnOptions'
import { useAdvancedTableConfig } from './useAdvancedTableConfig'
import { useAdvancedTableEvents } from './useAdvancedTableEvents'
import {
  getTagType,
  getOptionLabel,
  getFlowStatusLabel,
  getFlowStatusTagType,
  getExpiryLabel,
  getExpiryTagType,
  getTooltipContent,
  cellValue,
} from './advancedTableCellRender'
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

// ---- Schema config（抽到 useAdvancedTableConfig） ----

const {
  columns,
  toolbar,
  stripe,
  border,
  tableHeight,
  globalSortable,
  virtualEnabled,
  paginationConfig,
  selectionConfig,
  searchFields,
  searchEnabled,
  listApiConfig,
  serverSideFilter: serverSideFilterFn,
} = useAdvancedTableConfig(widgetData)

const serverSideFilter = computed(() => serverSideFilterFn(columns.value))

// ---- 数据层 ----

function onSearch(params: Record<string, unknown>) {
  setSearchParams(params)
  fetchData()
}

function onSearchReset() {
  setSearchParams({})
  fetchData()
}

const {
  tableData,
  total,
  loading,
  error,
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
  enableRetry: true, // 高可用：网络抖动时自动重试（指数退避，3 次）
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

// ---- 事件分发（抽到 useAdvancedTableEvents） ----

const {
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
} = useAdvancedTableEvents({
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
})

// ---- Filter ----

function defaultFilterMethod(prop: string) {
  if (serverSideFilter.value) return () => true
  return (value: unknown, row: Record<string, unknown>) => getRowCellValue(row, prop) === value
}

function columnFilters(col: AdvancedTableColumn) {
  const effective = resolveEffectiveColumn(col, gridContext?.global?.dictMap)
  return resolveColumnFilters(effective, tableData.value)
}

function effectiveColumn(col: AdvancedTableColumn): AdvancedTableColumn {
  return resolveEffectiveColumn(col, gridContext?.global?.dictMap)
}

// ---- 虚拟滚动 ----

const VIRTUAL_THRESHOLD = 100
const useVirtual = computed(() => virtualEnabled.value && tableData.value.length > VIRTUAL_THRESHOLD)

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

/** 乐观插入一行（头部），同步 total */
function insertRow(row: Record<string, unknown>): void {
  tableData.value = [row, ...tableData.value]
  total.value += 1
}

/** 乐观更新匹配行（按 idField+id 定位），patch 合并 */
function updateRow(idField: string, id: unknown, patch: Record<string, unknown>): void {
  tableData.value = tableData.value.map((r) =>
    r[idField] === id ? { ...r, ...patch } : r,
  )
}

/** 乐观删除匹配行，同步 total */
function removeRow(idField: string, id: unknown): void {
  tableData.value = tableData.value.filter((r) => r[idField] !== id)
  total.value = Math.max(0, total.value - 1)
}

defineExpose({
  refresh: fetchData,
  setSearchParams,
  clearSelection,
  insertRow,
  updateRow,
  removeRow,
})
</script>

<template>
  <div :class="styles.container">
    <!-- E-32 Search bar -->
    <FgSearchForm
      v-if="searchEnabled"
      :fields="searchFields"
      @search="onSearch"
      @reset="onSearchReset"
    />

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

    <!-- Table + 统一状态壳（loading/empty/error） -->
    <WidgetStateShell
      :loading="loading && tableData.length === 0"
      :error="error"
      :empty="!loading && !error && tableData.length === 0"
      :skeleton-rows="6"
      :min-height="(tableHeight ?? 200) + 'px'"
      @retry="fetchData"
    >
      <!-- 虚拟滚动路径：数据 > 阈值且 virtual 开启 -->
      <FgAdvancedTableVirtual
        v-if="useVirtual"
        :columns="columns"
        :data="tableData"
        :height="tableHeight"
        @row-click="(row: Record<string, unknown>, i: number) => onRowClick(row)"
        @row-button-click="(btn: ActionButton, row: Record<string, unknown>, i: number) => handleRowButtonClick(btn, row, i)"
      />
      <!-- 常规路径：el-table（全特性） -->
      <el-table
        v-else
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
    </WidgetStateShell>
  </div>
</template>
