/**
 * DataSource — 全局数据源类型定义
 *
 * 集中管理 API 数据源，支持 HTTP 轮询和 WebSocket 推送。
 * Widget 通过 dataSourceId 引用，而非各自内联 api 配置。
 */

/** 数据源传输方式 */
export type DataSourceTransport = 'http-poll' | 'websocket' | 'static'

/** 数据源定义 — 存储在 schema 根级别，widget 通过 ID 引用 */
export interface DataSourceDefinition {
  /** 唯一 ID（创建时生成，随 schema 持久化） */
  id: string
  /** 设计器中显示的名称 */
  name: string
  /** 传输方式 */
  transport: DataSourceTransport
  /** HTTP 配置（http-poll 模式） */
  http?: {
    url: string
    method: 'get' | 'post'
    params?: Record<string, unknown>
    headers?: Record<string, string>
    body?: Record<string, unknown>
    timeout?: number
    dataPath?: string
    /** 轮询间隔（秒），0 = 不轮询（一次性请求） */
    pollIntervalSec: number
  }
  /** WebSocket 配置（websocket 模式） */
  websocket?: {
    url: string
    auth?: Record<string, string>
    dataPath?: string
    reconnect: { maxRetries: number; delayMs: number }
  }
  /** 响应字段映射 */
  mapping: {
    labelKey: string
    valueKey: string
    childrenKey?: string
  }
  /** 缓存策略 */
  cache: {
    level: 'memory' | 'indexeddb' | 'both'
    ttlMs: number
  }
  /** 重试配置 */
  retry?: {
    enabled: boolean
    maxRetries: number
  }
}

/** 数据源运行时状态 */
export interface DataSourceState<T = unknown> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: number
  subscriberCount: number
}
