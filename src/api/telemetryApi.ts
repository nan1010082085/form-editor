/**
 * Telemetry API - 关键行为埋点上报
 *
 * 采集编辑器关键路径行为（save/publish/delete/undo 等），上报到 server
 * `/api/telemetry/events`（批量格式）。
 *
 * 对齐 server 契约（server/src/routes/telemetry.ts + schemas/telemetrySchemas.ts）：
 * - POST /api/telemetry/events  body: { events: [{ name, properties, timestamp }] }
 * - 事件名任意字符串（1-200），properties 自由 KV，timestamp 为 finite number
 * - 批量上限 100 条/次
 *
 * 降级策略：server 端点未就绪或上报失败时静默降级，不阻塞主流程、不抛错。
 */
import { apiClient } from '@/utils/apiClient'

/** 埋点事件名（编辑器关键路径） */
export type TelemetryEvent =
  | 'save'
  | 'publish'
  | 'unpublish'
  | 'delete'
  | 'undo'
  | 'redo'
  | 'create'
  | 'copy'
  | 'import'
  | 'export'

/** 编辑器侧埋点 payload（上报前转换为 server 契约） */
export interface TelemetryPayload {
  /** 事件名 */
  event: TelemetryEvent
  /** Schema 实例 ID（可选，操作目标） */
  schemaId?: string
  /** 附加属性（如 widgetCount、mode、duration） */
  props?: Record<string, unknown>
  /** 客户端时间戳（ms epoch；未提供取 Date.now()） */
  timestamp?: number
}

/** server 单条事件契约 */
interface ServerTelemetryEvent {
  name: string
  properties: Record<string, unknown>
  timestamp: number
}

const TELEMETRY_EVENTS_ENDPOINT = '/telemetry/events'

/** 将编辑器 payload 转换为 server 事件契约 */
function toServerEvent(payload: TelemetryPayload): ServerTelemetryEvent {
  const properties: Record<string, unknown> = { ...payload.props }
  if (payload.schemaId) properties.schemaId = payload.schemaId
  return {
    name: payload.event,
    properties,
    timestamp: payload.timestamp ?? Date.now(),
  }
}

/**
 * 上报单个埋点事件。
 *
 * server `/api/telemetry/events` 要求批量格式（events 数组），单条上报包一层数组。
 * 失败时静默降级（console.debug），不抛错、不阻塞调用方。
 */
export async function reportTelemetry(
  event: TelemetryEvent,
  payload?: Omit<TelemetryPayload, 'event' | 'timestamp'>,
): Promise<void> {
  const serverEvent = toServerEvent({
    event,
    timestamp: Date.now(),
    ...payload,
  })
  try {
    await apiClient.post(TELEMETRY_EVENTS_ENDPOINT, { events: [serverEvent] })
  } catch (err) {
    // 降级：埋点失败不影响业务，仅 debug 级日志
    console.debug('[telemetry] report failed (degraded):', err)
  }
}

/**
 * 批量上报埋点事件（用于离线缓存后集中上报）。
 *
 * server 单次上限 100 条，超出分片上报。
 */
export async function reportTelemetryBatch(events: TelemetryPayload[]): Promise<void> {
  if (!events.length) return
  const serverEvents = events.map(toServerEvent)
  const BATCH_LIMIT = 100
  try {
    for (let i = 0; i < serverEvents.length; i += BATCH_LIMIT) {
      const slice = serverEvents.slice(i, i + BATCH_LIMIT)
      await apiClient.post(TELEMETRY_EVENTS_ENDPOINT, { events: slice })
    }
  } catch (err) {
    console.debug('[telemetry] batch report failed (degraded):', err)
  }
}

/**
 * 上报渲染/运行时错误到 server `/api/telemetry/errors`。
 *
 * 对齐 server 契约：body: { message, stack?, context?, timestamp? }
 * 失败时静默降级（不抛错、不阻塞）。
 */
export async function reportTelemetryError(
  message: string,
  context?: Record<string, unknown>,
  stack?: string,
): Promise<void> {
  try {
    await apiClient.post('/telemetry/errors', {
      message,
      stack: stack ?? null,
      context: context ?? {},
      timestamp: Date.now(),
    })
  } catch (err) {
    console.debug('[telemetry] error report failed (degraded):', err)
  }
}

/** 编辑器事件聚合看板返回结构（对齐 server GET /api/telemetry/editor-summary） */
export interface EditorTelemetrySummary {
  hours: number
  since: string
  totals: Record<string, number>
  totalEvents: number
  activeUsers: number
  daily: Array<{ date: string; counts: Record<string, number> }>
  topSchemas: Array<{ schemaId: string; count: number }>
}

/**
 * 拉取编辑器事件聚合看板数据。
 *
 * GET /api/telemetry/editor-summary?hours=168（默认 7 天）
 */
export async function fetchEditorTelemetrySummary(hours = 168): Promise<EditorTelemetrySummary> {
  return apiClient.get<EditorTelemetrySummary>(`/telemetry/editor-summary?hours=${hours}`)
}

