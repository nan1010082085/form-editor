/**
 * useDataSourceStore — 全局数据源管理
 *
 * 集中管理 API 数据源定义，支持 HTTP 轮询和 WebSocket 推送。
 * Widget 通过 subscribe(dsId, callback) 订阅数据变更，store 自动管理传输生命周期。
 * 统一 L1 内存缓存 + L2 IndexedDB 缓存（复用现有 useCache Worker）。
 */
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { DataSourceDefinition, DataSourceState } from '../types/dataSource'
import type { DictItem } from '../widgets/base/types'

export const useDataSourceStore = defineStore('dataSource', () => {
  // ================================================================
  // State
  // ================================================================

  const definitions = shallowRef(new Map<string, DataSourceDefinition>())
  const states = shallowRef(new Map<string, DataSourceState>())
  const subscriptions = ref(new Map<string, Set<(data: unknown) => void>>())

  // L1 内存缓存
  const l1Cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

  // Poller 实例
  const pollers = new Map<string, ReturnType<typeof setInterval>>()

  // WebSocket 连接（按 URL 共享）
  const wsConnections = new Map<string, WebSocket>()
  const wsSubscribers = new Map<string, Set<string>>() // wsUrl -> Set<dsId>

  // ================================================================
  // 注册 / 注销
  // ================================================================

  /** 从 schema 加载时注册所有数据源定义 */
  function registerAll(defs: DataSourceDefinition[]): void {
    const next = new Map<string, DataSourceDefinition>()
    for (const def of defs) {
      next.set(def.id, def)
      if (!states.value.has(def.id)) {
        const ns = new Map(states.value)
        ns.set(def.id, { data: null, loading: false, error: null, lastUpdated: 0, subscriberCount: 0 })
        states.value = ns
      }
    }
    definitions.value = next
  }

  /** 卸载所有（路由切换时调用） */
  function dispose(): void {
    for (const [id] of pollers) stopPolling(id)
    for (const [url] of wsConnections) closeWebSocket(url)
    definitions.value = new Map()
    states.value = new Map()
    subscriptions.value = new Map()
    l1Cache.clear()
  }

  // ================================================================
  // 核心请求
  // ================================================================

  /** 获取数据源数据（带 L1/L2 缓存） */
  async function fetch(dsId: string, force = false): Promise<unknown> {
    const def = definitions.value.get(dsId)
    if (!def) throw new Error(`DataSource "${dsId}" not found`)

    const cacheKey = buildCacheKey(def)

    // L1 命中
    if (!force) {
      const l1Hit = l1Get(cacheKey)
      if (l1Hit !== undefined) return l1Hit
    }

    // 标记加载中
    updateState(dsId, { loading: true, error: null })

    try {
      const http = def.http!
      const url = interpolateUrl(http.url, http.params)
      const response = await fetchWithRetry(url, {
        method: http.method ?? 'get',
        headers: http.headers,
        body: http.method === 'post' ? http.body : undefined,
        timeout: http.timeout ?? 5000,
        retry: def.retry,
      })

      const rawList = extractList(response, http.dataPath)
      const mapped = mapToDictItems(rawList, def.mapping)

      // 写入 L1 缓存
      l1Set(cacheKey, mapped, def.cache.ttlMs)

      updateState(dsId, { data: mapped, loading: false, lastUpdated: Date.now() })
      notifySubscribers(dsId, mapped)
      return mapped
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      updateState(dsId, { loading: false, error: msg })
      throw e
    }
  }

  // ================================================================
  // 轮询
  // ================================================================

  function startPolling(dsId: string): void {
    const def = definitions.value.get(dsId)
    if (!def?.http || def.http.pollIntervalSec <= 0) return
    stopPolling(dsId)

    void fetch(dsId)

    const intervalMs = def.http.pollIntervalSec * 1000
    const timer = setInterval(() => { void fetch(dsId, true) }, intervalMs)
    pollers.set(dsId, timer)
  }

  function stopPolling(dsId: string): void {
    const timer = pollers.get(dsId)
    if (timer) {
      clearInterval(timer)
      pollers.delete(dsId)
    }
  }

  // ================================================================
  // WebSocket
  // ================================================================

  function connectWebSocket(dsId: string): void {
    const def = definitions.value.get(dsId)
    if (!def?.websocket) return
    const { url } = def.websocket

    if (!wsSubscribers.has(url)) wsSubscribers.set(url, new Set())
    wsSubscribers.get(url)!.add(dsId)

    if (wsConnections.has(url)) return

    const ws = new WebSocket(url)
    wsConnections.set(url, ws)

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data as string)
        const data = def.websocket!.dataPath
          ? extractByPath(raw, def.websocket!.dataPath)
          : raw
        const mapped = Array.isArray(data)
          ? mapToDictItems(data, def.mapping)
          : data

        for (const subDsId of wsSubscribers.get(url) ?? []) {
          updateState(subDsId, { data: mapped, loading: false, lastUpdated: Date.now() })
          notifySubscribers(subDsId, mapped)
        }
      } catch { /* parse error, ignore */ }
    }

    ws.onclose = () => {
      wsConnections.delete(url)
      const { maxRetries, delayMs } = def.websocket!.reconnect
      let attempt = 0
      const reconnect = () => {
        if (attempt >= maxRetries || !wsSubscribers.has(url)) return
        attempt++
        setTimeout(() => connectWebSocket(dsId), delayMs * Math.min(attempt, 5))
      }
      reconnect()
    }
  }

  function closeWebSocket(url: string): void {
    const ws = wsConnections.get(url)
    if (ws) {
      ws.close()
      wsConnections.delete(url)
    }
    wsSubscribers.delete(url)
  }

  // ================================================================
  // 订阅
  // ================================================================

  /** 订阅数据源变更，返回取消订阅函数 */
  function subscribe(dsId: string, callback: (data: unknown) => void): () => void {
    if (!subscriptions.value.has(dsId)) {
      subscriptions.value = new Map(subscriptions.value).set(dsId, new Set())
    }
    subscriptions.value.get(dsId)!.add(callback)
    updateState(dsId, { subscriberCount: (states.value.get(dsId)?.subscriberCount ?? 0) + 1 })

    // 首个订阅者自动启动传输
    const def = definitions.value.get(dsId)
    if (def?.transport === 'http-poll') startPolling(dsId)
    if (def?.transport === 'websocket') connectWebSocket(dsId)

    return () => {
      const subs = subscriptions.value.get(dsId)
      if (subs) {
        subs.delete(callback)
        if (subs.size === 0) {
          subscriptions.value = new Map(subscriptions.value)
          subscriptions.value.delete(dsId)
          updateState(dsId, { subscriberCount: 0 })
          if (def?.transport === 'http-poll') stopPolling(dsId)
        } else {
          updateState(dsId, { subscriberCount: subs.size })
        }
      }
    }
  }

  // ================================================================
  // 内部工具
  // ================================================================

  function buildCacheKey(def: DataSourceDefinition): string {
    const http = def.http
    if (!http) return def.id
    return `${http.method}:${http.url}:${JSON.stringify(http.params ?? {})}`
  }

  function l1Get(key: string): unknown | undefined {
    const entry = l1Cache.get(key)
    if (!entry) return undefined
    if (entry.ttl > 0 && Date.now() - entry.timestamp >= entry.ttl) {
      l1Cache.delete(key)
      return undefined
    }
    return entry.data
  }

  function l1Set(key: string, data: unknown, ttl: number): void {
    l1Cache.set(key, { data, timestamp: Date.now(), ttl })
  }

  function updateState(dsId: string, patch: Partial<DataSourceState>): void {
    const prev = states.value.get(dsId) ?? { data: null, loading: false, error: null, lastUpdated: 0, subscriberCount: 0 }
    const ns = new Map(states.value)
    ns.set(dsId, { ...prev, ...patch })
    states.value = ns
  }

  function notifySubscribers(dsId: string, data: unknown): void {
    for (const cb of subscriptions.value.get(dsId) ?? []) {
      try { cb(data) } catch { /* swallow */ }
    }
  }

  function interpolateUrl(url: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) return url
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) qs.set(k, String(v))
    }
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}${qs.toString()}`
  }

  function extractList(res: unknown, dataPath?: string): Record<string, unknown>[] {
    const raw = dataPath ? extractByPath(res, dataPath) : res
    if (Array.isArray(raw)) return raw
    // 常见响应结构降级
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>
      for (const key of ['data', 'list', 'rows', 'items', 'records']) {
        if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[]
      }
    }
    return []
  }

  function extractByPath(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((cur, key) => {
      if (cur && typeof cur === 'object') return (cur as Record<string, unknown>)[key]
      return undefined
    }, obj)
  }

  function mapToDictItems(
    rawList: Record<string, unknown>[],
    mapping: { labelKey: string; valueKey: string; childrenKey?: string },
  ): DictItem[] {
    if (mapping.childrenKey) {
      const mapTree = (items: Record<string, unknown>[]): DictItem[] =>
        items.map(item => ({
          label: String(item[mapping.labelKey] ?? ''),
          value: (item[mapping.valueKey] ?? item) as string | number | boolean,
          children: item[mapping.childrenKey!] && Array.isArray(item[mapping.childrenKey!])
            ? mapTree(item[mapping.childrenKey!] as Record<string, unknown>[])
            : undefined,
        }))
      return mapTree(rawList)
    }
    return rawList.map(item => ({
      label: String(item[mapping.labelKey] ?? ''),
      value: (item[mapping.valueKey] ?? item) as string | number | boolean,
    }))
  }

  async function fetchWithRetry(
    url: string,
    opts: { method: string; headers?: Record<string, string>; body?: unknown; timeout: number; retry?: { enabled: boolean; maxRetries: number } },
  ): Promise<unknown> {
    const maxAttempts = opts.retry?.enabled ? (opts.retry.maxRetries ?? 3) : 1
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), opts.timeout)

        const fetchOpts: RequestInit = {
          method: opts.method.toUpperCase(),
          headers: { 'Content-Type': 'application/json', ...opts.headers },
          signal: controller.signal,
        }
        if (opts.method === 'post' && opts.body) {
          fetchOpts.body = JSON.stringify(opts.body)
        }

        const res = await fetch(url, fetchOpts)
        clearTimeout(timer)

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        return await res.json()
      } catch (e: unknown) {
        lastError = e instanceof Error ? e : new Error(String(e))
        if (attempt < maxAttempts - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        }
      }
    }
    throw lastError
  }

  return {
    definitions,
    states,
    registerAll,
    dispose,
    fetch,
    subscribe,
    startPolling,
    stopPolling,
    connectWebSocket,
    closeWebSocket,
  }
})
