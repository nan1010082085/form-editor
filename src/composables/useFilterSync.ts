/**
 * useFilterSync — 将 filter-bar 的筛选参数同步到 DataSourceStore + URL
 *
 * 调用方式：在渲染 filter-bar 的父级上下文中调用，传入 filter-bar 的 exposed 引用。
 * 当 filter-bar 的 filterData 变化时，自动更新 DataSourceStore.filterParams，
 * 并可选同步到 URL query params（支持分享链接）。
 */
import { watch, onUnmounted, type Ref, type MaybeRefOrGetter, toValue } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataSourceStore } from '@/stores/dataSource'

export interface UseFilterSyncOptions {
  /** 是否同步到 URL query params（默认 true） */
  syncToUrl?: boolean
  /** URL 中 filter 参数的 key 前缀（默认 'f_'） */
  urlPrefix?: string
  /** 防抖延迟（ms，默认 300） */
  debounceMs?: number
}

export function useFilterSync(
  filterData: MaybeRefOrGetter<Record<string, unknown>>,
  options: UseFilterSyncOptions = {},
): { clearFilters: () => void; restoreFromUrl: () => void } {
  const { syncToUrl = true, urlPrefix = 'f_', debounceMs = 300 } = options
  const store = useDataSourceStore()

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // 从 URL 恢复 filter params（仅在初始化时）
  function restoreFromUrl(): void {
    if (!syncToUrl) return
    try {
      const route = useRoute()
      const params: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(route.query)) {
        if (key.startsWith(urlPrefix)) {
          const filterKey = key.slice(urlPrefix.length)
          params[filterKey] = value
        }
      }
      if (Object.keys(params).length > 0) {
        store.setFilterParams(params)
      }
    } catch {
      // router 不可用时静默忽略
    }
  }

  // 同步 filter params 到 URL
  function syncToUrlParams(params: Record<string, unknown>): void {
    if (!syncToUrl) return
    try {
      const router = useRouter()
      const route = useRoute()
      const query = { ...route.query }

      // 清除旧的 filter query params
      for (const key of Object.keys(query)) {
        if (key.startsWith(urlPrefix)) {
          delete query[key]
        }
      }

      // 写入新的 filter params
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          query[`${urlPrefix}${key}`] = String(value)
        }
      }

      void router.replace({ query })
    } catch {
      // router 不可用时静默忽略
    }
  }

  // 监听 filterData 变化
  const stopWatch = watch(
    () => toValue(filterData),
    (newData) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        store.setFilterParams(newData)
        syncToUrlParams(newData)
      }, debounceMs)
    },
    { deep: true },
  )

  function clearFilters(): void {
    store.clearFilterParams()
    if (syncToUrl) {
      syncToUrlParams({})
    }
  }

  // 初始化时恢复 URL params
  restoreFromUrl()

  onUnmounted(() => {
    stopWatch()
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return { clearFilters, restoreFromUrl }
}
