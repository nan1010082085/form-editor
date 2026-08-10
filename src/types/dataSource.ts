/**
 * DataSource — 全局Data源Type定义
 *
 * 集中管理 API Data源, 支持 HTTP 轮询和 WebSocket 推送。
 * Widget passed dataSourceId 引用, 而非各自内联 api Config。
 */

/** Data源传输方式 */
export type DataSourceTransport = "http-poll" | "websocket" | "static";

/** Data源定义 — 存储在 schema 根Level, widget passed ID 引用 */
export interface DataSourceDefinition {
  /** 唯一 ID（创建Hrs生成, 随 schema 持久化） */
  id: string;
  /** 设计器中Show的Name */
  name: string;
  /** 传输方式 */
  transport: DataSourceTransport;
  /** HTTP Config（http-poll 模式） */
  http?: {
    url: string;
    method: "get" | "post";
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
    timeout?: number;
    dataPath?: string;
    /** 轮询间隔（sec）, 0 = 不轮询（一次性请求） */
    pollIntervalSec: number;
  };
  /** WebSocket Config（websocket 模式） */
  websocket?: {
    url: string;
    auth?: Record<string, string>;
    dataPath?: string;
    reconnect: { maxRetries: number; delayMs: number };
  };
  /** 响应FieldMap */
  mapping: {
    labelKey: string;
    valueKey: string;
    childrenKey?: string;
  };
  /** Cache策略 */
  cache: {
    level: "memory" | "indexeddb" | "both";
    ttlMs: number;
  };
  /** RetryConfig */
  retry?: {
    enabled: boolean;
    maxRetries: number;
  };
}

/** Data源运RowHrsStatus */
export interface DataSourceState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  subscriberCount: number;
}
