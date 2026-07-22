/**
 * useAdvancedTableConfig - advanced-table 的 schema 配置解析
 *
 * 从 FgAdvancedTable 抽出：从 widgetData.props 解析 columns/toolbar/pagination/
 * selection/searchBar/stripe/border/height/sortable/virtual 等响应式配置。
 */
import { computed, reactive, watch, type ComputedRef, type Ref } from 'vue'
import type { Widget } from '../base/types'
import type { ListApiConfig } from '../../components/WidgetRenderer/types'
import type {
  AdvancedTableColumn,
  ActionButton,
  AdvPaginationConfig,
  AdvSelectionConfig,
  SearchBarConfig,
  SearchField,
} from './config'
import { shouldUseServerSideFilter } from './columnServerFilter'

export interface AdvancedTableConfig {
  columns: ComputedRef<AdvancedTableColumn[]>
  toolbar: ComputedRef<ActionButton[]>
  stripe: ComputedRef<boolean>
  border: ComputedRef<boolean>
  tableHeight: ComputedRef<number>
  globalSortable: ComputedRef<boolean>
  virtualEnabled: ComputedRef<boolean>
  paginationConfig: ComputedRef<AdvPaginationConfig>
  selectionConfig: ComputedRef<AdvSelectionConfig>
  searchBarConfig: ComputedRef<SearchBarConfig>
  searchFields: ComputedRef<SearchField[]>
  searchEnabled: ComputedRef<boolean>
  listApiConfig: ListApiConfig
  /** serverSideFilter 依赖 listApiConfig.url，故在 composable 内一并计算 */
  serverSideFilter: (columns: AdvancedTableColumn[]) => boolean
}

export function useAdvancedTableConfig(widgetData: Ref<Widget>): AdvancedTableConfig {
  const columns = computed<AdvancedTableColumn[]>(
    () => (widgetData.value.props?.columns as AdvancedTableColumn[]) ?? [],
  )
  const toolbar = computed<ActionButton[]>(
    () => (widgetData.value.props?.toolbar as ActionButton[]) ?? [],
  )
  const stripe = computed(() => (widgetData.value.props?.stripe as boolean) ?? true)
  const border = computed(() => (widgetData.value.props?.border as boolean) ?? true)
  const tableHeight = computed(() => (widgetData.value.props?.height as number) ?? 350)
  const globalSortable = computed(() => (widgetData.value.props?.sortable as boolean) ?? false)
  const virtualEnabled = computed(() => (widgetData.value.props?.virtual as boolean) ?? false)

  const paginationConfig = computed<AdvPaginationConfig>(
    () =>
      (widgetData.value.props?.pagination as AdvPaginationConfig) ?? {
        enabled: true,
        pageSize: 20,
        pageSizes: [10, 20, 50, 100],
      },
  )

  const selectionConfig = computed<AdvSelectionConfig>(
    () => (widgetData.value.props?.selection as AdvSelectionConfig) ?? { enabled: false },
  )

  const searchBarConfig = computed<SearchBarConfig>(
    () => (widgetData.value.props?.searchBar as SearchBarConfig) ?? { enabled: false, fields: [] },
  )

  const searchFields = computed<SearchField[]>(() => searchBarConfig.value.fields ?? [])
  const searchEnabled = computed(
    () => searchBarConfig.value.enabled !== false && searchFields.value.length > 0,
  )

  // ---- ListApiConfig（reactive，watch url 重建） ----
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

  function serverSideFilter(cols: AdvancedTableColumn[]): boolean {
    return shouldUseServerSideFilter(
      widgetData.value.props as Record<string, unknown> | undefined,
      !!listApiConfig.url,
      cols,
    )
  }

  return {
    columns,
    toolbar,
    stripe,
    border,
    tableHeight,
    globalSortable,
    virtualEnabled,
    paginationConfig,
    selectionConfig,
    searchBarConfig,
    searchFields,
    searchEnabled,
    listApiConfig,
    serverSideFilter,
  }
}
