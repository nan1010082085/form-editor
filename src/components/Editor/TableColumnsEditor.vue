<script setup lang="ts">
/**
 * TableColumnsEditor -- CRUD editor for TableColumn[]
 *
 * Simplified column editor for the Table widget.
 * Each column row has: prop, label, width, fixed.
 */
import type { TableColumn } from "../../widgets/table/config";
import styles from "./TableColumnsEditor.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import { useI18n } from "@schema-platform/platform-shared";

const { t } = useI18n();

const props = defineProps<{
  columns: TableColumn[];
}>();

const emit = defineEmits<{
  "update:columns": [columns: TableColumn[]];
}>();

const fixedOptions = [
  {
    label: t("editor.columnsEditor.fixedNone"),
    value: undefined as string | undefined,
  },
  { label: t("editor.columnsEditor.fixedLeft"), value: "left" as const },
  { label: t("editor.columnsEditor.fixedRight"), value: "right" as const },
];

function addColumn() {
  const col: TableColumn = {
    prop: "",
    label: "",
    width: undefined,
    fixed: undefined,
  };
  emit("update:columns", [...props.columns, col]);
}

function removeColumn(index: number) {
  emit(
    "update:columns",
    props.columns.filter((_, i) => i !== index),
  );
}

function moveUp(index: number) {
  if (index === 0) return;
  const updated = [...props.columns];
  [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
  emit("update:columns", updated);
}

function moveDown(index: number) {
  if (index >= props.columns.length - 1) return;
  const updated = [...props.columns];
  [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
  emit("update:columns", updated);
}

function updateColumn<K extends keyof TableColumn>(
  index: number,
  field: K,
  value: TableColumn[K],
) {
  const updated = props.columns.map((col, i) =>
    i === index ? { ...col, [field]: value } : col,
  );
  emit("update:columns", updated);
}
</script>

<template>
  <div :class="styles.editor">
    <div v-if="columns.length === 0" :class="styles.empty">
      {{ t("editor.columnsEditor.emptyHint") }}
    </div>

    <div v-for="(col, idx) in columns" :key="idx" :class="styles.item">
      <div :class="styles.itemHeader">
        <span :class="styles.itemTitle">{{
          t("editor.columnsEditor.columnTitle", { index: idx + 1 })
        }}</span>
        <div :class="styles.itemActions">
          <el-button
            size="small"
            link
            :disabled="idx === 0"
            @click="moveUp(idx)"
          >
            <AppIcon name="arrow-up" />
          </el-button>
          <el-button
            size="small"
            link
            :disabled="idx === columns.length - 1"
            @click="moveDown(idx)"
          >
            <AppIcon name="arrow-down" />
          </el-button>
          <el-button type="danger" size="small" link @click="removeColumn(idx)">
            <AppIcon name="delete" />
          </el-button>
        </div>
      </div>

      <div :class="styles.field">
        <label :class="styles.label">{{
          t("editor.columnsEditor.fieldName")
        }}</label>
        <el-input
          :model-value="col.prop"
          size="small"
          :placeholder="t('editor.columnsEditor.fieldName')"
          @update:model-value="updateColumn(idx, 'prop', $event)"
        />
      </div>

      <div :class="styles.field">
        <label :class="styles.label">{{
          t("editor.columnsEditor.label")
        }}</label>
        <el-input
          :model-value="col.label"
          size="small"
          :placeholder="t('editor.columnsEditor.labelPlaceholder')"
          @update:model-value="updateColumn(idx, 'label', $event)"
        />
      </div>

      <div :class="styles.field">
        <label :class="styles.label">{{
          t("editor.columnsEditor.widthMode")
        }}</label>
        <el-switch
          :model-value="col.width === 'auto'"
          :active-text="t('editor.columnsEditor.widthAuto')"
          :inactive-text="t('editor.columnsEditor.widthFixed')"
          @update:model-value="
            (v: boolean) => updateColumn(idx, 'width', v ? 'auto' : undefined)
          "
        />
      </div>

      <div v-if="col.width !== 'auto'" :class="styles.field">
        <label :class="styles.label"
          >{{ t("editor.columnsEditor.width") }} (px)</label
        >
        <el-input-number
          :model-value="col.width"
          size="small"
          controls-position="right"
          :min="0"
          :max="2000"
          :placeholder="t('editor.columnsEditor.widthPlaceholder')"
          style="width: 100%"
          @update:model-value="updateColumn(idx, 'width', $event ?? undefined)"
        />
      </div>

      <div :class="styles.field">
        <label :class="styles.label"
          >{{ t("editor.columnsEditor.minWidth") }} (px)</label
        >
        <el-input-number
          :model-value="col.minWidth"
          size="small"
          controls-position="right"
          :min="0"
          :max="2000"
          :placeholder="t('editor.columnsEditor.minWidthPlaceholder')"
          style="width: 100%"
          @update:model-value="
            updateColumn(idx, 'minWidth', $event ?? undefined)
          "
        />
      </div>

      <div :class="styles.field">
        <label :class="styles.label">{{
          t("editor.columnsEditor.fixedColumn")
        }}</label>
        <el-select
          :model-value="col.fixed"
          size="small"
          style="width: 100%"
          @update:model-value="updateColumn(idx, 'fixed', $event)"
        >
          <el-option
            v-for="opt in fixedOptions"
            :key="String(opt.value)"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>
    </div>

    <el-button
      type="primary"
      size="small"
      plain
      style="width: 100%; margin-top: 8px"
      @click="addColumn"
    >
      <AppIcon name="plus" />
      {{ t("editor.columnsEditor.addColumn") }}
    </el-button>
  </div>
</template>
