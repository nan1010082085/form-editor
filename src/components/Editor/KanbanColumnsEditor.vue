<script setup lang="ts">
import type { KanbanColumn } from '@/widgets/kanban/config'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import styles from './SearchFieldsEditor.module.scss'

const props = defineProps<{
  columns: KanbanColumn[]
}>()

const emit = defineEmits<{
  'update:columns': [columns: KanbanColumn[]]
}>()

function addColumn() {
  emit('update:columns', [...props.columns, { key: '', title: '', status: '' }])
}

function removeColumn(index: number) {
  emit('update:columns', props.columns.filter((_, i) => i !== index))
}

function moveUp(index: number) {
  if (index === 0) return
  const updated = [...props.columns]
  ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
  emit('update:columns', updated)
}

function moveDown(index: number) {
  if (index >= props.columns.length - 1) return
  const updated = [...props.columns]
  ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
  emit('update:columns', updated)
}

function updateColumn<K extends keyof KanbanColumn>(
  index: number,
  key: K,
  value: KanbanColumn[K],
) {
  emit(
    'update:columns',
    props.columns.map((col, i) => (i === index ? { ...col, [key]: value } : col)),
  )
}
</script>

<template>
  <div :class="styles['search-fields-editor']">
    <div v-if="columns.length === 0" :class="styles['search-fields-editor__empty']">
      未配置看板列。
    </div>

    <div
      v-for="(col, idx) in columns"
      :key="idx"
      :class="styles['search-fields-editor__item']"
    >
      <div :class="styles['search-fields-editor__item-header']">
        <span :class="styles['search-fields-editor__item-title']">列 {{ idx + 1 }}</span>
        <div :class="styles['search-fields-editor__item-actions']">
          <el-button size="small" text :disabled="idx === 0" @click="moveUp(idx)">
            <AppIcon name="arrow-up" />
          </el-button>
          <el-button size="small" text :disabled="idx === columns.length - 1" @click="moveDown(idx)">
            <AppIcon name="arrow-down" />
          </el-button>
          <el-button size="small" type="danger" text @click="removeColumn(idx)">
            <AppIcon name="delete" />
          </el-button>
        </div>
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">Key</label>
        <el-input
          :model-value="col.key"
          size="small"
          placeholder="open"
          @update:model-value="updateColumn(idx, 'key', $event)"
        />
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">标题</label>
        <el-input
          :model-value="col.title"
          size="small"
          placeholder="待办"
          @update:model-value="updateColumn(idx, 'title', $event)"
        />
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">状态值</label>
        <el-input
          :model-value="col.status"
          size="small"
          placeholder="open"
          @update:model-value="updateColumn(idx, 'status', $event)"
        />
      </div>
    </div>

    <el-button type="primary" size="small" style="width: 100%; margin-top: 8px" @click="addColumn">
      <AppIcon name="plus" style="margin-right: 4px" />
      添加列
    </el-button>
  </div>
</template>
