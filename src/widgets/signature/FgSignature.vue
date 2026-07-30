<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted } from "vue";
import { widgetDataKey } from "../base/types";
import { useWidgetRenderState } from "../../composables/useWidgetRenderState";
import { useExposeWidget } from "../../composables/useExposeWidget";

const widgetData = inject(widgetDataKey)!;
const { isDisabled } = useWidgetRenderState();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isEmpty = ref(true);
let ctx: CanvasRenderingContext2D | null = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

const penWidth = computed(() => (widgetData.value.props?.penWidth as number) ?? 2);
const penColor = computed(() => (widgetData.value.props?.penColor as string) ?? "#000000");
const backgroundColor = computed(() => (widgetData.value.props?.backgroundColor as string) ?? "#ffffff");
const showClear = computed(() => (widgetData.value.props?.showClear as boolean) ?? true);
const clearText = computed(() => (widgetData.value.props?.clearText as string) ?? "Clear");
const placeholder = computed(() => (widgetData.value.props?.placeholder as string) ?? "Sign here");
const outputFormat = computed(() => (widgetData.value.props?.outputFormat as string) ?? "png");

function initCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = backgroundColor.value;
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function getPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
  const canvas = canvasRef.value!;
  const rect = canvas.getBoundingClientRect();
  const point = "touches" in e ? e.touches[0] : e;
  return { x: point.clientX - rect.left, y: point.clientY - rect.top };
}

function startDraw(e: MouseEvent | TouchEvent) {
  if (isDisabled) return;
  isDrawing = true;
  isEmpty.value = false;
  const pos = getPos(e);
  lastX = pos.x;
  lastY = pos.y;
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing || !ctx) return;
  e.preventDefault();
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(pos.x, pos.y);
  ctx.strokeStyle = penColor.value;
  ctx.lineWidth = penWidth.value;
  ctx.stroke();
  lastX = pos.x;
  lastY = pos.y;
}

function endDraw() {
  isDrawing = false;
}

function clearCanvas() {
  if (!ctx || !canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  ctx.fillStyle = backgroundColor.value;
  ctx.fillRect(0, 0, rect.width, rect.height);
  isEmpty.value = true;
}

function getDataUrl(): string {
  if (!canvasRef.value) return "";
  const mime = outputFormat.value === "jpg" ? "image/jpeg" : "image/png";
  return canvasRef.value.toDataURL(mime);
}

useExposeWidget((wd) => ({
  get value() {
    return getDataUrl();
  },
  get isEmpty() {
    return isEmpty.value;
  },
  clear: clearCanvas,
}));

onMounted(() => {
  initCanvas();
});

onUnmounted(() => {
  ctx = null;
});
</script>

<template>
  <div :class="$style.wrapper" :style="{ height: widgetData.style?.height || '200px' }">
    <div :class="$style.canvasWrap">
      <canvas
        ref="canvasRef"
        :class="$style.canvas"
        :style="{ backgroundColor: backgroundColor }"
        @mousedown="startDraw"
        @mousemove="draw"
        @mouseup="endDraw"
        @mouseleave="endDraw"
        @touchstart.passive="startDraw"
        @touchmove="draw"
        @touchend="endDraw"
      />
      <div v-if="isEmpty" :class="$style.placeholder">
        {{ placeholder }}
      </div>
    </div>
    <button
      v-if="showClear && !isEmpty"
      :class="$style.clearBtn"
      type="button"
      @click="clearCanvas"
    >
      {{ clearText }}
    </button>
  </div>
</template>

<style module lang="scss">
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.canvasWrap {
  position: relative;
  flex: 1;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 6px;
  overflow: hidden;
}
.canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}
.placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  color: var(--el-text-color-placeholder, #c0c4cc);
  font-size: 14px;
}
.clearBtn {
  align-self: flex-end;
  padding: 4px 12px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 13px;
  cursor: pointer;
  &:hover {
    border-color: var(--el-color-primary, #409eff);
    color: var(--el-color-primary, #409eff);
  }
}
</style>
