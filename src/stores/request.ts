/**
 * useRequestStore — 请求队Column与Cache管理
 *
 * 统一管理：
 * 1. 正在进Row的请求（防重 / Cancel）
 * 2. 响应Cache（带 TTL, 跨Component共享）
 * 3. 预取队Column（批量加载 schema 树中的 API Options）
 *
 * 设计原则：
 * - 基于请求 key（method:url:params）去重, 同一请求不重复发送
 * - Cache支持 TTL 过期, 0 = 永不过期（与 optionsCache.ts Row为一致）
 * - 预取队Column按序执Row, Failed不阻塞后续任务
 * - 与现有的 requestQueue.ts / optionsCache.ts 功能兼容, 
 *   可作为集中式替代方案使用
 */
import { defineStore } from "pinia";
import { ref, computed, shallowRef } from "vue";
import { apiClient } from "@/utils/apiClient";
import { useCache } from "@/composables/useCache";
import type {
  PartialWidget,
  DictItem,
  SchemaApiConfig,
} from "@/components/WidgetRenderer/types";
import type { CacheEntry, PrefetchTask } from "@/types/api";
import { useLogger } from "@/composables/useLogger";

/** 默认 TTL：5 min */
const DEFAULT_TTL = 5 * 60 * 1000;
const logger = useLogger("RequestStore");

export const useRequestStore = defineStore("request", () => {
  // ================================================================
  // Status
  // ================================================================

  /**
   * 正在进Row的请求Map。
   * key = `method:url:JSON(params)` → AbortController
   */
  const pendingRequests = shallowRef(new Map<string, AbortController>());

  /**
   * 响应Cache。
   * key = `url:JSON(params)` → CacheEntry
   */
  const requestCache = shallowRef(new Map<string, CacheEntry>());

  /**
   * 预取队Column — 从 schema 树收集的待加载 API 任务。
   */
  const prefetchQueue = ref<PrefetchTask[]>([]);

  /**
   * 预取队Column处理Status。
   */
  const isPrefetching = ref(false);

  // ================================================================
  // 计算Property
  // ================================================================

  /** 当前正在进Row的请求数量 */
  const pendingCount = computed(() => pendingRequests.value.size);

  /** Cache条目数量 */
  const cacheSize = computed(() => requestCache.value.size);

  /** 预取队Column长度 */
  const queueLength = computed(() => prefetchQueue.value.length);

  // ================================================================
  // 内部工具
  // ================================================================

  /**
   * 生成请求 key。
   */
  function requestKey(
    method: string,
    url: string,
    params?: Record<string, unknown>,
  ): string {
    return `${method}:${url}:${JSON.stringify(params ?? {})}`;
  }

  /**
   * 生成Cache key。
   */
  function cacheKey(url: string, params?: Record<string, unknown>): string {
    return `${url}:${JSON.stringify(params ?? {})}`;
  }

  /**
   * 构建预取任务 key。
   */
  function prefetchTaskKey(
    url: string,
    method: string,
    params?: Record<string, unknown>,
  ): string {
    return `${method}:${url}:${JSON.stringify(params ?? {})}`;
  }

  // ================================================================
  // 请求管理
  // ================================================================

  /**
   * 检查是否有相同请求正在In progress。
   */
  function isPending(
    method: string,
    url: string,
    params?: Record<string, unknown>,
  ): boolean {
    return pendingRequests.value.has(requestKey(method, url, params));
  }

  /**
   * 标记一个请求为"In progress"。
   *
   * @returns AbortController 供调用方在超Hrs或CancelHrs使用
   */
  function trackRequest(
    method: string,
    url: string,
    params?: Record<string, unknown>,
  ): AbortController {
    const key = requestKey(method, url, params);
    // 若已有同名请求在In progress, 先Cancel旧的
    cancelRequest(method, url, params);
    const controller = new AbortController();
    pendingRequests.value = new Map(pendingRequests.value).set(key, controller);
    return controller;
  }

  /**
   * 移除请求跟踪（请求完成或Failed后调用）。
   */
  function untrackRequest(
    method: string,
    url: string,
    params?: Record<string, unknown>,
  ): void {
    const next = new Map(pendingRequests.value);
    next.delete(requestKey(method, url, params));
    pendingRequests.value = next;
  }

  /**
   * Cancel一个正在进Row的请求。
   */
  function cancelRequest(
    method: string,
    url: string,
    params?: Record<string, unknown>,
  ): boolean {
    const key = requestKey(method, url, params);
    const controller = pendingRequests.value.get(key);
    if (controller) {
      controller.abort();
      const next = new Map(pendingRequests.value);
      next.delete(key);
      pendingRequests.value = next;
      return true;
    }
    return false;
  }

  /**
   * Cancel所有正在进Row的请求。
   */
  function cancelAllRequests(): void {
    for (const controller of pendingRequests.value.values()) {
      controller.abort();
    }
    pendingRequests.value = new Map();
  }

  // ================================================================
  // Cache管理
  // ================================================================

  /**
   * 从Cache获取Data。
   *
   * @returns Cache的Data, 若不存在或Expired则返回 undefined
   */
  function cacheGet<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
  ): T | undefined {
    const key = cacheKey(url, params);
    const entry = requestCache.value.get(key);
    if (!entry) return undefined;

    // 检查 TTL
    if (entry.ttl > 0) {
      const age = Date.now() - entry.timestamp;
      if (age >= entry.ttl) {
        // 过期, Delete条目
        const next = new Map(requestCache.value);
        next.delete(key);
        requestCache.value = next;
        return undefined;
      }
    }

    return entry.data as T;
  }

  /**
   * 写入Cache。
   *
   * @param url  - 请求 URL
   * @param params - 请求Params
   * @param data - 要Cache的Data
   * @param ttl  - TTL 毫sec数, 默认 5 min, 设为 0 表示永不过期
   */
  function cacheSet<T = unknown>(
    url: string,
    params: Record<string, unknown> | undefined,
    data: T,
    ttl: number = DEFAULT_TTL,
  ): void {
    const key = cacheKey(url, params);
    const next = new Map(requestCache.value);
    next.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    requestCache.value = next;
  }

  /** Delete指定Cache条目 */
  function cacheDelete(url: string, params?: Record<string, unknown>): boolean {
    const key = cacheKey(url, params);
    if (requestCache.value.has(key)) {
      const next = new Map(requestCache.value);
      next.delete(key);
      requestCache.value = next;
      return true;
    }
    return false;
  }

  /** 清空所有Cache */
  function cacheClear(): void {
    requestCache.value = new Map();
  }

  // ================================================================
  // 预取队Column
  // ================================================================

  /**
   * 从 PartialWidget[] 树中收集 API 任务并追加到预取队Column。
   *
   * 与 requestQueue.ts 的 collectApiTasks 功能等价。
   */
  function collectPrefetchTasks(schema: PartialWidget[]): void {
    const taskMap = new Map<string, PrefetchTask>();

    function walk(items: PartialWidget[]): void {
      for (const item of items) {
        const api: SchemaApiConfig | undefined = item.api;
        if (api?.url && !api.dictCode) {
          const method = api.method ?? "get";
          const key = prefetchTaskKey(api.url, method, api.params);
          if (!taskMap.has(key)) {
            taskMap.set(key, {
              key,
              url: api.url,
              method,
              params: api.params,
              labelKey: api.labelKey ?? "label",
              valueKey: api.valueKey ?? "value",
            });
          }
        }
        if (item.children) walk(item.children);
      }
    }

    walk(schema);

    const newTasks = Array.from(taskMap.values());
    // Filter掉已在队Column中或已Cache的任务
    const filtered = newTasks.filter((task) => {
      const cKey = cacheKey(task.url, task.params);
      return (
        !requestCache.value.has(cKey) &&
        !prefetchQueue.value.some((t) => t.key === task.key)
      );
    });

    if (filtered.length > 0) {
      prefetchQueue.value = [...prefetchQueue.value, ...filtered];
    }
  }

  /**
   * 添加单个预取任务到队Column末尾。
   */
  function enqueuePrefetch(task: PrefetchTask): void {
    // 去重
    if (prefetchQueue.value.some((t) => t.key === task.key)) return;
    if (cacheGet(task.url, task.params) !== undefined) return;
    prefetchQueue.value = [...prefetchQueue.value, task];
  }

  /**
   * 从队Column头部取出一个任务。
   */
  function dequeuePrefetch(): PrefetchTask | undefined {
    const [head, ...rest] = prefetchQueue.value;
    if (!head) return undefined;
    prefetchQueue.value = rest;
    return head;
  }

  /**
   * 清空预取队Column。
   */
  function clearPrefetchQueue(): void {
    prefetchQueue.value = [];
  }

  /**
   * 执Row预取队Column中的所有任务。
   *
   * 按序执Row, Failed任务不会阻塞后续任务。
   * 每个任务执Row完成后自动Cache结果。
   */
  async function flushPrefetchQueue(): Promise<Map<string, DictItem[]>> {
    if (prefetchQueue.value.length === 0) return new Map();

    isPrefetching.value = true;
    const results = new Map<string, DictItem[]>();
    const workerCache = useCache();

    // 一次性获取所有任务（后续 dequeue 逐个处理）
    const tasks = [...prefetchQueue.value];
    prefetchQueue.value = [];

    for (const task of tasks) {
      // L1: Sync内存Cache
      const l1Cached = cacheGet<DictItem[]>(task.url, task.params);
      if (l1Cached) {
        results.set(task.key, l1Cached);
        continue;
      }

      // L2: Worker Cache（IndexedDB 持久化）
      const workerKey = workerCache.hashKey(task.method, task.url, task.params);
      const l2Cached = await workerCache.get<DictItem[]>(workerKey);
      if (l2Cached) {
        cacheSet(task.url, task.params, l2Cached);
        results.set(task.key, l2Cached);
        continue;
      }

      try {
        // 若已有相同请求在In progress, 跳过
        if (isPending(task.method, task.url, task.params)) continue;

        trackRequest(task.method, task.url, task.params);

        const res: unknown = await apiClient.requestUrl(
          task.method,
          task.url,
          task.params,
        );

        untrackRequest(task.method, task.url, task.params);

        let rawList: Record<string, unknown>[] = [];
        if (Array.isArray(res)) {
          rawList = res as Record<string, unknown>[];
        } else if (res && typeof res === "object") {
          const obj = res as Record<string, unknown>;
          rawList = (obj.data ??
            obj.list ??
            obj.rows ??
            obj.items ??
            []) as Record<string, unknown>[];
        }

        const options: DictItem[] = rawList.map((item) => ({
          label: String(item[task.labelKey] ?? ""),
          value: (item[task.valueKey] ?? item) as string | number | boolean,
        }));

        results.set(task.key, options);
        cacheSet(task.url, task.params, options);
        // L2: 写入 Worker Cache
        workerCache.set(workerKey, options);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        logger.error(`Prefetch failed for ${task.url}:`, message);
        untrackRequest(task.method, task.url, task.params);
        results.set(task.key, []);
      }
    }

    isPrefetching.value = false;
    return results;
  }

  /**
   * 便捷方法：收集 schema 树中的 API 任务并执Row预取。
   *
   * @param schema - PartialWidget 树
   * @returns 预取结果 Map（key → DictItem[]）
   */
  async function prefetchSchemaOptions(
    schema: PartialWidget[],
  ): Promise<Map<string, DictItem[]>> {
    collectPrefetchTasks(schema);
    return flushPrefetchQueue();
  }

  return {
    // Status
    pendingRequests,
    requestCache,
    prefetchQueue,
    isPrefetching,
    // 计算Property
    pendingCount,
    cacheSize,
    queueLength,
    // 请求管理
    isPending,
    trackRequest,
    untrackRequest,
    cancelRequest,
    cancelAllRequests,
    // Cache
    cacheGet,
    cacheSet,
    cacheDelete,
    cacheClear,
    // 预取队Column
    collectPrefetchTasks,
    enqueuePrefetch,
    dequeuePrefetch,
    clearPrefetchQueue,
    flushPrefetchQueue,
    prefetchSchemaOptions,
  };
});
