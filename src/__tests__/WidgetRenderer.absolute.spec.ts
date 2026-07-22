/**
 * WidgetRenderer absolute layout — E-25 form submit/validate aggregation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ElementPlus from 'element-plus'
import type { PartialWidget } from '@/widgets/base/types'
import WidgetRenderer from '@/components/WidgetRenderer/index.vue'
import { registerAllWidgets } from '@/widgets'

vi.mock('@/composables/useLogger', () => ({
  useLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    event: vi.fn(),
    rule: vi.fn(),
    api: vi.fn(),
    lifecycle: vi.fn(),
    child: vi.fn(),
  }),
}))

// WidgetErrorBoundary（WidgetNode 包裹层）依赖 useI18n / reportError，测试环境 mock
vi.mock('@schema-platform/platform-shared', () => ({
  useI18n: () => ({ t: (key: string) => key }),
  reportError: vi.fn(),
}))
vi.mock('@/api/telemetryApi', () => ({
  reportTelemetryError: vi.fn(),
  reportTelemetry: vi.fn(),
  reportTelemetryBatch: vi.fn(),
  fetchEditorTelemetrySummary: vi.fn(),
}))

function makeAbsoluteSchema(): PartialWidget[] {
  return [
    {
      id: 'form_main',
      name: 'FgForm',
      type: 'form',
      position: { x: 0, y: 0, w: 800, h: 400 },
      children: [
        {
          id: 'field_name',
          name: 'FgInput',
          type: 'input',
          field: 'name',
          label: '姓名',
          defaultValue: 'Alice',
          position: { x: 20, y: 20, w: 240, h: 40 },
          validationRules: [{ required: true, message: '姓名必填' }],
        },
        {
          id: 'field_age',
          name: 'FgNumber',
          type: 'number',
          field: 'age',
          label: '年龄',
          defaultValue: 30,
          position: { x: 20, y: 80, w: 240, h: 40 },
        },
      ],
    },
  ]
}

describe('WidgetRenderer absolute layout (E-25)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    registerAllWidgets()
  })

  async function mountAbsolute(schema = makeAbsoluteSchema()) {
    const wrapper = mount(WidgetRenderer, {
      props: {
        schema,
        layout: 'absolute',
      },
      global: {
        plugins: [ElementPlus],
        stubs: {
          AppIcon: { template: '<span />', props: ['name', 'size'] },
        },
      },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    return wrapper
  }

  it('getFormData collects field values from schema tree', async () => {
    const wrapper = await mountAbsolute()
    const vm = wrapper.vm as unknown as { getFormData: () => Record<string, unknown> }

    expect(vm.getFormData()).toEqual({ name: 'Alice', age: 30 })
    wrapper.unmount()
  })

  it('validate passes when required fields are filled', async () => {
    const wrapper = await mountAbsolute()
    const vm = wrapper.vm as unknown as { validate: () => Promise<boolean> }

    await expect(vm.validate()).resolves.toBe(true)
    wrapper.unmount()
  })

  it('validate rejects when required field is empty', async () => {
    const schema = makeAbsoluteSchema()
    schema[0].children![0].defaultValue = undefined
    const wrapper = await mountAbsolute(schema)
    const vm = wrapper.vm as unknown as { validate: () => Promise<boolean> }

    await expect(vm.validate()).rejects.toBeTruthy()
    wrapper.unmount()
  })

  it('submit emits aggregated form data after validation', async () => {
    const wrapper = await mountAbsolute()
    const vm = wrapper.vm as unknown as { submit: () => Promise<void> }

    await vm.submit()
    await flushPromises()

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({ name: 'Alice', age: 30 })
    wrapper.unmount()
  })

  it('setFormData updates schema defaultValue and getFormData reflects changes', async () => {
    const wrapper = await mountAbsolute()
    const vm = wrapper.vm as unknown as {
      setFormData: (data: Record<string, unknown>) => void
      getFormData: () => Record<string, unknown>
    }

    vm.setFormData({ name: 'Bob', age: 25 })
    await nextTick()

    expect(vm.getFormData()).toEqual({ name: 'Bob', age: 25 })
    wrapper.unmount()
  })
})
