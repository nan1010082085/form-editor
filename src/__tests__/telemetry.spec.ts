/**
 * Telemetry API & composable tests
 *
 * 验证（对齐 server /api/telemetry/events 批量契约）：
 * 1. reportTelemetry 调用 apiClient.post 上报到 /telemetry/events，body 为 { events: [{ name, properties, timestamp }] }
 * 2. 上报失败时静默降级（不抛错）
 * 3. useTelemetry.track / trackSchema 正确封装
 * 4. reportTelemetryBatch 分片（>100 条分多次）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock apiClient
const mockPost = vi.fn()
vi.mock('@/utils/apiClient', () => ({
  apiClient: { post: (...args: unknown[]) => mockPost(...args) },
}))

import { reportTelemetry, reportTelemetryBatch } from '@/api/telemetryApi'
import { useTelemetry } from '@/composables/useTelemetry'

describe('telemetryApi', () => {
  beforeEach(() => {
    mockPost.mockReset()
    mockPost.mockResolvedValue({})
  })

  it('reportTelemetry 上报到 /telemetry/events 并转换为 server 批量契约', async () => {
    await reportTelemetry('save', { schemaId: 's1', props: { widgetCount: 10 } })
    expect(mockPost).toHaveBeenCalledTimes(1)
    const [path, body] = mockPost.mock.calls[0]
    expect(path).toBe('/telemetry/events')
    expect(body).toEqual({
      events: [
        {
          name: 'save',
          properties: { widgetCount: 10, schemaId: 's1' },
          timestamp: expect.any(Number),
        },
      ],
    })
  })

  it('reportTelemetry 无 schemaId 时 properties 不含 schemaId', async () => {
    await reportTelemetry('undo')
    const [, body] = mockPost.mock.calls[0]
    expect(body.events[0].name).toBe('undo')
    expect(body.events[0].properties).toEqual({})
  })

  it('reportTelemetry 上报失败时静默降级不抛错', async () => {
    mockPost.mockRejectedValue(new Error('404 not found'))
    await expect(reportTelemetry('undo')).resolves.toBeUndefined()
  })

  it('reportTelemetryBatch 批量上报转换契约', async () => {
    const events = [
      { event: 'save' as const, timestamp: 1753372800000 },
      { event: 'publish' as const, timestamp: 1753372801000, schemaId: 's1' },
    ]
    await reportTelemetryBatch(events)
    expect(mockPost).toHaveBeenCalledTimes(1)
    const [path, body] = mockPost.mock.calls[0]
    expect(path).toBe('/telemetry/events')
    expect(body.events).toEqual([
      { name: 'save', properties: {}, timestamp: 1753372800000 },
      { name: 'publish', properties: { schemaId: 's1' }, timestamp: 1753372801000 },
    ])
  })

  it('reportTelemetryBatch 空数组不调用', async () => {
    await reportTelemetryBatch([])
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('reportTelemetryBatch 超过 100 条分片上报', async () => {
    const events = Array.from({ length: 150 }, (_, i) => ({
      event: 'save' as const,
      timestamp: 1753372800000 + i,
    }))
    await reportTelemetryBatch(events)
    expect(mockPost).toHaveBeenCalledTimes(2)
    const firstBatch = mockPost.mock.calls[0][1].events
    const secondBatch = mockPost.mock.calls[1][1].events
    expect(firstBatch).toHaveLength(100)
    expect(secondBatch).toHaveLength(50)
  })
})

describe('useTelemetry', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockPost.mockReset()
    mockPost.mockResolvedValue({})
  })

  it('track 触发上报（fire-and-forget）', () => {
    const { track } = useTelemetry()
    track('delete', { widgetCount: 3 })
    expect(mockPost).toHaveBeenCalledTimes(1)
    const [path, body] = mockPost.mock.calls[0]
    expect(path).toBe('/telemetry/events')
    expect(body.events[0]).toEqual({
      name: 'delete',
      properties: { widgetCount: 3 },
      timestamp: expect.any(Number),
    })
  })

  it('trackSchema 携带 schemaId（写入 properties）', () => {
    const { trackSchema } = useTelemetry()
    trackSchema('publish', 'schema-123')
    const [, body] = mockPost.mock.calls[0]
    expect(body.events[0].name).toBe('publish')
    expect(body.events[0].properties.schemaId).toBe('schema-123')
  })
})
