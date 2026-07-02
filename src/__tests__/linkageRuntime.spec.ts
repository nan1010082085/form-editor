/**
 * E-15 linkage set-value runtime — WidgetRenderer applies targetValue to formData
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive, nextTick } from 'vue'
import { useLinkage } from '@/composables/useLinkage'
import type { PartialWidget } from '@/widgets/base/types'
import type { FormData } from '@/components/WidgetRenderer/types'

vi.mock('@/composables/useLogger', () => ({
  useLogger: vi.fn(() => ({
    warn: vi.fn(),
    info: vi.fn(),
    rule: vi.fn(),
    event: vi.fn(),
    debug: vi.fn(),
    api: vi.fn(),
  })),
}))

function collectSetValueFields(items: PartialWidget[]): Set<string> {
  const fields = new Set<string>()
  function walk(list: PartialWidget[]) {
    for (const item of list) {
      if (item.field && item.linkages?.some((l) => l.type === 'set-value')) {
        fields.add(item.field)
      }
      if (item.children?.length) walk(item.children)
    }
  }
  walk(items)
  return fields
}

/** Mirrors WidgetRenderer linkage set-value application logic */
function applyLinkageSetValues(
  schema: PartialWidget[],
  formData: FormData,
  stateMap: Map<string, { targetValue?: unknown; elseValue?: unknown }>,
): void {
  const setValueFields = collectSetValueFields(schema)
  for (const [field, state] of stateMap) {
    if (!setValueFields.has(field)) continue
    const valueToApply = state.targetValue !== undefined ? state.targetValue : state.elseValue
    if (valueToApply === undefined) continue
    formData[field] = valueToApply as FormData[string]
    const widget = schema.find((w) => w.field === field)
    if (widget) widget.defaultValue = valueToApply as PartialWidget['defaultValue']
  }
}

describe('linkageRuntime (E-15)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes targetValue into formData when set-value condition is met', async () => {
    const schema: PartialWidget[] = [
      { type: 'select', field: 'mode', label: 'Mode', options: [{ label: 'Auto', value: 'auto' }] },
      {
        type: 'input',
        field: 'result',
        label: 'Result',
        defaultValue: '',
        linkages: [{
          type: 'set-value',
          watchFields: ['mode'],
          condition: 'values.mode === "auto"',
          thenValue: 'auto-selected',
        }],
      },
    ]
    const formData = reactive<FormData>({ mode: 'auto', result: '' })
    const { stateMap } = useLinkage(schema, formData)

    applyLinkageSetValues(schema, formData, stateMap.value)
    await nextTick()

    expect(formData.result).toBe('auto-selected')
    expect(schema[1].defaultValue).toBe('auto-selected')
  })

  it('applies elseValue for set-value when condition is false', async () => {
    const schema: PartialWidget[] = [
      { type: 'select', field: 'source', label: 'Source', options: [{ label: 'A', value: 'a' }] },
      {
        type: 'input',
        field: 'target',
        label: 'Target',
        defaultValue: 'pending',
        linkages: [{
          type: 'set-value',
          watchFields: ['source'],
          condition: 'values.source === "a"',
          thenValue: 'active',
          elseValue: '',
        }],
      },
    ]
    const formData = reactive<FormData>({ source: 'b', target: 'pending' })
    const { stateMap } = useLinkage(schema, formData)

    applyLinkageSetValues(schema, formData, stateMap.value)
    await nextTick()

    expect(formData.target).toBe('')
  })

  it('copies valueSource field into target via linkage', async () => {
    const schema: PartialWidget[] = [
      { type: 'input', field: 'source', label: 'Source', defaultValue: 'hello' },
      {
        type: 'input',
        field: 'copyTo',
        label: 'Copy',
        defaultValue: '',
        linkages: [{
          type: 'set-value',
          watchFields: ['source'],
          condition: 'values.source !== ""',
          valueSource: 'source',
        }],
      },
    ]
    const formData = reactive<FormData>({ source: 'hello', copyTo: '' })
    const { stateMap } = useLinkage(schema, formData)

    applyLinkageSetValues(schema, formData, stateMap.value)
    expect(formData.copyTo).toBe('hello')

    formData.source = 'world'
    applyLinkageSetValues(schema, formData, stateMap.value)
    expect(formData.copyTo).toBe('world')
  })
})
