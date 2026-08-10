<script setup lang="ts">
/**
 * FgCarousel — Carousel Widget
 *
 * Dashboard常用, 支持自动/手动切换子Page。
 * 核心能力：
 * - 自动播放/手动切换
 * - Navigation点/箭头指示
 * - 滑动/淡入淡出过渡
 * - 悬停暂停
 * - 循环/非循环模式
 */
import { ref, computed, watch, onMounted, onUnmounted, inject } from "vue";

import { widgetDataKey } from "../base/types";
import { useExposeWidget } from "../../composables/useExposeWidget";



const widgetData = inject(widgetDataKey)!;

// ---- Props ----
const autoPlay = computed(() => (widgetData.value.props?.autoPlay as boolean) ?? true);
const interval = computed(() => (widgetData.value.props?.interval as number) ?? 3000);
const showDots = computed(() => (widgetData.value.props?.showDots as boolean) ?? true);
const showArrows = computed(() => (widgetData.value.props?.showArrows as boolean) ?? true);
const arrowPosition = computed(() => (widgetData.value.props?.arrowPosition as string) ?? "inside");
const dotPosition = computed(() => (widgetData.value.props?.dotPosition as string) ?? "bottom");
const transitionDuration = computed(() => (widgetData.value.props?.transitionDuration as number) ?? 300);
const pauseOnHover = computed(() => (widgetData.value.props?.pauseOnHover as boolean) ?? true);
const loop = computed(() => (widgetData.value.props?.loop as boolean) ?? true);
const initialIndex = computed(() => (widgetData.value.props?.initialIndex as number) ?? 0);

// ---- State ----
const activeIndex = ref(initialIndex.value);
const isHovering = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

// ---- Computed ----
const children = computed(() => widgetData.value.children ?? []);
const totalPages = computed(() => children.value.length);
const hasPages = computed(() => totalPages.value > 0);

// ---- Expose ----
useExposeWidget(() => ({
  activeIndex: activeIndex.value,
  totalPages: totalPages.value,
}));

// ---- Navigation ----
function goTo(index: number) {
  if (!hasPages.value) return;
  if (loop.value) {
    activeIndex.value = ((index % totalPages.value) + totalPages.value) % totalPages.value;
  } else {
    activeIndex.value = Math.max(0, Math.min(index, totalPages.value - 1));
  }
}

function next() {
  goTo(activeIndex.value + 1);
}

function prev() {
  goTo(activeIndex.value - 1);
}

// ---- Auto-play ----
function startAutoPlay() {
  stopAutoPlay();
  if (autoPlay.value && hasPages.value && totalPages.value > 1) {
    timer = setInterval(() => {
      if (!pauseOnHover.value || !isHovering.value) {
        next();
      }
    }, interval.value);
  }
}

function stopAutoPlay() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// ---- Lifecycle ----
onMounted(() => {
  startAutoPlay();
});

onUnmounted(() => {
  stopAutoPlay();
});

// Restart auto-play when props change
watch(
  [autoPlay, interval, hasPages],
  () => {
    startAutoPlay();
  },
);

// Handle mouse hover
function handleMouseEnter() {
  isHovering.value = true;
}

function handleMouseLeave() {
  isHovering.value = false;
}
</script>

<template>
  <div
    class="fg-carousel"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Pages -->
    <div class="fg-carousel__track">
      <div
        v-for="(child, idx) in children"
        :key="child.id"
        class="fg-carousel__page"
        :class="{ 'fg-carousel__page--active': idx === activeIndex }"
        :style="{ transition: `opacity ${transitionDuration}ms` }"
      >
        <slot name="page" :widget="child" :index="idx" />
      </div>
    </div>

    <!-- Arrows -->
    <template v-if="showArrows && hasPages && totalPages > 1">
      <button
        class="fg-carousel__arrow fg-carousel__arrow--prev"
        :class="[`fg-carousel__arrow--${arrowPosition}`]"
        @click="prev"
      >
        ‹
      </button>
      <button
        class="fg-carousel__arrow fg-carousel__arrow--next"
        :class="[`fg-carousel__arrow--${arrowPosition}`]"
        @click="next"
      >
        ›
      </button>
    </template>

    <!-- Dots -->
    <div
      v-if="showDots && hasPages && totalPages > 1"
      class="fg-carousel__dots"
      :class="[`fg-carousel__dots--${dotPosition}`]"
    >
      <button
        v-for="(_, idx) in children"
        :key="idx"
        class="fg-carousel__dot"
        :class="{ 'fg-carousel__dot--active': idx === activeIndex }"
        @click="goTo(idx)"
      />
    </div>
  </div>
</template>

<style scoped>
.fg-carousel {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fg-carousel__track {
  position: relative;
  width: 100%;
  height: 100%;
}

.fg-carousel__page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
}

.fg-carousel__page--active {
  opacity: 1;
  pointer-events: auto;
}

.fg-carousel__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 10;
}

.fg-carousel:hover .fg-carousel__arrow {
  opacity: 1;
}

.fg-carousel__arrow--inside {
  left: 12px;
}

.fg-carousel__arrow--inside.fg-carousel__arrow--next {
  left: auto;
  right: 12px;
}

.fg-carousel__arrow--outside {
  left: -48px;
}

.fg-carousel__arrow--outside.fg-carousel__arrow--next {
  left: auto;
  right: -48px;
}

.fg-carousel__dots {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.fg-carousel__dots--bottom {
  bottom: 12px;
}

.fg-carousel__dots--top {
  top: 12px;
}

.fg-carousel__dot {
  width: 8px;
  height: 8px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}

.fg-carousel__dot--active {
  background: white;
  width: 24px;
  border-radius: 4px;
}
</style>
