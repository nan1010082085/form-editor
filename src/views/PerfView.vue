<script setup lang="ts">
/**
 * PerfView - 真实浏览器 FPS 压测页
 *
 * 挂载 100+ widget 的大屏种子，用 requestAnimationFrame 测量：
 * - 挂载耗时（mount -> first paint）
 * - 持续 FPS（5 秒采样）
 * - 最长帧 / 平均帧
 * - JS 堆内存（若可用）
 *
 * 路由 meta.public=true，无需登录；仅 dev/性能演练用。
 */
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { createPinia } from 'pinia'
import { WidgetRenderer } from '@/components/WidgetRenderer'
import { registerAllWidgets } from '@/widgets'
import { seedStressDashboard } from '@/utils/seedStressDashboard'
import FgAdvancedTableVirtual from '@/widgets/advanced-table/FgAdvancedTableVirtual.vue'
import type { Widget } from '@/widgets/base/types'
import type { AdvancedTableColumn } from '@/widgets/advanced-table/config'

registerAllWidgets()

const pinia = createPinia()

const widgetCount = ref(120)
const schema = ref<Widget[]>([])
const canvasWidth = ref(1920)
const canvasHeight = ref(1200)
const mountMs = ref<number | null>(null)
const avgFps = ref<number | null>(null)
const minFps = ref<number | null>(null)
const maxFrameMs = ref<number | null>(null)
const jsHeapMb = ref<number | null>(null)
const running = ref(false)

const canvasRef = ref<HTMLElement | null>(null)
const rendererKey = ref(0)

// ---- 虚拟表格压测 ----
const showVirtualTable = ref(false)
const virtualRowCount = ref(10000)
const virtualMountMs = ref<number | null>(null)
const virtualTableKey = ref(0)
const virtualColumns: AdvancedTableColumn[] = [
  { prop: 'id', label: 'ID', width: 80, render: 'text' },
  { prop: 'name', label: '名称', minWidth: 150, render: 'text' },
  { prop: 'status', label: '状态', width: 100, render: 'tag', colorMap: { active: 'success', inactive: 'info' }, options: [{ label: '启用', value: 'active' }, { label: '禁用', value: 'inactive' }] },
  { prop: 'amount', label: '金额', width: 120, render: 'text' },
  { prop: 'action', label: '操作', width: 120, render: 'buttons', buttons: [{ key: 'view', label: '查看' }] },
]
const virtualTableData = ref<Record<string, unknown>[]>([])

function buildVirtualData(count: number) {
  virtualTableData.value = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `项目 ${i + 1}`,
    status: i % 3 === 0 ? 'active' : 'inactive',
    amount: Math.round(Math.random() * 10000),
    action: '',
  }))
}

async function runVirtualTable() {
  showVirtualTable.value = true
  buildVirtualData(virtualRowCount.value)
  virtualTableKey.value++
  virtualMountMs.value = null
  const start = performance.now()
  await nextTick()
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  virtualMountMs.value = Math.round(performance.now() - start)
}

function build(count: number) {
  const { widgets, canvas } = seedStressDashboard(count)
  schema.value = widgets
  canvasWidth.value = canvas.width
  canvasHeight.value = canvas.height
}

async function run() {
  running.value = true
  build(widgetCount.value)
  rendererKey.value++
  mountMs.value = null
  avgFps.value = null
  minFps.value = null
  maxFrameMs.value = null

  const mountStart = performance.now()
  await nextTick()
  // 等两帧让 ECharts 完成首屏
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  mountMs.value = performance.now() - mountStart

  // 5 秒 FPS 采样
  const frames: number[] = []
  let lastTs = performance.now()
  let maxFrame = 0
  const sampleDuration = 5000
  const sampleStart = performance.now()

  await new Promise<void>(resolve => {
    function loop(ts: number) {
      const delta = ts - lastTs
      lastTs = ts
      if (delta > 0) {
        frames.push(1000 / delta)
        if (delta > maxFrame) maxFrame = delta
      }
      if (ts - sampleStart < sampleDuration) {
        requestAnimationFrame(loop)
      } else {
        resolve()
      }
    }
    requestAnimationFrame(loop)
  })

  if (frames.length > 0) {
    avgFps.value = Math.round(frames.reduce((a, b) => a + b, 0) / frames.length)
    minFps.value = Math.round(Math.min(...frames))
  }
  maxFrameMs.value = Math.round(maxFrame)

  // @ts-expect-error performance.memory 仅 Chrome
  if (performance.memory) {
    // @ts-expect-error performance.memory 仅 Chrome
    jsHeapMb.value = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
  }

  running.value = false
}

onMounted(() => {
  // 默认不自动跑，等点按钮
})

onBeforeUnmount(() => {
  running.value = false
})
</script>

<template>
  <div style="background:#0a1628; min-height:100vh; color:#e8eaed; font-family: sans-serif;">
    <div style="padding:16px; position:sticky; top:0; background:#0a1628; z-index:10; border-bottom:1px solid #1f3a5f;">
      <h2 style="margin:0 0 8px;">Editor 性能压测 / FPS Walkthrough</h2>
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <label>Widget 数量:
          <input v-model.number="widgetCount" type="number" min="20" max="500" step="10"
            style="background:#1a2a40; color:#e8eaed; border:1px solid #3a5a80; padding:4px 8px; border-radius:4px; width:90px;" />
        </label>
        <button @click="run" :disabled="running"
          style="background:#409eff; color:#fff; border:none; padding:6px 16px; border-radius:4px; cursor:pointer;">
          {{ running ? '压测中...' : '开始压测' }}
        </button>
        <span v-if="mountMs !== null">挂载: <b>{{ mountMs.toFixed(0) }}ms</b></span>
        <span v-if="avgFps !== null">平均 FPS: <b>{{ avgFps }}</b></span>
        <span v-if="minFps !== null">最低 FPS: <b>{{ minFps }}</b></span>
        <span v-if="maxFrameMs !== null">最长帧: <b>{{ maxFrameMs }}ms</b></span>
        <span v-if="jsHeapMb !== null">JS 堆: <b>{{ jsHeapMb }}MB</b></span>
      </div>
    </div>

    <div ref="canvasRef" style="position:relative; overflow:auto;">
      <div :style="{ position:'relative', width: canvasWidth+'px', height: canvasHeight+'px' }">
        <WidgetRenderer v-if="schema.length" :key="rendererKey" :schema="schema" layout="absolute" />
      </div>
    </div>

    <!-- 虚拟表格压测 -->
    <div style="padding:16px; border-top:1px solid #1f3a5f;">
      <h3 style="margin:0 0 8px;">虚拟表格压测（el-table-v2）</h3>
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:12px;">
        <label>行数:
          <input v-model.number="virtualRowCount" type="number" min="100" max="100000" step="1000"
            style="background:#1a2a40; color:#e8eaed; border:1px solid #3a5a80; padding:4px 8px; border-radius:4px; width:100px;" />
        </label>
        <button @click="runVirtualTable"
          style="background:#67c23a; color:#fff; border:none; padding:6px 16px; border-radius:4px; cursor:pointer;">
          渲染虚拟表格
        </button>
        <span v-if="virtualMountMs !== null">挂载: <b>{{ virtualMountMs }}ms</b>（{{ virtualRowCount }} 行）</span>
      </div>
      <div v-if="showVirtualTable" style="background:#fff; border-radius:6px; padding:8px;">
        <FgAdvancedTableVirtual :key="virtualTableKey" :columns="virtualColumns" :data="virtualTableData" :height="500" />
      </div>
    </div>
  </div>
</template>
