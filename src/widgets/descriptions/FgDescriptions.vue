<script setup lang="ts">
import { inject, computed, onMounted, watch, type ComputedRef } from "vue";
import { widgetDataKey } from "../base/types";
import { useExposeWidget } from "../../composables/useExposeWidget";
import { fetchWidgetDataSource } from "@/api/widgetApi";
import { resolveWidgetUrl } from "@/utils/resolveWidgetUrl";
import { useWidgetData } from "@/composables/useWidgetData";
import { useI18n } from "@schema-platform/platform-shared";
import type { DescriptionItemConfig } from "./config";
import styles from "./style.module.scss";

const { t } = useI18n();

const widgetData = inject(widgetDataKey)!;
const variablesContext = inject<ComputedRef<Record<string, unknown>>>(
  "variablesContext",
  computed(() => ({})),
);
const setBoardVariable = inject<(name: string, value: unknown) => void>(
  "setBoardVariable",
  () => {},
);

const apiConfig = computed(
  () =>
    widgetData.value.props?.dataSource as
      | { type?: string; url?: string }
      | undefined,
);
const apiUrl = computed(() =>
  apiConfig.value?.type === "api" && apiConfig.value.url
    ? resolveWidgetUrl(apiConfig.value.url, variablesContext.value)
    : "",
);

// ---- useWidgetData（Retry/SWR） ----
const {
  data: apiData,
  loading,
  reload: wReload,
} = useWidgetData<Record<string, unknown>>({
  key: "descriptions:" + apiUrl.value,
  fetcher: () => fetchWidgetDataSource<Record<string, unknown>>(apiUrl.value),
  enabled: computed(() => !!apiUrl.value),
  retry: 2,
  swr: false,
  cacheTtl: 0,
  autoLoad: false,
});

// 主Data源：API 或静态Data
const data = computed(() => {
  if (apiData.value) return apiData.value;
  const staticData = widgetData.value.props?.staticData as
    | Record<string, unknown>
    | undefined;
  return staticData && typeof staticData === "object" ? staticData : {};
});

// 从 API 返回Value中Sync board 变量（flowInstanceId / taskId）
watch(apiData, (val) => {
  if (!val) return;
  if (val.flowInstanceId)
    setBoardVariable("flowInstanceId", val.flowInstanceId);
  if (val.taskId) setBoardVariable("taskId", val.taskId);
});

useExposeWidget(() => ({
  get data() {
    return data.value;
  },
  get loading() {
    return loading.value;
  },
}));

const title = computed(() => (widgetData.value.props?.title as string) || "");
const column = computed(() => (widgetData.value.props?.column as number) || 2);
const border = computed(() => widgetData.value.props?.border !== false);
const items = computed<DescriptionItemConfig[]>(() => {
  const raw = widgetData.value.props?.items;
  return Array.isArray(raw) ? raw : [];
});

// 初始加载（useWidgetData autoLoad: false, 手动Trigger）
onMounted(() => {
  if (apiUrl.value) void wReload();
});

// 变量变化后重新拉取（Dialog/Details页 recordId 等）
watch(apiUrl, (url) => {
  if (url) void wReload();
});

/** 取FieldValue */
function getFieldValue(field: string): unknown {
  return data.value[field];
}

/** FormatShowValue */
function formatValue(item: DescriptionItemConfig): string {
  const raw = getFieldValue(item.field);
  if (raw == null) return "";
  const str = String(raw);
  const prefix = item.prefix || "";
  const suffix = item.suffix || "";
  return `${prefix}${str}${suffix}`;
}

/** tag Type：根据 value 查找对应的 tag Config */
function getTagConfig(
  item: DescriptionItemConfig,
): { label: string; color?: string } | null {
  const raw = getFieldValue(item.field);
  if (!item.options?.length) return { label: String(raw ?? "") };
  const found = item.options.find((opt) => opt.value === raw);
  return found || { label: String(raw ?? "") };
}

/** 日期Format */
function formatDate(item: DescriptionItemConfig): string {
  const raw = getFieldValue(item.field);
  if (!raw) return "";
  const d = new Date(raw as string);
  if (isNaN(d.getTime())) return String(raw);
  const fmt = item.format || "YYYY-MM-DD";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return fmt
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}
</script>

<template>
  <div :class="styles.container">
    <div v-if="title" :class="styles.title">{{ title }}</div>
    <div v-if="loading" :class="styles.loading" />
    <el-descriptions v-else-if="items.length" :column="column" :border="border">
      <el-descriptions-item
        v-for="item in items"
        :key="item.field"
        :label="item.label"
        :span="item.span || 1"
      >
        <!-- tag Type -->
        <template v-if="item.type === 'tag'">
          <el-tag
            :type="
              (getTagConfig(item)?.color as
                | 'success'
                | 'warning'
                | 'danger'
                | 'info') || 'info'
            "
            size="small"
          >
            {{ getTagConfig(item)?.label }}
          </el-tag>
        </template>

        <!-- link Type -->
        <template v-else-if="item.type === 'link'">
          <a :class="styles.link" :href="item.href || '#'" target="_blank">
            {{ formatValue(item) }}
          </a>
        </template>

        <!-- image Type -->
        <template v-else-if="item.type === 'image'">
          <img
            v-if="getFieldValue(item.field)"
            :src="String(getFieldValue(item.field))"
            :style="{
              width: (item.imageWidth || 80) + 'px',
              height: (item.imageHeight || 80) + 'px',
            }"
            :class="styles.image"
          />
        </template>

        <!-- date Type -->
        <template v-else-if="item.type === 'date'">
          {{ formatDate(item) }}
        </template>

        <!-- text Type（默认） -->
        <template v-else>
          {{ formatValue(item) }}
        </template>
      </el-descriptions-item>
    </el-descriptions>
    <div v-else :class="styles.empty">{{ t("editor.descriptions.empty") }}</div>
  </div>
</template>
