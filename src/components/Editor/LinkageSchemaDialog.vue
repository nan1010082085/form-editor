<script setup lang="ts">
/**
 * LinkageSchemaDialog — SchemaLinkage[] 联动配置对话框
 *
 * 写入 widget.linkages，运行时由 useLinkage 消费。
 * 与 LinkageConfigDialog（WidgetEvent[] → rules）区分。
 */
import { ref, watch, computed } from 'vue'
import type { SchemaLinkage } from '@/components/WidgetRenderer/types'
import AppDialog from '@schema-platform/platform-shared/components/common/AppDialog.vue'
import LinkageConfig from './LinkageConfig.vue'
import { useWidgetOptions } from '@/composables/useWidgetOptions'

const props = defineProps<{
  visible: boolean
  linkages: SchemaLinkage[]
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  save: [linkages: SchemaLinkage[]]
}>()

const { widgetOptions } = useWidgetOptions()

const availableFields = computed(() => widgetOptions.value.map((o) => o.value))

const localLinkages = ref<SchemaLinkage[]>([])

watch(
  () => props.visible,
  (open) => {
    if (open) {
      localLinkages.value = JSON.parse(JSON.stringify(props.linkages ?? []))
    }
  },
)

function handleSave() {
  emit('save', localLinkages.value)
  emit('update:visible', false)
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <AppDialog
    :model-value="visible"
    title="字段联动配置"
    width="640px"
    destroy-on-close
    @update:model-value="handleClose"
  >
    <LinkageConfig
      :linkages="localLinkages"
      :available-fields="availableFields"
      @update:linkages="localLinkages = $event"
    />
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </AppDialog>
</template>
