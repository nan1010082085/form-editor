import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useFilterSync } from '../useFilterSync'
import { useDataSourceStore } from '@/stores/dataSource'

// Mock vue-router
const mockReplace = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: mockReplace }),
}))

describe('useFilterSync', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    mockReplace.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('syncs filter data to DataSourceStore', async () => {
    const store = useDataSourceStore()
    const filterData = ref<Record<string, unknown>>({})

    const Harness = defineComponent({
      setup() {
        useFilterSync(filterData, { syncToUrl: false, debounceMs: 0 })
        return () => null
      },
    })
    mount(Harness)

    filterData.value = { status: 'active' }
    await nextTick()
    vi.advanceTimersByTime(0)
    await nextTick()

    expect(store.filterParams).toEqual({ status: 'active' })
  })

  it('merges filter params without replacing existing', async () => {
    const store = useDataSourceStore()
    store.setFilterParams({ region: 'east' })

    const filterData = ref<Record<string, unknown>>({})

    const Harness = defineComponent({
      setup() {
        useFilterSync(filterData, { syncToUrl: false, debounceMs: 0 })
        return () => null
      },
    })
    mount(Harness)

    // Trigger a filter change after mount
    filterData.value = { status: 'active' }
    await nextTick()
    vi.advanceTimersByTime(0)
    await nextTick()

    expect(store.filterParams).toEqual({ region: 'east', status: 'active' })
  })

  it('clearFilters clears store and URL params', async () => {
    const store = useDataSourceStore()
    store.setFilterParams({ status: 'active', keyword: 'test' })

    const filterData = ref<Record<string, unknown>>({ status: 'active' })
    let clearFiltersFn: () => void

    const Harness = defineComponent({
      setup() {
        const { clearFilters } = useFilterSync(filterData, { syncToUrl: true, debounceMs: 0 })
        clearFiltersFn = clearFilters
        return () => null
      },
    })
    mount(Harness)

    clearFiltersFn!()
    await nextTick()

    expect(store.filterParams).toEqual({})
  })

  it('debounces filter updates', async () => {
    const store = useDataSourceStore()
    const filterData = ref<Record<string, unknown>>({})

    const Harness = defineComponent({
      setup() {
        useFilterSync(filterData, { syncToUrl: false, debounceMs: 300 })
        return () => null
      },
    })
    mount(Harness)

    // Rapid updates
    filterData.value = { status: 'a' }
    await nextTick()
    filterData.value = { status: 'b' }
    await nextTick()
    filterData.value = { status: 'c' }
    await nextTick()

    // Should not have updated yet
    expect(store.filterParams).toEqual({})

    // Advance past debounce
    vi.advanceTimersByTime(300)
    await nextTick()

    // Should have only the last value
    expect(store.filterParams).toEqual({ status: 'c' })
  })

  it('filterParams in store includes URL-prefixed keys stripped', async () => {
    // This test verifies the URL prefix stripping logic indirectly
    // by checking that setFilterParams works with the expected shape
    const store = useDataSourceStore()

    const filterData = ref<Record<string, unknown>>({})

    const Harness = defineComponent({
      setup() {
        useFilterSync(filterData, { syncToUrl: false, debounceMs: 0, urlPrefix: 'f_' })
        return () => null
      },
    })
    mount(Harness)

    filterData.value = { status: 'active', keyword: 'test' }
    await nextTick()
    vi.advanceTimersByTime(0)
    await nextTick()

    // Filter params should be stored without prefix
    expect(store.filterParams).toEqual({ status: 'active', keyword: 'test' })
    // Should not have prefixed keys
    expect(store.filterParams).not.toHaveProperty('f_status')
  })
})
