import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import ElementPlus from 'element-plus'
import { useWidgetStore } from '@/stores/widget'
import { registerAllWidgets } from '@/widgets/index'
import { createWidget } from '@/widgets/registry'
import { computeWidgetRenderState } from '@/__tests__/widgetTestHarness'
import { widgetDataKey, widgetStyleKey } from '../../base/types'

// Mock useI18n
vi.mock('@schema-platform/platform-shared', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('../../base/echarts', () => ({
  echarts: {
    init: vi.fn(() => ({
      setOption: vi.fn(),
      resize: vi.fn(),
      dispose: vi.fn(),
      off: vi.fn(),
      on: vi.fn(),
    })),
    registerMap: vi.fn(),
  },
}))

vi.mock('../../../components/WidgetRenderer/WidgetStateShell.vue', () => ({
  default: {
    name: 'WidgetStateShell',
    template: '<div><slot /></div>',
    props: ['loading', 'error', 'empty', 'skeleton'],
  },
}))

import FgMap from '../FgMap.vue'

describe('FgMap', () => {
  let store: ReturnType<typeof useWidgetStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    registerAllWidgets()
    store = useWidgetStore()
  })

  function mountChart(overrides: Record<string, unknown> = {}) {
    const widget = createWidget('map', 'test_map')!
    Object.assign(widget, overrides)
    store.addWidget(widget)

    return mount(FgMap, {
      global: {
        plugins: [ElementPlus],
        provide: {
          [widgetDataKey as symbol]: computed(() => store.findWidget('test_map')!),
          [widgetStyleKey as symbol]: computed(() => store.findWidget('test_map')!.style ?? {}),
        },
      },
    })
  }

  // Dimension 1: Drag & Drop
  describe('拖放', () => {
    it('创建后 store 中存在', () => {
      const widget = createWidget('map', 'test_map')
      store.addWidget(widget!)
      expect(store.findWidget('test_map')).toBeDefined()
    })

    it('拖入 card 容器', () => {
      const widget = createWidget('map', 'test_map')
      const card = createWidget('card', 'test_card')
      store.addWidget(card!)
      store.addWidget(widget!)
      store.addToContainer('test_map', 'test_card')
      expect(store.findWidget('test_card')!.children).toHaveLength(1)
    })

    it('从容器拖出', () => {
      const widget = createWidget('map', 'test_map')
      const card = createWidget('card', 'test_card')
      store.addWidget(card!)
      store.addWidget(widget!)
      store.addToContainer('test_map', 'test_card')
      store.removeFromContainer('test_map')
      expect(store.isRootWidget('test_map')).toBe(true)
    })
  })

  // Dimension 2: Properties
  describe('属性', () => {
    it('默认 mapType 为 china', () => {
      const widget = createWidget('map', 'test_map')!
      expect(widget.props?.mapType).toBe('china')
    })

    it('默认 staticData 有 34 条省份数据', () => {
      const widget = createWidget('map', 'test_map')!
      expect(widget.props?.staticData).toHaveLength(34)
    })

    it('默认 showLabel 为 true', () => {
      const widget = createWidget('map', 'test_map')!
      expect(widget.props?.showLabel).toBe(true)
    })

    it('默认 showScatter 为 false', () => {
      const widget = createWidget('map', 'test_map')!
      expect(widget.props?.showScatter).toBe(false)
    })

    it('默认 roam 为 true', () => {
      const widget = createWidget('map', 'test_map')!
      expect(widget.props?.roam).toBe(true)
    })

    it('props 可覆盖', () => {
      const widget = createWidget('map', 'test_map')!
      store.addWidget(widget)
      store.updateWidget('test_map', { props: { mapType: 'world', showLabel: false } })
      const found = store.findWidget('test_map')!
      expect(found.props?.mapType).toBe('world')
      expect(found.props?.showLabel).toBe(false)
    })
  })

  // Dimension 3: Events
  describe('事件', () => {
    it('支持 chart-click 事件目标', () => {
      const widget = createWidget('map', 'test_map')!
      widget.events = [{ trigger: 'chart-click', actions: [{ type: 'show', target: 'w2' }] }]
      store.addWidget(widget)
      expect(store.findWidget('test_map')!.events).toHaveLength(1)
    })

    it('支持 refresh 事件配置', () => {
      const widget = createWidget('map', 'test_map')!
      widget.events = [{ trigger: 'refresh', actions: [{ type: 'show', target: 'w2' }] }]
      store.addWidget(widget)
      expect(store.findWidget('test_map')!.events).toHaveLength(1)
    })
  })

  // Dimension 4: Rules
  describe('规则', () => {
    it('visible=false 隐藏', () => {
      const widget = createWidget('map', 'test_map')!
      widget.rules = [{
        watches: [{ type: 'field', source: 'status' }],
        condition: 'status === "hide"',
        actions: [{ type: 'hide', config: {} }],
      }]
      store.addWidget(widget)
      const state = computeWidgetRenderState(widget, { status: 'hide' })
      expect(state.visible).toBe(false)
    })

    it('disabled=true 禁用', () => {
      const widget = createWidget('map', 'test_map')!
      widget.rules = [{
        watches: [{ type: 'field', source: 'lock' }],
        condition: 'lock === true',
        actions: [{ type: 'disabled', config: {} }],
      }]
      store.addWidget(widget)
      const state = computeWidgetRenderState(widget, { lock: true })
      expect(state.disabled).toBe(true)
    })
  })

  // Dimension 5: Datasource
  describe('数据源', () => {
    it('支持 api 配置', () => {
      const widget = createWidget('map', 'test_map')!
      widget.api = { url: '/api/map-data', method: 'get' }
      store.addWidget(widget)
      expect(store.findWidget('test_map')!.api!.url).toBe('/api/map-data')
    })
  })

  // Dimension 6: Component mount
  describe('组件挂载', () => {
    it('挂载不抛异常', () => {
      const wrapper = mountChart()
      expect(wrapper.find('div').exists()).toBe(true)
    })
  })
})
