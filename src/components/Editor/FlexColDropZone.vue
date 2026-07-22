<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Widget } from '@/widgets/base/types'
import { useFlexDropZone } from '@/composables/useFlexDropZone'
import SchemaRender from '../WidgetRenderer/SchemaRender.vue'
import styles from '../WidgetRenderer/WidgetNode.module.scss'

const props = defineProps<{
  parentId: string
  colIndex: number
  allChildren: Widget[]
  editorSelectable?: boolean
}>()

const siblings = computed(() =>
  props.allChildren.filter((c) => (c.colIndex ?? 0) === props.colIndex),
)

const dropRef = ref<HTMLElement | null>(null)
const {
  isDragOver,
  handleDragOver,
  handleDragLeave,
  handleDrop,
} = useFlexDropZone(
  dropRef,
  () => props.parentId,
  () => siblings.value,
  () => Boolean(props.editorSelectable),
  () => ({ colIndex: props.colIndex }),
  // col 容器按 colIndex 过滤，拖放索引需映射回全量 children
  () => props.allChildren,
)
</script>

<template>
  <div
    ref="dropRef"
    :class="[styles.flexDropZone, isDragOver ? styles.flexDropZoneActive : '']"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <SchemaRender
      v-for="(child, ci) in siblings"
      :key="ci"
      :schema="child"
      :editor-selectable="editorSelectable"
    />
    <div v-if="!siblings.length" :class="styles.flexDropEmpty">
      拖入部件
    </div>
  </div>
</template>
