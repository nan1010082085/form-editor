<script setup lang="ts">
/**
 * EditorRightPanel — 编辑器右侧属性面板
 *
 * 包含面板头部 + PropertyPanel + 全局配置提示
 */
import PropertyPanel from './PropertyPanel.vue'
import type { PartialWidget } from '@/components/WidgetRenderer/types'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './EditorRightPanel.module.scss'

const { t } = useI18n()

defineProps<{
  selectedSchema: PartialWidget | null
  allSchema: PartialWidget[]
  drawerVisible: boolean
}>()

const emit = defineEmits<{
  'update:schema': [schema: PartialWidget]
  'close': []
}>()

function getDisplayLabel(item: PartialWidget): string {
  return (item as any).label || item.type || t('editor.rightPanel.widgetFallback')
}
</script>

<template>
  <aside :class="styles['right-panel']">
    <!-- Header -->
    <div :class="styles['right-panel__header']">
      <AppIcon name="setting" :size="14" />
      <span v-if="selectedSchema">{{ getDisplayLabel(selectedSchema) }} {{ t('editor.rightPanel.widgetSuffix') }}</span>
      <span v-else>{{ t('editor.rightPanel.editorConfig') }}</span>
      <button :class="styles['right-panel__close']" @click="emit('close')">
        <AppIcon name="close" :size="12" />
      </button>
    </div>

    <!-- Property panel -->
    <PropertyPanel
      v-if="selectedSchema"
      :schema="selectedSchema"
      :all-schema="allSchema"
      @update:schema="emit('update:schema', $event)"
    />

    <!-- Global config hint -->
    <div v-else :class="styles['right-panel__hint']">
      <p>{{ t('editor.rightPanel.selectComponentHint') }}</p>
    </div>
  </aside>
</template>

