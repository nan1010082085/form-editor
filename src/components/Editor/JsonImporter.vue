<script setup lang="ts">
/**
 * JsonImporter -- Dialog for importing a JSON response and inferring schema.
 *
 * Flow: paste JSON (or fetch from URL) -> parse -> preview inferences -> override types -> generate schema.
 */
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "@schema-platform/platform-shared";
import { apiClient } from "@/utils/apiClient";
import {
  inferFieldsFromJson,
  fieldInferencesToSchema,
  type FieldInference,
} from "@/utils/jsonToSchema";
import type {
  PartialWidget,
  SchemaType,
} from "@/components/WidgetRenderer/types";
import styles from "./JsonImporter.module.scss";

const emit = defineEmits<{
  import: [schema: PartialWidget[]];
}>();

const { t } = useI18n();
const visible = ref(false);
const jsonText = ref("");
const parseError = ref("");
const inferences = ref<FieldInference[]>([]);
const step = ref<"input" | "preview">("input");

/** URL fetching state */
const fetchUrl = ref("");
const fetching = ref(false);
const fetchError = ref("");
const inputMode = ref<"paste" | "url">("paste");

/** SchemaType options for override dropdown */
const schemaTypeOptions = computed(() => [
  { label: t("editor.jsonImporter.typeInput"), value: "input" as SchemaType },
  { label: t("editor.jsonImporter.typeNumber"), value: "number" as SchemaType },
  { label: t("editor.jsonImporter.typeSelect"), value: "select" as SchemaType },
  { label: t("editor.jsonImporter.typeRadio"), value: "radio" as SchemaType },
  {
    label: t("editor.jsonImporter.typeCheckbox"),
    value: "checkbox" as SchemaType,
  },
  { label: t("editor.jsonImporter.typeDate"), value: "date" as SchemaType },
  {
    label: t("editor.jsonImporter.typeTextarea"),
    value: "textarea" as SchemaType,
  },
  {
    label: t("editor.jsonImporter.typeRichtext"),
    value: "richtext" as SchemaType,
  },
  { label: t("editor.jsonImporter.typeUpload"), value: "upload" as SchemaType },
  { label: t("editor.jsonImporter.typeTable"), value: "table" as SchemaType },
  {
    label: t("editor.jsonImporter.typeTransfer"),
    value: "transfer" as SchemaType,
  },
  { label: t("editor.jsonImporter.typeCard"), value: "card" as SchemaType },
]);

function open() {
  jsonText.value = "";
  fetchUrl.value = "";
  parseError.value = "";
  fetchError.value = "";
  inferences.value = [];
  step.value = "input";
  inputMode.value = "paste";
  visible.value = true;
}

function handleParse() {
  parseError.value = "";
  inferences.value = [];

  if (!jsonText.value.trim()) {
    parseError.value = t("editor.jsonImporter.parsePasteHint");
    return;
  }

  try {
    const parsed = JSON.parse(jsonText.value) as unknown;
    const result = inferFieldsFromJson(parsed);
    if (result.length === 0) {
      parseError.value = t("editor.jsonImporter.inferFailHint");
      return;
    }
    inferences.value = result;
    step.value = "preview";
  } catch {
    parseError.value = t("editor.jsonImporter.invalidJson");
  }
}

/** Extract data array from wrapped API response before inferring */
function extractDataArray(res: unknown): unknown {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    const obj = res as Record<string, unknown>;
    const list = obj.data ?? obj.list ?? obj.rows ?? obj.items;
    if (Array.isArray(list)) return list;
  }
  return res;
}

/** Fetch JSON from URL and infer fields */
async function handleFetchFromUrl() {
  if (!fetchUrl.value.trim()) return;

  fetching.value = true;
  fetchError.value = "";
  try {
    const res: unknown = await apiClient.requestUrl("get", fetchUrl.value);

    // Extract data array from wrapped response
    const dataSource = extractDataArray(res);

    // Store as formatted JSON for display
    jsonText.value = JSON.stringify(dataSource, null, 2);

    const result = inferFieldsFromJson(dataSource);
    if (result.length === 0) {
      fetchError.value = t("editor.jsonImporter.inferFromUrlFail");
      return;
    }
    inferences.value = result;
    step.value = "preview";
    ElMessage.success(
      t("editor.jsonImporter.fetchAnalyzed", { count: result.length }),
    );
  } catch (e: unknown) {
    fetchError.value =
      e instanceof Error ? e.message : t("editor.jsonImporter.requestFailed");
  } finally {
    fetching.value = false;
  }
}

function handleOverrideType(index: number, type: SchemaType) {
  inferences.value = inferences.value.map((item, i) =>
    i === index ? { ...item, type } : item,
  );
}

function handleGenerate() {
  const schema = fieldInferencesToSchema(inferences.value);
  emit("import", schema);
  visible.value = false;
  ElMessage.success(
    t("editor.jsonImporter.schemaGenerated", { count: schema.length }),
  );
}

function handleBack() {
  step.value = "input";
}

defineExpose({ open });
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="t('editor.jsonImporter.dialogTitle')"
    width="700px"
    :close-on-click-modal="false"
    :append-to-body="true"
    destroy-on-close
    @close="visible = false"
  >
    <!-- Step 1: Paste JSON or Fetch from URL -->
    <div v-if="step === 'input'" :class="styles['json-importer__input']">
      <!-- Input mode tabs -->
      <div :class="styles['json-importer__mode-tabs']">
        <button
          :class="[
            styles['json-importer__mode-tab'],
            {
              [styles['json-importer__mode-tab--active']]:
                inputMode === 'paste',
            },
          ]"
          @click="inputMode = 'paste'"
        >
          {{ t("editor.jsonImporter.pasteJson") }}
        </button>
        <button
          :class="[
            styles['json-importer__mode-tab'],
            {
              [styles['json-importer__mode-tab--active']]: inputMode === 'url',
            },
          ]"
          @click="inputMode = 'url'"
        >
          {{ t("editor.jsonImporter.fetchFromUrl") }}
        </button>
      </div>

      <!-- Paste mode -->
      <template v-if="inputMode === 'paste'">
        <el-input
          v-model="jsonText"
          type="textarea"
          :rows="14"
          :placeholder="t('editor.jsonImporter.pastePlaceholder')"
        />
        <div v-if="parseError" :class="styles['json-importer__error']">
          {{ parseError }}
        </div>
      </template>

      <!-- URL fetch mode -->
      <template v-else>
        <div :class="styles['json-importer__url-section']">
          <div :class="styles['json-importer__url-row']">
            <el-input
              v-model="fetchUrl"
              size="small"
              :placeholder="t('editor.jsonImporter.urlPlaceholder')"
              @keyup.enter="handleFetchFromUrl"
            />
            <el-button
              type="primary"
              size="small"
              :loading="fetching"
              @click="handleFetchFromUrl"
            >
              {{ t("editor.jsonImporter.fetch") }}
            </el-button>
          </div>
          <div v-if="fetchError" :class="styles['json-importer__error']">
            {{ fetchError }}
          </div>
          <div
            v-if="jsonText"
            :class="styles['json-importer__fetched-preview']"
          >
            <label :class="styles['json-importer__label']">{{
              t("editor.jsonImporter.fetchedResponse")
            }}</label>
            <el-input
              :model-value="jsonText"
              type="textarea"
              :rows="8"
              readonly
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Step 2: Preview & Override -->
    <div v-else :class="styles['json-importer__preview']">
      <p :class="styles['json-importer__summary']">
        {{
          t("editor.jsonImporter.fieldsDetected", { count: inferences.length })
        }}
      </p>
      <el-table :data="inferences" border size="small" max-height="400">
        <el-table-column
          prop="field"
          :label="t('editor.jsonImporter.colFieldName')"
          min-width="140"
        />
        <el-table-column
          prop="label"
          :label="t('editor.jsonImporter.colLabel')"
          min-width="120"
        />
        <el-table-column :label="t('editor.jsonImporter.colType')" width="160">
          <template #default="{ row, $index }">
            <el-select
              :model-value="row.type"
              size="small"
              style="width: 100%"
              @update:model-value="
                handleOverrideType($index, $event as SchemaType)
              "
            >
              <el-option
                v-for="opt in schemaTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('editor.jsonImporter.colSample')"
          min-width="160"
        >
          <template #default="{ row }">
            <span :class="styles['json-importer__sample']">
              {{
                typeof row.sample === "object"
                  ? JSON.stringify(row.sample)
                  : String(row.sample ?? "")
              }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="visible = false">{{
        t("editor.jsonImporter.cancel")
      }}</el-button>
      <template v-if="step === 'input' && inputMode === 'paste'">
        <el-button type="primary" @click="handleParse">{{
          t("editor.jsonImporter.parse")
        }}</el-button>
      </template>
      <template v-else-if="step === 'preview'">
        <el-button @click="handleBack">{{
          t("editor.jsonImporter.back")
        }}</el-button>
        <el-button type="primary" @click="handleGenerate">{{
          t("editor.jsonImporter.generateSchema")
        }}</el-button>
      </template>
    </template>
  </el-dialog>
</template>
