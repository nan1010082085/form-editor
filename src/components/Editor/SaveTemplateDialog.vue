<script setup lang="ts">
/**
 * SaveTemplateDialog — 保存模板对话框
 *
 * 将画布上的 Widget 树保存为模板。
 */
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createTemplate } from '@/api/schemaApi'
import type { TemplateCategory } from '@/api/schemaApi'
import { useI18n } from '@schema-platform/platform-shared'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  widgets: Record<string, unknown>[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
  saved: []
}>()

const formRef = ref()
const name = ref('')
const description = ref('')
const category = ref<TemplateCategory>('other')
const tagsInput = ref('')
const saving = ref(false)

watch(() => props.visible, (val) => {
  if (val) {
    name.value = ''
    description.value = ''
    category.value = 'other'
    tagsInput.value = ''
  }
})

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

async function handleSave() {
  if (!name.value.trim()) {
    ElMessage.warning(t('editor.saveTemplate.nameRequired'))
    return
  }

  saving.value = true
  try {
    const tags = tagsInput.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    await createTemplate({
      name: name.value.trim(),
      description: description.value.trim(),
      category: category.value,
      widgets: props.widgets,
      tags,
    })

    ElMessage.success(t('editor.saveTemplate.saveSuccess'))
    emit('saved')
    emit('update:visible', false)
    emit('close')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('editor.saveTemplate.saveFailed'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="t('editor.saveTemplate.dialogTitle')"
    width="420px"
    :close-on-click-modal="false"
    :append-to-body="true"
    @update:model-value="emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" label-width="70px" label-position="left">
      <el-form-item :label="t('editor.saveTemplate.name')" required>
        <el-input v-model="name" :placeholder="t('editor.saveTemplate.namePlaceholder')" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item :label="t('editor.saveTemplate.description')">
        <el-input
          v-model="description"
          type="textarea"
          :rows="2"
          :placeholder="t('editor.saveTemplate.descriptionPlaceholder')"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item :label="t('editor.saveTemplate.category')">
        <el-select v-model="category" style="width: 100%">
          <el-option :label="t('editor.saveTemplate.categoryForm')" value="form" />
          <el-option :label="t('editor.saveTemplate.categoryReport')" value="report" />
          <el-option :label="t('editor.saveTemplate.categoryLayout')" value="layout" />
          <el-option :label="t('editor.saveTemplate.categoryOther')" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('editor.saveTemplate.tags')">
        <el-input v-model="tagsInput" :placeholder="t('editor.saveTemplate.tagsPlaceholder')" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">{{ t('editor.common.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">{{ t('editor.common.save') }}</el-button>
    </template>
  </el-dialog>
</template>
