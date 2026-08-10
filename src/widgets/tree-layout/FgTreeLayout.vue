<script setup lang="ts">
/**
 * FgTreeLayout — 侧栏面板Container（带标题与Search）
 */
import { inject, computed, ref } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { widgetDataKey } from "../base/types";
import type { Widget } from "../base/types";
import SchemaRender from "../../components/WidgetRenderer/SchemaRender.vue";
import styles from "./style.module.scss";

const props = defineProps<{ editable?: boolean }>();

const { t } = useI18n();
const widgetData = inject(widgetDataKey)!;
const searchKeyword = ref("");

const hasChildren = computed(
  () => (widgetData.value.children?.length ?? 0) > 0,
);
const showHeader = computed(() => widgetData.value.props?.showHeader !== false);
const showSearch = computed(() => widgetData.value.props?.showSearch !== false);

const headerTitle = computed(
  () =>
    (widgetData.value.props?.title as string) ||
    t("editor.treeLayout.defaultTitle"),
);

const searchPlaceholder = computed(
  () =>
    (widgetData.value.props?.searchPlaceholder as string) ||
    t("editor.treeLayout.defaultSearchPlaceholder"),
);

const filteredChildren = computed(() => {
  const children = widgetData.value.children ?? [];
  const kw = searchKeyword.value.trim().toLowerCase();
  if (!kw) return children;
  return children.filter((c: Widget) => {
    const label = (c.label || c.field || c.type || "").toLowerCase();
    return label.includes(kw);
  });
});
</script>
<template>
  <div :class="styles.container">
    <div v-if="showHeader" :class="styles.header">
      {{ headerTitle }}
    </div>
    <div v-if="showSearch" :class="styles.search">
      <el-input
        v-model="searchKeyword"
        :placeholder="searchPlaceholder"
        size="small"
        clearable
      />
    </div>
    <div :class="styles.body">
      <SchemaRender
        v-if="filteredChildren.length"
        :widgets="filteredChildren"
      />
      <div
        v-else-if="props.editable && searchKeyword && hasChildren"
        :class="styles.placeholder"
      >
        {{ t("editor.treeLayout.noMatchChildren") }}
      </div>
      <div
        v-else-if="props.editable && !hasChildren"
        :class="styles.placeholder"
      >
        {{ t("editor.canvas.dragWidget") }}
      </div>
    </div>
  </div>
</template>
