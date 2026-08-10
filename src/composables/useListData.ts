/**
 * List data composable for search-list component
 * Manages list data lifecycle: fetching, pagination, search, sort, selection
 *
 * 内部委托 useWidgetData 获取Data, 自动获得Retry（指数退避）/ SWR / 去重能力。
 * Consumer（advanced-table / table）零改动。
 */
import { ref, reactive, computed, onMounted } from "vue";
import type { Ref } from "vue";
import { fetchGenericList } from "@/api/dataApi";
import type { ListApiConfig } from "@/components/WidgetRenderer/types";
import { useWidgetData } from "@/composables/useWidgetData";

export interface UseListDataOptions {
  listApi: ListApiConfig;
  pageSize?: number;
  autoLoad?: boolean;
  enableRetry?: boolean;
  retryCount?: number;
}

export interface UseListDataReturn {
  tableData: Ref<Record<string, unknown>[]>;
  total: Ref<number>;
  loading: Ref<boolean>;
  error: Ref<string>;
  currentPage: Ref<number>;
  pageSize: Ref<number>;
  searchParams: Record<string, unknown>;
  setSearchParams: (params: Record<string, unknown>) => void;
  fetchData: () => Promise<void>;
  handleSearch: () => void;
  handleReset: () => void;
  handlePageChange: (page: number) => void;
  handleSizeChange: (size: number) => void;
  handleSortChange: (sort: { prop: string; order: string }) => void;
  selectedRows: Ref<Record<string, unknown>[]>;
  handleSelectionChange: (rows: Record<string, unknown>[]) => void;
  clearSelection: () => void;
}

export function useListData(options: UseListDataOptions): UseListDataReturn {
  const { listApi, pageSize: defaultPageSize = 10, autoLoad = true } = options;

  // ---- UI Status（Min页/Sort/Search/选择） ----
  const tableData = ref<Record<string, unknown>[]>([]) as Ref<
    Record<string, unknown>[]
  >;
  const total = ref(0);
  const loading = ref(false);
  const error = ref("");
  const currentPage = ref(1);
  const pageSize = ref(defaultPageSize);
  const searchParams = reactive<Record<string, unknown>>({});
  const sortState = reactive({ prop: "", order: "" });
  const selectedRows = ref<Record<string, unknown>[]>([]) as Ref<
    Record<string, unknown>[]
  >;

  // ---- useWidgetData 委托（Retry/SWR/去重） ----
  const dataKey = computed(() => listApi.url || "__empty__");

  const {
    data: rawResponse,
    error: wError,
    reload: wReload,
  } = useWidgetData<{ data: Record<string, unknown>[]; total: number }>({
    key: dataKey.value,
    fetcher: () =>
      fetchGenericList(listApi, {
        page: currentPage.value,
        pageSize: pageSize.value,
        searchParams,
        extraParams: listApi.extraParams,
        sortField: sortState.prop || undefined,
        sortOrder: sortState.order || undefined,
      }),
    enabled: computed(() => !!listApi.url),
    autoLoad: false, // Manual autoLoad control (fetch after pagination params ready)
    swr: false, // SWR not applicable for list (each pagination/search needs fresh data)
    retry: options.enableRetry ? (options.retryCount ?? 3) : 0, // No retry by default (backward compatible), HA widget passes enableRetry: true explicitly
    cacheTtl: 0, // Do not cache list data (pagination params change frequently)
  });

  // ---- 核心 fetch：调用 useWidgetData reload（强制Refresh） ----
  async function fetchData(): Promise<void> {
    if (!listApi.url) return;
    loading.value = true;
    error.value = "";
    await wReload();
    if (rawResponse.value) {
      tableData.value = rawResponse.value.data ?? [];
      total.value = rawResponse.value.total ?? 0;
    }
    // error 清空 tableData（SWR 模式下保留 stale, 但Column表页Show stale 无意义）
    if (wError.value) {
      error.value = wError.value;
      tableData.value = [];
      total.value = 0;
    }
    loading.value = false;
  }

  // ---- Sync useWidgetData 的 loading/error 到本地 ref ----
  // useWidgetData 的 loading/error 在 reload() 完成后才Update, fetchData 手动管理本地Status即可

  function handleSearch(): void {
    if (listApi.resetOnSearch !== false) {
      currentPage.value = 1;
    }
    fetchData();
  }

  function handleReset(): void {
    Object.keys(searchParams).forEach((key) => {
      searchParams[key] = undefined;
    });
    currentPage.value = 1;
    sortState.prop = "";
    sortState.order = "";
    fetchData();
  }

  function handlePageChange(page: number): void {
    currentPage.value = page;
    fetchData();
  }

  function handleSizeChange(size: number): void {
    pageSize.value = size;
    currentPage.value = 1;
    fetchData();
  }

  function handleSortChange(sort: { prop: string; order: string }): void {
    sortState.prop = sort.prop;
    sortState.order = sort.order;
    fetchData();
  }

  function handleSelectionChange(rows: Record<string, unknown>[]): void {
    selectedRows.value = rows;
  }

  function clearSelection(): void {
    selectedRows.value = [];
  }

  function setSearchParams(params: Record<string, unknown>): void {
    Object.assign(searchParams, params);
  }

  onMounted(() => {
    if (autoLoad && listApi.immediate !== false) {
      fetchData();
    }
  });

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
  };
}
