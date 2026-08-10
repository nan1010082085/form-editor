<script setup lang="ts">
/**
 * OptionsApiConfigDialog -- SchemaApiConfig Config对话框
 *
 * 900px 宽左右Min栏, toolbar 移至底部。
 * ApiConfig 内部自渲染左右Min栏（Form + 测试面板）, 本Component只负责Dialog壳和底部Action栏。
 */
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "@schema-platform/platform-shared";
import type { SchemaApiConfig } from "../../widgets/base/types";
import ApiConfig from "./ApiConfig.vue";
import AppDialog from "@schema-platform/platform-shared/components/common/AppDialog.vue";
import styles from "./OptionsApiConfigDialog.module.scss";

const props = defineProps<{
  visible: boolean;
  api: SchemaApiConfig | undefined;
}>();

const emit = defineEmits<{
  "update:visible": [val: boolean];
  save: [api: SchemaApiConfig | undefined];
}>();

const { t } = useI18n();

// ---- 本地Edit副本 ----
const localApi = ref<SchemaApiConfig | undefined>(undefined);

watch(
  () => props.visible,
  (open) => {
    if (open) {
      localApi.value = props.api
        ? JSON.parse(JSON.stringify(props.api))
        : undefined;
    }
  },
);

// ---- ApiConfig Event处理 ----
function handleApiUpdate(api: SchemaApiConfig | undefined) {
  localApi.value = api;
}

function clearApi() {
  localApi.value = undefined;
}

// ---- Save / Close ----
function handleSave() {
  /** 已Config API 对象Hrs url 必填；清除Config（undefined）允许Save */
  if (localApi.value && !String(localApi.value.url ?? "").trim()) {
    ElMessage.warning(t("editor.api.urlRequired"));
    return;
  }
  emit("save", localApi.value);
  emit("update:visible", false);
}

function handleClose() {
  emit("update:visible", false);
}
</script>

<template>
  <AppDialog
    :model-value="visible"
    :title="t('editor.configDialog.dataSource')"
    width="900px"
    @update:model-value="emit('update:visible', $event)"
  >
    <div :class="styles.body">
      <ApiConfig
        :api="localApi"
        @update:api="handleApiUpdate"
        @remove-config="clearApi"
      />
    </div>

    <template #footer>
      <el-button @click="handleClose">{{ t('editor.common.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">{{ t('editor.common.save') }}</el-button>
    </template>
  </AppDialog>
</template>
