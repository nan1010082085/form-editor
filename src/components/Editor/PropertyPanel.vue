<script setup lang="ts">
/**
 * PropertyPanel -- 属性面板（Widget 驱动，手风琴折叠分区）
 *
 * 设计原则：
 * - 手风琴分区：基础属性、位置、样式、组件属性各自折叠
 * - 动态组件：每个属性由 PropertyField 根据 type 渲染不同输入
 * - 每行一个属性：label + value 水平排列
 */
import { computed, ref } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { useWidgetStore } from '../../stores/widget'
import { useBoardStore } from '../../stores/board'
import { getWidget } from '../../widgets/registry'
import { buildConfigHelpText } from '../../utils/configHelpText'
import type { Widget, WidgetConfig, ConfigPanelType } from '../../widgets/base/types'
import PropertyField from './PropertyField.vue'
import BorderEditor from './BorderEditor.vue'
import BorderRadiusEditor from './BorderRadiusEditor.vue'
import SpacingEditor from './SpacingEditor.vue'
import TableColumnsEditor from './TableColumnsEditor.vue'
import type { TableColumn } from '../../widgets/table/config'
import AdvancedColumnsEditor from './AdvancedColumnsEditor.vue'
import type { AdvancedTableColumn } from '../../widgets/advanced-table/config'
import ActionButtonsEditor from './ActionButtonsEditor.vue'
import type { ActionButton } from '../../widgets/advanced-table/config'
import NumberArrayEditor from './NumberArrayEditor.vue'
import GenericArrayEditor from './GenericArrayEditor.vue'
import OptionsEditor from './OptionsEditor.vue'
import SearchFieldsEditor from './SearchFieldsEditor.vue'
import CrudFormFieldsEditor from './CrudFormFieldsEditor.vue'
import AdhocFieldsEditor from './AdhocFieldsEditor.vue'
import KanbanColumnsEditor from './KanbanColumnsEditor.vue'
import type { SearchFieldSchema } from '@/components/WidgetRenderer/types'
import type { CrudFormFieldSchema } from '@/widgets/crud-list-page/config'
import type { AdhocQueryField } from '@/widgets/adhoc-query/config'
import type { KanbanColumn } from '@/widgets/kanban/config'
import RulesEditor from './RulesEditor.vue'
import PropertyPanelConfigBar from './PropertyPanelConfigBar.vue'
import PropertyPanelSections from './PropertyPanelSections.vue'
import EventConfigDialog from './EventConfigDialog.vue'
import LinkageSchemaDialog from './LinkageSchemaDialog.vue'
import OptionsApiConfigDialog from './OptionsApiConfigDialog.vue'
import VariableConfigDialog from './VariableConfigDialog.vue'
import { useClipboard } from '../../composables/useClipboard'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './style.module.scss'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'

const editorStore = useEditorStore()
const widgetStore = useWidgetStore()
const boardStore = useBoardStore()
const { t } = useI18n()
const { copy } = useClipboard()

// ---- 选中的 Widget ----

const selectedWidget = computed(() => {
  if (!editorStore.selectedId) return null
  return widgetStore.findWidget(editorStore.selectedId)
})

// ---- Widget 注册配置 ----

const widgetConfig = computed(() => {
  if (!selectedWidget.value) return null
  const regItem = getWidget(selectedWidget.value.type)
  if (!regItem) return undefined
  return { ...regItem, config: regItem.config as WidgetConfig }
})

// ---- 属性面板声明 ----

const panelDeclaration = computed(() => {
  if (!widgetConfig.value) return undefined
  return widgetConfig.value.config.propertyPanel ?? undefined
})

// ---- 事件目标（支持动态函数） ----

const resolvedEventTargets = computed(() => {
  const et = widgetConfig.value?.config.eventTargets
  if (!et || !selectedWidget.value) return undefined
  if (typeof et === 'function') return et(selectedWidget.value)
  return et
})

// ---- 属性列表项类型 ----

// PropertyItem / PropertySection / propertySections 构建逻辑已抽到 usePropertySections composable
import { usePropertySections } from '../../composables/usePropertySections'
import { usePropertyPanelLogic } from '../../composables/usePropertyPanelLogic'
import { usePropertyPanelDialogs } from '../../composables/usePropertyPanelDialogs'

const { propertySections } = usePropertySections(selectedWidget, panelDeclaration, t)

// ---- visibleOn 条件求值 ----

const { updateProperty, updateStylePatch, isItemVisible } = usePropertyPanelLogic(selectedWidget, widgetStore)

// 过滤可见项的 section
const visibleSections = computed(() =>
  propertySections.value.map(section => ({
    ...section,
    items: section.items.filter(isItemVisible),
  })).filter(section => section.items.length > 0),
)

// ---- 手风琴展开状态 ----

const expandedSections = ref<Set<string>>(new Set(['basic', 'position', 'style', 'props']))

function toggleSection(key: string) {
  if (expandedSections.value.has(key)) {
    expandedSections.value.delete(key)
  } else {
    expandedSections.value.add(key)
  }
}

// ---- configPanels 声明 ----

const configPanels = computed<ConfigPanelType[]>(() => {
  if (!widgetConfig.value) return []
  return widgetConfig.value.config.configPanels ?? []
})

/** 根据 configPanels 自动生成配置说明 */
const configHelpText = computed(() => buildConfigHelpText(configPanels.value, t))

// ---- 事件/规则/API/变量 弹框 ----

const {
  eventDialogVisible,
  linkageDialogVisible,
  apiDialogVisible,
  variableDialogVisible,
  boardVariableDialogVisible,
  openEventDialog,
  openLinkageDialog,
  openApiDialog,
  handleEventSave,
  handleLinkageSave,
  handleApiSave,
  handleVariableSave,
  handleBoardVariableSave,
} = usePropertyPanelDialogs(selectedWidget, widgetStore, editorStore, boardStore)

// ---- 画布配置（未选中部件时显示） ----

const canvasExpanded = ref(true)

// boardPropertyItems 构建逻辑已抽到 useBoardPropertyItems composable
import { useBoardPropertyItems } from '../../composables/useBoardPropertyItems'
import { useBoardPropertyUpdater } from '../../composables/useBoardPropertyUpdater'

const { boardPropertyItems } = useBoardPropertyItems(t)

const { updateBoardProperty } = useBoardPropertyUpdater(boardStore)
</script>

<template>
  <div :class="[styles.panel, 'editor-ui']">
    <div :class="styles.header">属性配置</div>

    <!-- 未选中部件时：显示画布配置 -->
    <template v-if="!selectedWidget">
      <div :class="styles.scroll" style="overflow: auto; height: 100%;">
        <div :class="styles.section">
          <div :class="styles.sectionHeader" @click="canvasExpanded = !canvasExpanded">
            <AppIcon name="arrow-down" :size="12" :class="styles.arrow" />
            <span :class="styles.sectionLabel">画布配置</span>
          </div>
          <div v-if="canvasExpanded" :class="styles.sectionBody">
            <PropertyField
              v-for="item in boardPropertyItems"
              :key="item.key"
              :label="item.label"
              :type="item.type"
              :value="item.value"
              :desc="item.desc"
              :options="item.options"
              @update="(v: unknown) => updateBoardProperty(item.key, v)"
            />
            <div :class="styles.variableBtn">
              <el-button size="small" @click="boardVariableDialogVisible = true">
                画布变量 ({{ boardStore.variables.length }})
              </el-button>
            </div>
          </div>
        </div>

        <VariableConfigDialog
          :visible="boardVariableDialogVisible"
          :variables="boardStore.variables"
          title="画布变量配置"
          @update:visible="boardVariableDialogVisible = $event"
          @save="handleBoardVariableSave"
        />
      </div>
    </template>

    <template v-else>
      <div :class="styles.widgetNameRow">
        <span :class="styles.widgetType">{{ widgetConfig?.displayName }}</span>
        <el-popover
          v-if="widgetConfig?.config.description"
          :content="widgetConfig.config.description"
          placement="top"
          :show-after="500"
          trigger="hover"
        >
          <template #reference>
            <AppIcon name="question-filled" :class="styles.questionIcon" />
          </template>
        </el-popover>
        <el-popover v-if="selectedWidget" content="复制部件 ID" placement="top" :show-after="500" trigger="hover">
          <template #reference>
            <AppIcon name="copy-document" :class="styles.copyIdIcon" @click="copyWidgetId" />
          </template>
        </el-popover>
      </div>

      <!-- 动态配置入口 -->
      <PropertyPanelConfigBar
        v-if="configPanels.length"
        :config-panels="configPanels"
        :config-help-text="configHelpText"
        :selected-widget="selectedWidget"
        @open-event="openEventDialog"
        @open-linkage="openLinkageDialog"
        @open-api="openApiDialog"
        @open-variables="variableDialogVisible = true"
      />

      <PropertyPanelSections
        :sections="visibleSections"
        :expanded-sections="expandedSections"
        :selected-widget="selectedWidget"
        @toggle-section="toggleSection"
        @update-property="updateProperty"
        @update-style-patch="updateStylePatch"
      />

      <EventConfigDialog
        :visible="eventDialogVisible"
        :events="selectedWidget.events ?? []"
        :event-targets="resolvedEventTargets"
        @update:visible="eventDialogVisible = $event"
        @save="handleEventSave"
      />

      <LinkageSchemaDialog
        :visible="linkageDialogVisible"
        :linkages="selectedWidget.linkages ?? []"
        @update:visible="linkageDialogVisible = $event"
        @save="handleLinkageSave"
      />

      <OptionsApiConfigDialog
        :visible="apiDialogVisible"
        :api="selectedWidget.api"
        @update:visible="apiDialogVisible = $event"
        @save="handleApiSave"
      />

      <VariableConfigDialog
        :visible="variableDialogVisible"
        :variables="selectedWidget.variables ?? []"
        title="部件变量配置"
        @update:visible="variableDialogVisible = $event"
        @save="handleVariableSave"
      />
    </template>
  </div>
</template>

