<script setup lang="ts">
/**
 * RequestConfigDialog -- API 请求Config对话框
 *
 * 用于Config Table 等Component的 API Data源。
 * 支持 URL、Method、Headers、Response Data Path Config。
 */
import { ref, watch } from "vue";
import AppDialog from "@schema-platform/platform-shared/components/common/AppDialog.vue";
import styles from "./RequestConfigDialog.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import { useI18n } from "@schema-platform/platform-shared";

const { t } = useI18n();

interface RequestConfig {
  apiUrl: string;
  apiMethod: string;
  apiHeaders: Record<string, string>;
  responseDataPath: string;
}

const props = defineProps<{
  visible: boolean;
  config: RequestConfig;
}>();

const emit = defineEmits<{
  "update:visible": [val: boolean];
  "update:config": [config: RequestConfig];
  save: [config: RequestConfig];
  cancel: [];
}>();

// ---- 本地Edit副本 ----

const localConfig = ref<RequestConfig>({
  apiUrl: "",
  apiMethod: "get",
  apiHeaders: {},
  responseDataPath: "",
});

// Header 键Value对EditStatus
interface HeaderEntry {
  key: string;
  value: string;
}

const headerEntries = ref<HeaderEntry[]>([]);

watch(
  () => props.visible,
  (open) => {
    if (open) {
      localConfig.value = JSON.parse(JSON.stringify(props.config));
      // 将 headers 对象转为键Value对数组
      headerEntries.value = Object.entries(localConfig.value.apiHeaders).map(
        ([key, value]) => ({ key, value }),
      );
      // 确保至少有一Row
      if (headerEntries.value.length === 0) {
        headerEntries.value.push({ key: "", value: "" });
      }
    }
  },
);

// ---- Header CRUD ----

function addHeader() {
  headerEntries.value.push({ key: "", value: "" });
}

function removeHeader(index: number) {
  headerEntries.value.splice(index, 1);
}

function syncHeaders() {
  const headers: Record<string, string> = {};
  for (const entry of headerEntries.value) {
    if (entry.key.trim()) {
      headers[entry.key.trim()] = entry.value;
    }
  }
  localConfig.value.apiHeaders = headers;
}

// ---- 方法Options ----

const methodOptions = [
  { label: "GET", value: "get" },
  { label: "POST", value: "post" },
  { label: "PUT", value: "put" },
  { label: "DELETE", value: "delete" },
];

// ---- Save / Close ----

function handleSave() {
  syncHeaders();
  emit("save", { ...localConfig.value });
  emit("update:config", { ...localConfig.value });
  emit("update:visible", false);
}

function handleClose() {
  emit("cancel");
  emit("update:visible", false);
}
</script>

<template>
  <AppDialog
    :model-value="visible"
    :title="t('editor.api.requestConfig')"
    width="560px"
    @update:model-value="emit('update:visible', $event)"
  >
    <div :class="styles.body">
      <!-- URL -->
      <!-- URL -->
      <div :class="styles.row">
        <label :class="styles.label">{{ t("editor.api.requestUrl") }}</label>
        <el-input
          v-model="localConfig.apiUrl"
          size="small"
          placeholder="/api/data"
        />
      </div>

      <!-- Method -->
      <div :class="styles.row">
        <label :class="styles.label">{{ t("editor.api.method") }}</label>
        <el-select v-model="localConfig.apiMethod" size="small" style="flex: 1">
          <el-option
            v-for="opt in methodOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>

      <!-- Headers -->
      <div :class="styles.section">
        <div :class="styles.sectionHeader">
          <span :class="styles.sectionTitle">{{
            t("editor.api.headers")
          }}</span>
          <el-button type="primary" text size="small" @click="addHeader">
            <AppIcon name="plus" />
            {{ t("editor.common.add") }}
          </el-button>
        </div>

        <div
          v-for="(entry, idx) in headerEntries"
          :key="idx"
          :class="styles.headerRow"
        >
          <el-input
            v-model="entry.key"
            size="small"
            :placeholder="t('editor.api.headerName')"
            @change="syncHeaders"
          />
          <el-input
            v-model="entry.value"
            size="small"
            :placeholder="t('editor.api.headerValue')"
            @change="syncHeaders"
          />
          <el-button type="danger" text size="small" @click="removeHeader(idx)">
            <AppIcon name="delete" />
          </el-button>
        </div>
      </div>

      <!-- Response Data Path -->
      <div :class="styles.row">
        <label :class="styles.label">{{ t("editor.api.dataPath") }}</label>
        <el-input
          v-model="localConfig.responseDataPath"
          size="small"
          :placeholder="t('editor.api.dataPathPlaceholder')"
        />
      </div>
    </div>

    <template #footer>
      <el-button size="small" @click="handleClose">{{
        t("editor.common.cancel")
      }}</el-button>
      <el-button type="primary" size="small" @click="handleSave">{{
        t("editor.common.save")
      }}</el-button>
    </template>
  </AppDialog>
</template>
