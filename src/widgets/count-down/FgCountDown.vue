<script setup lang="ts">
/**
 * FgCountDown — Countdown器 Widget
 *
 * 支持目标Hrs间或Hrs长Countdown, Dashboard常用。
 * 核心能力：
 * - 目标Hrs间（ISO 8601 或 Unix Hrs间戳）或 Hrs长（sec数）
 * - 可ConfigShow格式（HH:mm:ss / DD:HH:mm:ss / mm:ss 等）
 * - Countdown结束Event
 * - 暴露 remaining/finished/days/hours/minutes/seconds 供Linkage
 */
import { ref, computed, watch, onMounted, onUnmounted, inject } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { widgetDataKey } from "../base/types";

import { useExposeWidget } from "../../composables/useExposeWidget";

const { t } = useI18n();

const widgetData = inject(widgetDataKey)!;

// ---- Props ----
const targetTime = computed(() => widgetData.value.props?.targetTime as string ?? "");
const duration = computed(() => widgetData.value.props?.duration as number ?? 0);
const format = computed(() => widgetData.value.props?.format as string ?? "HH:mm:ss");
const autoStart = computed(() => (widgetData.value.props?.autoStart as boolean) ?? true);
const showLabels = computed(() => (widgetData.value.props?.showLabels as boolean) ?? true);
const labelDay = computed(() => (widgetData.value.props?.labelDay as string) ?? t("editor.countDown.labelDay"));
const labelHour = computed(() => (widgetData.value.props?.labelHour as string) ?? t("editor.countDown.labelHour"));
const labelMinute = computed(() => (widgetData.value.props?.labelMinute as string) ?? t("editor.countDown.labelMinute"));
const labelSecond = computed(() => (widgetData.value.props?.labelSecond as string) ?? t("editor.countDown.labelSecond"));
const digitFontSize = computed(() => (widgetData.value.props?.digitFontSize as string) ?? "36px");
const labelFontSize = computed(() => (widgetData.value.props?.labelFontSize as string) ?? "12px");
const digitColor = computed(() => (widgetData.value.props?.digitColor as string) ?? "#303133");
const labelColor = computed(() => (widgetData.value.props?.labelColor as string) ?? "#909399");
const separator = computed(() => (widgetData.value.props?.separator as string) ?? ":");
const finishText = computed(() => (widgetData.value.props?.finishText as string) ?? "");

// ---- State ----
const remaining = ref(0);
const isRunning = ref(false);
const isFinished = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

// ---- Computed ----
const days = computed(() => Math.floor(remaining.value / 86400));
const hours = computed(() => Math.floor((remaining.value % 86400) / 3600));
const minutes = computed(() => Math.floor((remaining.value % 3600) / 60));
const seconds = computed(() => remaining.value % 60);

const pad = (n: number, len = 2) => String(n).padStart(len, "0");



const displayGroups = computed(() => {
  if (isFinished.value && finishText.value) return [];

  const d = days.value;
  const h = hours.value;
  const m = minutes.value;
  const s = seconds.value;

  switch (format.value) {
    case "DD:HH:mm:ss":
      return [
        { value: pad(d), label: labelDay.value },
        { value: pad(h), label: labelHour.value },
        { value: pad(m), label: labelMinute.value },
        { value: pad(s), label: labelSecond.value },
      ];
    case "HH:mm:ss":
      return [
        { value: pad(d * 24 + h), label: labelHour.value },
        { value: pad(m), label: labelMinute.value },
        { value: pad(s), label: labelSecond.value },
      ];
    case "HH:mm":
      return [
        { value: pad(d * 24 + h), label: labelHour.value },
        { value: pad(m), label: labelMinute.value },
      ];
    case "mm:ss":
      return [
        { value: pad(d * 1440 + h * 60 + m), label: labelMinute.value },
        { value: pad(s), label: labelSecond.value },
      ];
    case "total-seconds":
      return [{ value: String(remaining.value), label: "" }];
    default:
      return [
        { value: pad(d * 24 + h), label: labelHour.value },
        { value: pad(m), label: labelMinute.value },
        { value: pad(s), label: labelSecond.value },
      ];
  }
});

// ---- Expose ----
useExposeWidget(() => ({
  remaining: remaining.value,
  finished: isFinished.value,
  days: days.value,
  hours: hours.value,
  minutes: minutes.value,
  seconds: seconds.value,
}));

// ---- Logic ----
function initRemaining() {
  if (targetTime.value) {
    const target = new Date(targetTime.value).getTime();
    const now = Date.now();
    remaining.value = Math.max(0, Math.floor((target - now) / 1000));
  } else {
    remaining.value = Math.max(0, duration.value);
  }
}

function start() {
  if (isRunning.value || isFinished.value) return;
  isRunning.value = true;
  timer = setInterval(() => {
    if (remaining.value <= 0) {
      stop();
      isFinished.value = true;
      return;
    }
    remaining.value--;
  }, 1000);
}

function stop() {
  isRunning.value = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function reset() {
  stop();
  isFinished.value = false;
  initRemaining();
}

// ---- Lifecycle ----
onMounted(() => {
  initRemaining();
  if (autoStart.value && remaining.value > 0) {
    start();
  }
});

onUnmounted(() => {
  stop();
});

// React to prop changes
watch(
  () => [targetTime.value, duration.value],
  () => {
    reset();
    if (autoStart.value && remaining.value > 0) {
      start();
    }
  },
);
</script>

<template>
  <div class="fg-count-down">
    <template v-if="isFinished && finishText">
      <div class="fg-count-down__finish" :style="{ fontSize: digitFontSize, color: digitColor }">
        {{ finishText }}
      </div>
    </template>
    <template v-else>
      <div class="fg-count-down__groups">
        <div
          v-for="(group, idx) in displayGroups"
          :key="idx"
          class="fg-count-down__group"
        >
          <span
            class="fg-count-down__digit"
            :style="{ fontSize: digitFontSize, color: digitColor }"
          >
            {{ group.value }}
          </span>
          <span
            v-if="showLabels && group.label"
            class="fg-count-down__label"
            :style="{ fontSize: labelFontSize, color: labelColor }"
          >
            {{ group.label }}
          </span>
          <span
            v-if="idx < displayGroups.length - 1"
            class="fg-count-down__separator"
            :style="{ fontSize: digitFontSize, color: digitColor }"
          >
            {{ separator }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style module>
.fg-count-down {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.fg-count-down__groups {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fg-count-down__group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.fg-count-down__digit {
  font-variant-numeric: tabular-nums;
  font-weight: bold;
  line-height: 1;
}

.fg-count-down__label {
  line-height: 1;
  opacity: 0.7;
}

.fg-count-down__separator {
  line-height: 1;
  margin: 0 2px;
}

.fg-count-down__finish {
  font-weight: bold;
  line-height: 1;
}
</style>
