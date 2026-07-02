import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useWidgetAutoRefresh } from '../useWidgetAutoRefresh'

describe('useWidgetAutoRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls tick on interval when seconds > 0', async () => {
    const tick = vi.fn()
    const Harness = defineComponent({
      setup() {
        useWidgetAutoRefresh(tick, ref(2))
        return () => null
      },
    })
    mount(Harness)
    expect(tick).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2000)
    expect(tick).toHaveBeenCalledTimes(1)
  })

  it('does not arm when interval is 0', async () => {
    const tick = vi.fn()
    const Harness = defineComponent({
      setup() {
        useWidgetAutoRefresh(tick, ref(0))
        return () => null
      },
    })
    mount(Harness)
    vi.advanceTimersByTime(5000)
    expect(tick).not.toHaveBeenCalled()
  })
})
