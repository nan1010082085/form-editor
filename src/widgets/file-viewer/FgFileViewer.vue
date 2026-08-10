<script setup lang="ts">
import { computed, inject } from "vue";
import { widgetDataKey } from "../base/types";
import { useExposeWidget } from "../../composables/useExposeWidget";

const widgetData = inject(widgetDataKey)!;

const url = computed(() => (widgetData.value.props?.url as string) ?? "");
const fileType = computed(() => (widgetData.value.props?.fileType as string) ?? "image");
const alt = computed(() => (widgetData.value.props?.alt as string) ?? "Preview");
const fit = computed(() => (widgetData.value.props?.fit as string) ?? "contain");
const maxHeight = computed(() => (widgetData.value.props?.maxHeight as number) ?? 400);

useExposeWidget(() => ({
  get url() { return url.value; },
}));
</script>

<template>
  <div :class="$style.viewer" :style="{ maxHeight: maxHeight + 'px' }">
    <div v-if="!url" :class="$style.empty">
      No file URL configured
    </div>
    <el-image
      v-else-if="fileType === 'image'"
      :src="url"
      :alt="alt"
      :fit="fit as 'contain' | 'cover' | 'fill' | 'scale-down' | 'none'"
      :preview-src-list="[url]"
      :class="$style.image"
    />
    <iframe
      v-else-if="fileType === 'pdf'"
      :src="url"
      :class="$style.iframe"
      frameborder="0"
    />
    <div v-else :class="$style.empty">
      Unsupported file type: {{ fileType }}
    </div>
  </div>
</template>

<style module lang="scss">
.viewer {
  width: 100%;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.image {
  width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.iframe {
  width: 100%;
  height: 100%;
  min-height: 300px;
  border: none;
}
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 200px;
  color: var(--el-text-color-secondary, #909399);
  font-size: 14px;
}
</style>
