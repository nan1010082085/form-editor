<script setup lang="ts">
/**
 * PropertyPanelSections — 属性手风琴分区渲染
 * 从 PropertyPanel 拆出，降低主文件体积。
 */
import type { Widget } from '../../widgets/base/types'
import type { ArrayFieldSchema } from '../../widgets/base/types'
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
import styles from './style.module.scss'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'

export interface PropertyItem {
  key: string
  label: string
  type: string
  value: unknown
  desc?: string
  placeholder?: string
  options?: Array<{ label: string; value: string | number | boolean }>
  fields?: ArrayFieldSchema[]
  remoteUrl?: string
  labelField?: string
  valueField?: string
  visibleOn?: string
  unit?: string
  unitKey?: string
  itemLabel?: string
}

export interface PropertySection {
  key: string
  label: string
  items: PropertyItem[]
}

const props = defineProps<{
  sections: PropertySection[]
  expandedSections: Set<string>
  selectedWidget: Widget | null
}>()

const emit = defineEmits<{
  toggleSection: [key: string]
  updateProperty: [key: string, value: unknown]
  updateStylePatch: [patch: Record<string, string>]
}>()
</script>

<template>
  <div :class="styles.scroll" style="overflow: auto; height: 100%;">
    <div v-for="section in sections" :key="section.key" :class="styles.section">
      <div :class="styles.sectionHeader" @click="emit('toggleSection', section.key)">
        <AppIcon v-if="expandedSections.has(section.key)" name="arrow-down" :size="12" :class="styles.arrow" />
        <AppIcon v-else name="arrow-right" :size="12" :class="styles.arrow" />
        <span :class="styles.sectionLabel">{{ section.label }}</span>
        <span :class="styles.sectionCount">{{ section.items.length }}</span>
      </div>

      <div v-if="expandedSections.has(section.key)" :class="styles.sectionBody">
        <template v-for="item in section.items" :key="item.key">
          <div v-if="item.type === 'columns'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <TableColumnsEditor
              :columns="(item.value as TableColumn[]) ?? []"
              @update:columns="(v: TableColumn[]) => emit('updateProperty', item.key, v)"
            />
          </div>
          <div v-else-if="item.type === 'advanced-columns'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <AdvancedColumnsEditor
              :columns="(item.value as AdvancedTableColumn[]) ?? []"
              @update:columns="(v: AdvancedTableColumn[]) => emit('updateProperty', item.key, v)"
            />
          </div>
          <div v-else-if="item.type === 'action-buttons'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <ActionButtonsEditor
              :buttons="(item.value as ActionButton[]) ?? []"
              @update:buttons="(v: ActionButton[]) => emit('updateProperty', item.key, v)"
            />
          </div>
          <div v-else-if="item.type === 'search-fields'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <SearchFieldsEditor
              :search-fields="(item.value as SearchFieldSchema[]) ?? []"
              @update:search-fields="(v: SearchFieldSchema[]) => emit('updateProperty', item.key, v)"
            />
          </div>
          <div v-else-if="item.type === 'crud-form-fields'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <CrudFormFieldsEditor
              :fields="(item.value as CrudFormFieldSchema[]) ?? []"
              @update:fields="(v: CrudFormFieldSchema[]) => emit('updateProperty', item.key, v)"
            />
          </div>
          <div v-else-if="item.type === 'adhoc-fields'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <AdhocFieldsEditor
              :fields="(item.value as AdhocQueryField[]) ?? []"
              @update:fields="(v: AdhocQueryField[]) => emit('updateProperty', item.key, v)"
            />
          </div>
          <div v-else-if="item.type === 'kanban-columns'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <KanbanColumnsEditor
              :columns="(item.value as KanbanColumn[]) ?? []"
              @update:columns="(v: KanbanColumn[]) => emit('updateProperty', item.key, v)"
            />
          </div>
          <div v-else-if="item.type === 'number-array'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <NumberArrayEditor
              :value="(item.value as number[]) ?? []"
              :min="0"
              :max="100"
              @update="(v: number[]) => emit('updateProperty', item.key, v)"
            />
          </div>
          <div v-else-if="item.type === 'array-editor'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <GenericArrayEditor
              :value="(item.value as unknown[]) ?? []"
              :fields="item.fields ?? []"
              :item-label="item.itemLabel"
              @update="(v: unknown[]) => emit('updateProperty', item.key, v)"
            />
          </div>
          <OptionsEditor
            v-else-if="item.type === 'options'"
            :label="item.label"
            :value="item.value"
            @update="(v: unknown) => emit('updateProperty', item.key, v)"
          />
          <div v-else-if="item.type === 'border-editor'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <BorderEditor
              :value="(selectedWidget?.style as Record<string, string>) ?? {}"
              @update="(p: Record<string, string>) => emit('updateStylePatch', p)"
            />
          </div>
          <div v-else-if="item.type === 'border-radius-editor'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <BorderRadiusEditor
              :value="(selectedWidget?.style as Record<string, string>) ?? {}"
              @update="(p: Record<string, string>) => emit('updateStylePatch', p)"
            />
          </div>
          <div v-else-if="item.type === 'spacing-margin-editor'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <SpacingEditor
              mode="margin"
              :value="(selectedWidget?.style as Record<string, string>) ?? {}"
              @update="(p: Record<string, string>) => emit('updateStylePatch', p)"
            />
          </div>
          <div v-else-if="item.type === 'spacing-padding-editor'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <SpacingEditor
              mode="padding"
              :value="(selectedWidget?.style as Record<string, string>) ?? {}"
              @update="(p: Record<string, string>) => emit('updateStylePatch', p)"
            />
          </div>
          <div v-else-if="item.type === 'rules'" :class="styles.columnsSection">
            <div :class="styles.columnsLabel">{{ item.label }}</div>
            <RulesEditor
              :rules="(item.value as any[] | undefined)"
              @update:rules="(v: any[] | undefined) => emit('updateProperty', item.key, v)"
            />
          </div>
          <div v-else-if="item.type === 'number' && item.unitKey" :class="styles.field">
            <el-tooltip :content="item.desc || item.label" placement="top" :show-after="300">
              <label :class="styles.label">{{ item.label.length > 4 ? item.label.slice(0, 4) + '…' : item.label }}</label>
            </el-tooltip>
            <div :class="styles.control" style="display: flex; gap: 4px;">
              <el-input-number
                :model-value="(item.value as number) ?? 0"
                size="small"
                controls-position="right"
                style="flex: 1;"
                @update:model-value="(v: unknown) => emit('updateProperty', item.key, v)"
              />
              <el-select
                :model-value="item.unit ?? 'px'"
                size="small"
                style="width: 56px;"
                @update:model-value="(v: unknown) => emit('updateProperty', item.unitKey!, v)"
              >
                <el-option label="px" value="px" />
                <el-option label="%" value="%" />
              </el-select>
            </div>
          </div>
          <PropertyField
            v-else
            :label="item.label"
            :type="item.type"
            :value="item.value"
            :desc="item.desc"
            :placeholder="item.placeholder"
            :options="item.options"
            :remote-url="item.remoteUrl"
            :label-field="item.labelField"
            :value-field="item.valueField"
            @update="(v: unknown) => emit('updateProperty', item.key, v)"
          />
        </template>
      </div>
    </div>
  </div>
</template>
