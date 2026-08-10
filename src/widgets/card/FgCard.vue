<script setup lang="ts">
/**
 * FgCard — 卡片Container Widget
 *
 * 职责：
 * - el-card 包裹, 提供卡片视觉Container
 * - 渲染标题和子Component
 */
import { inject, computed } from "vue";
import { widgetDataKey } from "../base/types";
import { useI18n } from "@schema-platform/platform-shared";
import styles from "./style.module.scss";

const { t } = useI18n();

const props = defineProps<{ editable?: boolean }>();

const widgetData = inject(widgetDataKey)!;

const hasChildren = computed(
  () => (widgetData.value.children?.length ?? 0) > 0,
);
</script>

<template>
  <el-card
    :class="styles.cardContainer"
    :shadow="
      (widgetData.props?.shadow as 'always' | 'hover' | 'never') || 'hover'
    "
    :header="
      widgetData.props?.showHeader !== false
        ? (widgetData.props?.title as string) || t('editor.card.defaultTitle')
        : undefined
    "
  >
    <div :class="styles.body">
      <slot />
      <div v-if="props.editable && !hasChildren" :class="styles.ghost">
        {{ t("editor.card.dragHint") }}
      </div>
    </div>
  </el-card>
</template>
