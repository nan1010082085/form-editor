<script setup lang="ts">
/**
 * EditorLeftPanel — 编辑器左侧面板
 *
 * 部件库标签页 + 结构树标签页 + 模板标签页
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ComponentPanel from './ComponentPanel.vue'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import WidgetTree from './WidgetTree.vue'
import TemplatePanel from './TemplatePanel.vue'
import { useWidgetStore } from '@/stores/widget'
import { useEditorStore } from '@/stores/editor'
import { applyTemplate } from '@/api/schemaApi'
import type { TemplateItem } from '@/api/schemaApi'
import type { Widget } from '@/widgets/base/types'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './EditorLeftPanel.module.scss'

const { t } = useI18n()

defineProps<{
  schemaStatus: 'draft' | 'published'
  schemaType: 'form'
  schemaId: string | null
}>()

const widgetStore = useWidgetStore()
const editorStore = useEditorStore()

const activeTab = ref<'components' | 'structure' | 'templates'>('components')
const templatePanelRef = ref<InstanceType<typeof TemplatePanel>>()

async function handleApplyTemplate(template: TemplateItem) {
  try {
    const result = await applyTemplate(template.id)
    for (const w of result.widgets) {
      widgetStore.addWidget(w as unknown as Widget)
    }
    editorStore.pushHistory(widgetStore.widgets)
    ElMessage.success(t('editor.leftPanel.templateApplied', { name: template.name }))
  } catch {
    ElMessage.error(t('editor.leftPanel.templateApplyFailed'))
  }
}
</script>

<template>
  <aside :class="styles['left-panel']">
    <!-- Tabs -->
    <div :class="styles['left-panel__tabs']">
      <button
        :class="[styles['left-panel__tab'], { [styles['left-panel__tab--active']]: activeTab === 'components' }]"
        @click="activeTab = 'components'"
      >
        <AppIcon name="grid" :size="14" />
        <span>{{ t('editor.leftPanel.tabComponents') }}</span>
      </button>
      <button
        :class="[styles['left-panel__tab'], { [styles['left-panel__tab--active']]: activeTab === 'structure' }]"
        @click="activeTab = 'structure'"
      >
        <AppIcon name="list" :size="14" />
        <span>{{ t('editor.leftPanel.tabStructure') }}</span>
      </button>
      <button
        :class="[styles['left-panel__tab'], { [styles['left-panel__tab--active']]: activeTab === 'templates' }]"
        @click="activeTab = 'templates'"
      >
        <AppIcon name="document" :size="14" />
        <span>{{ t('editor.leftPanel.tabTemplates') }}</span>
      </button>
    </div>

    <!-- Content -->
    <div :class="styles['left-panel__content']">
      <ComponentPanel v-show="activeTab === 'components'" />
      <WidgetTree v-show="activeTab === 'structure'" />
      <TemplatePanel
        v-show="activeTab === 'templates'"
        ref="templatePanelRef"
        @apply="handleApplyTemplate"
      />
    </div>

    <!-- Status bar -->
    <div v-if="schemaId" :class="styles['left-panel__status']">
      <span :class="[styles['left-panel__status-tag'], styles[`left-panel__status-tag--${schemaStatus}`]]">
        {{ schemaStatus === 'published' ? t('editor.leftPanel.statusPublished') : t('editor.leftPanel.statusDraft') }}
      </span>
      <span :class="[styles['left-panel__status-tag'], styles['left-panel__status-tag--form']]">
        {{ t('editor.leftPanel.statusForm') }}
      </span>
    </div>
  </aside>
</template>
