/**
 * List data composable for search-list component
 * Manages list data lifecycle: fetching, pagination, search, sort, selection
 *
 * 内部委托 useWidgetData 获取数据，自动获得重试（指数退避）/ SWR / 去重能力。
 * Consumer（advanced-table / table）零改动。
 */
import { ref, reactive, computed, onMounted } from 'vue'
import type { Ref } from 'vue'
import { fetchGenericList } from '@/api/dataApi'
import type { ListApiConfig } from '@/components/WidgetRenderer/types'
import { useWidgetData } from '@/composables/useWidgetData'

export interface UseListDataOptions {
  listApi: ListApiConfig
  pageSize?: number
  autoLoad?: boolean
  enableRetry?: boolean
  retryCount?: number
}

export interface UseListDataReturn {
  tableData: Ref<Record<string, unknown>[]>
  total: Ref<number>
  loading: Ref<boolean>
  error: Ref<string>
  currentPage: Ref<number>
  pageSize: Ref<number>
  searchParams: Record<string, unknown>
  setSearchParams: (params: Record<string, unknown>) => void
  fetchData: () => Promise<void>
  handleSearch: () => void
  handleReset: () => void
  handlePageChange: (page: number) => void
  handleSizeChange: (size: number) => void
  handleSortChange: (sort: { prop: string; order: string }) => void
  selectedRows: Ref<Record<string, unknown>[]>
  handleSelectionChange: (rows: Record<string, unknown>[]) => void
  clearSelection: () => void
}


export function useListData(options: UseListDataOptions): UseListDataReturn {
  const { listApi, pageSize: defaultPageSize = 10, autoLoad = true } = options

  // ---- UI 状态（分页/排序/搜索/选择） ----
  const tableData = ref<Record<string, unknown>[]>([]) as Ref<Record<string, unknown>[]>
  const total = ref(0)
  const loading = ref(false)
  const error = ref('')
  const currentPage = ref(1)
  const pageSize = ref(defaultPageSize)
  const searchParams = reactive<Record<string, unknown>>({})
  const sortState = reactive({ prop: '', order: '' })
  const selectedRows = ref<Record<string, unknown>[]>([]) as Ref<Record<string, unknown>[]>

  // ---- useWidgetData 委托（重试/SWR/去重） ----
  const dataKey = computed(() => listApi.url || '__empty__')

  const { data: rawResponse, loading: wLoading, error: wError, reload: wReload } = useWidgetData<
    { data: Record<string, unknown>[]; total: number }
  >({
    key: dataKey.value,
    fetcher: () => fetchGenericList(
      listApi,
      {
        page: currentPage.value,
        pageSize: pageSize.value,
        searchParams,
        extraParams: listApi.extraParams,
        sortField: sortState.prop || undefined,
        sortOrder: sortState.order || undefined,
      },
    ),
    enabled: computed(() => !!listApi.url),
    autoLoad: false, // 手动控制 autoLoad（分页参数准备好后再 fetch）
    swr: false, // 列表场景不适用 SWR（每次分页/搜索都要新数据）
    retry: options.enableRetry ? (options.retryCount ?? 3) : 0, // 默认不重试（向后兼容），HA widget 显式传 enableRetry: true
    cacheTtl: 0, // 列表数据不缓存（分页参数频繁变化）
  })

  // ---- 核心 fetch：调用 useWidgetData reload（强制刷新） ----
  async function fetchData(): Promise<void> {
    if (!listApi.url) return
    loading.value = true
    error.value = ''
    await wReload()
    if (rawResponse.value) {
      tableData.value = rawResponse.value.data ?? []
      total.value = rawResponse.value.total ?? 0
    }
    // error 清空 tableData（SWR 模式下保留 stale，但列表页显示 stale 无意义）
    if (wError.value) {
      error.value = wError.value
      tableData.value = []
      total.value = 0
    }
    loading.value = false
  }

  // ---- 同步 useWidgetData 的 loading/error 到本地 ref ----
  // useWidgetData 的 loading/error 在 reload() 完成后才更新，fetchData 手动管理本地状态即可

  function handleSearch(): void {
    if (listApi.resetOnSearch !== false) {
      currentPage.value = 1
    }
    fetchData()
  }

  function handleReset(): void {
    Object.keys(searchParams).forEach(key => { searchParams[key] = undefined })
    currentPage.value = 1
    sortState.prop = ''
    sortState.order = ''
    fetchData()
  }

  function handlePageChange(page: number): void {
    currentPage.value = page
    fetchData()
  }

  function handleSizeChange(size: number): void {
    pageSize.value = size
    currentPage.value = 1
    fetchData()
  }

  function handleSortChange(sort: { prop: string; order: string }): void {
    sortState.prop = sort.prop
    sortState.order = sort.order
    fetchData()
  }

  function handleSelectionChange(rows: Record<string, unknown>[]): void {
    selectedRows.value = rows
  }

  function clearSelection(): void {
    selectedRows.value = []
  }

  function setSearchParams(params: Record<string, unknown>): void {
    Object.assign(searchParams, params)
  }

  onMounted(() => {
    if (autoLoad && listApi.immediate !== false) {
      fetchData()
    }
  })

  return {
    tableData,
    total,
    loading,
    error,
    currentPage,
    pageSize,
    searchParams,
    setSearchParams,
    fetchData,
    handleSearch,
    handleReset,
    handlePageChange,
    handleSizeChange,
    handleSortChange,
    selectedRows,
    handleSelectionChange,
    clearSelection,
  }
}
