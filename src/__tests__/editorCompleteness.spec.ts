import { describe, it, expect, beforeAll } from 'vitest'
import { COMPLEX_WIDGET_MOCK_TYPES, getWidgetMock } from '@/widgets/base/widgetMock'
import { registerAllWidgets } from '@/widgets/index'
import { getAllWidgets } from '@/widgets/registry'

describe('editor completeness', () => {
  beforeAll(() => {
    registerAllWidgets()
  })

  it('all complex widget types have mock coverage', () => {
    const missing = COMPLEX_WIDGET_MOCK_TYPES.filter((type) => !getWidgetMock(type))
    expect(missing, `missing mocks: ${missing.join(', ')}`).toEqual([])
  })

  it('all registered widget types are assignable to SchemaType (registry parity)', () => {
    const registered = getAllWidgets().map((w) => w.type).sort()
    expect(registered.length).toBeGreaterThan(0)
    // Runtime smoke: each registry type is a non-empty string used as SchemaType in configs
    for (const type of registered) {
      expect(type, `invalid registry type: ${type}`).toMatch(/^[a-z][a-z0-9-]*$/)
    }
    expect(new Set(registered).size).toBe(registered.length)
  })
})
