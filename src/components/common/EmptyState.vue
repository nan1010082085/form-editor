<script setup lang="ts">
/**
 * EmptyState — 统一空状态组件
 *
 * 用于列表/页面无数据时的占位展示。
 */
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

defineProps<{
  /** 图标名称（AppIcon 已注册的 kebab-case name） */
  icon?: string;
  /** 图标尺寸 */
  iconSize?: number;
  /** 标题文案 */
  title?: string;
  /** 描述文案 */
  description?: string;
}>();
</script>

<template>
  <div :class="$style.empty">
    <div v-if="icon" :class="$style.icon">
      <AppIcon :name="icon" :size="iconSize ?? 64" />
    </div>
    <h2 v-if="title" :class="$style.title">{{ title }}</h2>
    <p v-if="description" :class="$style.desc">{{ description }}</p>
    <div v-if="$slots.default" :class="$style.actions">
      <slot />
    </div>
  </div>
</template>

<style module>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.icon {
  color: var(--text-color-placeholder);
  margin-bottom: 16px;
}

.title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-color-primary);
}

.desc {
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--text-color-secondary);
  max-width: 400px;
}

.actions {
  display: flex;
  gap: 12px;
}
</style>
