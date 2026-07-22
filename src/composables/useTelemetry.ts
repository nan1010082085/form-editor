/**
 * useTelemetry - 编辑器关键行为埋点 composable
 *
 * 在 save/publish/delete/undo/redo/create/copy/import/export 等关键路径调用，
 * 上报到 server `/telemetry`（见 docs/iteration-evolution.md E-07）。
 *
 * 设计：
 * - 非阻塞：reportTelemetry 内部已降级，调用方无需 await / try-catch
 * - 轻量：仅采集事件名 + schemaId + 少量属性，不采集敏感数据
 * - 幂等：server 端点未就绪时静默降级，不影响业务
 */
import { reportTelemetry, type TelemetryEvent } from '@/api/telemetryApi'

export function useTelemetry() {
  /** 记录一次关键行为（fire-and-forget） */
  function track(event: TelemetryEvent, props?: Record<string, unknown>): void {
    void reportTelemetry(event, { props })
  }

  /** 记录带 schemaId 的关键行为 */
  function trackSchema(event: TelemetryEvent, schemaId: string, props?: Record<string, unknown>): void {
    void reportTelemetry(event, { schemaId, props })
  }

  return { track, trackSchema }
}
