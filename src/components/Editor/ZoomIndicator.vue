<script setup lang="ts">
/**
 * ZoomIndicator — 画布缩放指示器
 *
 * 浮动在画布右下角, Show当前缩放百Min比, 支持 +/- Action和一键Reset。
 * 右侧偏移量根据 AI Drawer是否Expand动态调整。
 */
import { computed } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { useBoardStore } from "@/stores/board";
import styles from "./ZoomIndicator.module.scss";

const props = defineProps<{
  /** 右侧DrawerWidth（AI DrawerExpandHrs传入 400, 否则 0） */
  rightOffset?: number;
}>();

const boardStore = useBoardStore();
const { t } = useI18n();

const zoom = computed(() => boardStore.canvas.zoom);
const canZoomOut = computed(() => zoom.value > 50);
const canZoomIn = computed(() => zoom.value < 200);
const isDefaultZoom = computed(() => zoom.value === 100);

const containerStyle = computed(() => ({
  right: `${(props.rightOffset ?? 0) + 12}px`,
}));

function zoomIn() {
  boardStore.setZoom(zoom.value + 10);
}
function zoomOut() {
  boardStore.setZoom(zoom.value - 10);
}
function resetZoom() {
  boardStore.setZoom(100);
}
</script>

<template>
  <div :class="styles.container" :style="containerStyle">
    <button
      :class="styles.btn"
      :disabled="!canZoomOut"
      :title="t('editor.zoomIndicator.zoomOut')"
      @click="zoomOut"
    >
      -
    </button>
    <span :class="styles.value">{{ zoom }}%</span>
    <button
      :class="styles.btn"
      :disabled="!canZoomIn"
      :title="t('editor.zoomIndicator.zoomIn')"
      @click="zoomIn"
    >
      +
    </button>
    <button
      v-if="!isDefaultZoom"
      :class="styles.reset"
      :title="t('editor.zoomIndicator.resetTo100')"
      @click="resetZoom"
    >
      {{ t('editor.zoomIndicator.reset') }}
    </button>
  </div>
</template>
