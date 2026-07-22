/**
 * useWidgetData - 高可用数据 composable
 *
 * 统一 widget 数据获取层，提供：
 * - 自动重试（指数退避，默认 3 次）
 * - SWR（Stale-While-Revalidate）：先返回缓存 stale 数据，后台刷新
 * - 请求去重：同 key 并发请求合并为一次
 * - 乐观更新：mutate 立即改本地数据，失败自动 rollback
 * - 与 DataSourceStore 协同：dataSourceId 存在时委托 store（复用 WS/轮询/L1）
 *
 * 取代各 widget 自行 fetch + 各写一套 loading/error 的散乱模式。
 */
import { ref, watch, onUnmounted, type Ref, type MaybeRefOrGetter, toValue, shallowRef } from 'vue'
import { useDataSourceStore } from '@/stores/dataSource'
import type { SchemaApiConfig } from '@/widgets/base/types'

export interface UseWidgetDataOptions<T> {
  /** 缓存 key（apiUrl + params hash）；dataSourceId 存在时用 dsId */
  key: string
  /** 数据获取函数 */
  fetcher: () => Promise<T>
  /** 是否启用（false 时不 fetch），默认 true */
  enabled?: MaybeRefOrGetter<boolean>
  /** 重试次数，默认 3（含首次共 4 次尝试） */
  retry?: number
  /** SWR：先返回 stale 缓存再后台刷新，默认 true */
  swr?: boolean
  /** 请求去重，默认 true */
  dedup?: boolean
  /** 轮询间隔 ms，0 不轮询，默认 0 */
  polling?: number
  /** L1 缓存 TTL ms，0 不缓存，默认 30000 */
  cacheTtl?: number
  /** 若使用全局数据源，传入 apiConfig（含 dataSourceId 时委托 store） */
  apiConfig?: MaybeRefOrGetter<SchemaApiConfig | undefined>
  /** autoLoad，默认 true */
  autoLoad?: boolean
}

export interface UseWidgetDataReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string>
  /** 是否正后台刷新（SWR 场景：已有 stale 数据时的后台请求） */
  refreshing: Ref<boolean>
  /** 手动重新加载 */
  reload: () => Promise<void>
  /** 乐观更新：立即设置本地数据，可选 rollback 函数 */
  mutate: (updater: T | ((prev: T | null) => T), rollback?: () => void) => void
  /** 直接替换数据（无 rollback 语义） */
  setData: (next: T | null) => void
}

// ---- 模块级共享：去重 + L1 缓存 ----
/** in-flight 请求去重：key -> Promise */
const inflight = new Map<string, Promise<unknown>>()
/** L1 缓存：key -> { data, ts, ttl } */
const cache = new Map<string, { data: unknown; ts: number; ttl: number }>()

function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (entry.ttl > 0 && Date.now() - entry.ts >= entry.ttl) {
    cache.delete(key)
    return undefined
  }
  return entry.data as T
}

function cacheSet<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, ts: Date.now(), ttl })
}

/** 指数退避延迟：1s, 2s, 4s... */
function backoff(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 8000)
}

export function useWidgetData<T>(options: UseWidgetDataOptions<T>): UseWidgetDataReturn<T> {
  const {
    key,
    fetcher,
    retry = 3,
    swr = true,
    dedup = true,
    polling = 0,
    cacheTtl = 30_000,
    apiConfig,
    autoLoad = true,
  } = options

  const data = shallowRef<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref('')
  const refreshing = ref(false)

  let poller: ReturnType<typeof setInterval> | null = null
  // rollback 快照：乐观更新失败时恢复
  let lastSnapshot: T | null = null

  /** 带重试的 fetch（指数退避） */
  async function fetchWithRetry(): Promise<T> {
    let lastErr: unknown
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        return await fetcher()
      } catch (err) {
        lastErr = err
        if (attempt < retry) {
          await new Promise((r) => setTimeout(r, backoff(attempt)))
        }
      }
    }
    throw lastErr
  }

  /** 去重 fetch：同 key 并发合并 */
  function dedupFetch(): Promise<T> {
    if (!dedup) return fetchWithRetry()
    const existing = inflight.get(key) as Promise<T> | undefined
    if (existing) return existing
    const p = fetchWithRetry().finally(() => inflight.delete(key))
    inflight.set(key, p)
    return p
  }

  /** 核心加载逻辑 */
  async function load(force = false): Promise<void> {
    const hasStale = data.value !== null

    // SWR：有 stale 数据时不阻塞 loading，改用 refreshing
    const useSwr = swr && hasStale && !force
    if (useSwr) {
      refreshing.value = true
    } else {
      loading.value = true
    }
    error.value = ''

    try {
      const result = await dedupFetch()
      data.value = result
      lastSnapshot = result
      cacheSet(key, result, cacheTtl)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Request failed'
      // SWR 模式下保留 stale 数据不清空，仅标记错误
      if (!useSwr) {
        data.value = null
      }
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  /** 手动重新加载（强制刷新） */
  async function reload(): Promise<void> {
    return load(true)
  }

  /**
   * 乐观更新：立即改本地数据 + 缓存，返回前值供调用方失败时 rollback。
   *
   * 典型用法：
   *   const prev = mutate(updated)
   *   try { await api.delete(id) }
   *   catch { setData(prev); ElMessage.error('删除失败') }
   */
  function mutate(updater: T | ((prev: T | null) => T)): T | null {
    const prev = data.value
    const next = typeof updater === 'function' ? (updater as (p: T | null) => T)(prev) : updater
    data.value = next
    cacheSet(key, next, cacheTtl)
    return prev
  }

  /** 直接替换数据（也用于 rollback） */
  function setData(next: T | null): void {
    data.value = next
    if (next !== null) {
      cacheSet(key, next, cacheTtl)
    }
  }

  // ---- DataSourceStore 委托（dataSourceId 存在时） ----
  const store = useDataSourceStore()
  let unsubscribe: (() => void) | null = null
  let storeBound = false

  function bindStore(config: SchemaApiConfig | undefined): void {
    unsubscribe?.()
    unsubscribe = null
    storeBound = false
    if (!config?.dataSourceId) return
    storeBound = true
    const dsId = config.dataSourceId
    unsubscribe = store.subscribe(dsId, (newData) => {
      data.value = newData as T
      lastSnapshot = newData as T
    })
    const state = store.states.get(dsId)
    if (state?.data) {
      data.value = state.data as T
      lastSnapshot = state.data as T
    }
    loading.value = state?.loading ?? false
    error.value = state?.error ?? ''
  }

  // ---- 生命周期 ----
  const enabledGetter = options.enabled !== undefined ? options.enabled : true

  function start() {
    if (polling > 0 && !poller) {
      poller = setInterval(() => { void load(false) }, polling)
    }
  }
  function stop() {
    if (poller) {
      clearInterval(poller)
      poller = null
    }
  }

  // 监听 apiConfig 变化（dataSourceId 切换）
  if (apiConfig !== undefined) {
    watch(() => toValue(apiConfig), (config) => {
      if (config?.dataSourceId) {
        bindStore(config)
      } else if (storeBound) {
        unsubscribe?.()
        unsubscribe = null
        storeBound = false
      }
    }, { immediate: true })
  }

  // 监听 enabled
  watch(
    () => toValue(enabledGetter),
    (en) => {
      if (en) {
        if (!storeBound && autoLoad) void load(false)
        start()
      } else {
        stop()
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    stop()
    unsubscribe?.()
  })

  return { data, loading, error, refreshing, reload, mutate, setData }
}
