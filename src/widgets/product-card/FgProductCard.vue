<script setup lang="ts">
import { computed, inject } from "vue";
import { widgetDataKey } from "../base/types";
import { useExposeWidget } from "../../composables/useExposeWidget";

const widgetData = inject(widgetDataKey)!;

const nameField = computed(() => (widgetData.value.props?.nameField as string) ?? "name");
const priceField = computed(() => (widgetData.value.props?.priceField as string) ?? "price");
const imageField = computed(() => (widgetData.value.props?.imageField as string) ?? "image");
const statusField = computed(() => (widgetData.value.props?.statusField as string) ?? "status");
const currency = computed(() => (widgetData.value.props?.currency as string) ?? "¥");
const showImage = computed(() => (widgetData.value.props?.showImage as boolean) ?? true);
const showPrice = computed(() => (widgetData.value.props?.showPrice as boolean) ?? true);
const showStatus = computed(() => (widgetData.value.props?.showStatus as boolean) ?? true);
const showDescription = computed(() => (widgetData.value.props?.showDescription as boolean) ?? true);
const imageHeight = computed(() => (widgetData.value.props?.imageHeight as number) ?? 200);

const staticData = computed(() => {
  const raw = widgetData.value.props?.staticData;
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
});

const name = computed(() => (staticData.value[nameField.value] as string) ?? "Product");
const price = computed(() => staticData.value[priceField.value] as number | string | undefined);
const image = computed(() => (staticData.value[imageField.value] as string) ?? "");
const status = computed(() => (staticData.value[statusField.value] as string) ?? "");
const description = computed(() => (staticData.value["description"] as string) ?? "");

const STATUS_TYPE: Record<string, string> = {
  active: "success", "in-stock": "success", available: "success",
  "out-of-stock": "danger", inactive: "info", discontinued: "warning",
  sale: "warning", new: "primary",
};

useExposeWidget(() => ({
  get productData() { return staticData.value; },
}));
</script>

<template>
  <el-card :class="$style.card" :body-style="{ padding: '0' }">
    <div v-if="showImage && image" :class="$style.imageWrap" :style="{ height: imageHeight + 'px' }">
      <el-image :src="image" :alt="name" fit="cover" :class="$style.image" />
    </div>
    <div :class="$style.content">
      <div :class="$style.header">
        <span :class="$style.name">{{ name }}</span>
        <el-tag v-if="showStatus && status" :type="(STATUS_TYPE[status] as 'success' | 'warning' | 'info' | 'danger') ?? 'info'" size="small" effect="plain">
          {{ status }}
        </el-tag>
      </div>
      <div v-if="showDescription && description" :class="$style.desc">{{ description }}</div>
      <div v-if="showPrice && price !== undefined" :class="$style.price">
        {{ currency }}{{ typeof price === 'number' ? price.toFixed(2) : price }}
      </div>
    </div>
  </el-card>
</template>

<style module lang="scss">
.card {
  width: 100%;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;
  overflow: hidden;
}
.imageWrap {
  overflow: hidden;
}
.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.content {
  padding: 12px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.name {
  font-weight: 500;
  font-size: 15px;
  color: var(--el-text-color-primary, #303133);
  flex: 1;
}
.desc {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.price {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-danger, #f56c6c);
}
</style>
