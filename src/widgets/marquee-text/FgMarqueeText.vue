<script setup lang="ts">
/**
 * FgMarqueeText — 跑马灯/滚动公告
 *
 * 水平滚动文本，支持数据源驱动和自定义速度。
 */
import { inject, ref, computed, onMounted, onUnmounted } from 'vue'
import { widgetDataKey, widgetStyleKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey, ref({}))

const text = computed(() => (widgetData.value.props?.text as string) ?? '这是一条滚动公告')
const speed = computed(() => (widgetData.value.props?.speed as number) ?? 50)
const direction = computed(() => (widgetData.value.props?.direction as string) ?? 'left')
const pauseOnHover = computed(() => widgetData.value.props?.pauseOnHover !== false)
const loop = computed(() => widgetData.value.props?.loop !== false)

const isPaused = ref(false)
const containerRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

function handleMouseEnter() {
  if (pauseOnHover.value) isPaused.value = true
}

function handleMouseLeave() {
  isPaused.value = false
}

const animationStyle = computed(() => {
  const duration = Math.max(5, text.value.length / (speed.value / 10))
  return {
    animationDuration: `${duration}s`,
    animationDirection: direction.value === 'right' ? 'reverse' : 'normal',
    animationIterationCount: loop.value ? 'infinite' : '1',
    animationPlayState: isPaused.value ? 'paused' : 'running',
  }
})

useExposeWidget(() => ({
  pause() { isPaused.value = true },
  resume() { isPaused.value = false },
}))
</script>

<template>
  <div
    ref="containerRef"
    :class="styles.marquee"
    :style="widgetStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div ref="contentRef" :class="styles.content" :style="animationStyle">
      <span :class="styles.text">{{ text }}</span>
      <span :class="styles.text">{{ text }}</span>
    </div>
  </div>
</template>
