<script setup lang="ts">
/**
 * ConditionBuilder — 结构化Condition表达式构建器
 *
 * 支持三类引用：FormField、变量、Component暴露Value
 * 支持 AND / OR 逻辑组合
 * 双向Sync表达式字符串
 */
import { ref, computed, watch } from "vue";
import { useConditionReferences } from "@/composables/useConditionReferences";
import { useI18n } from "@schema-platform/platform-shared";
import styles from "./ConditionBuilder.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

interface ConditionClause {
  field: string;
  operator: string;
  value: string;
  logic: "&&" | "||";
}

const props = defineProps<{
  modelValue?: string;
  required?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// ---- 引用Options（Field + 变量 + 暴露Value） ----
const { fieldRefs, variableRefs, exposedRefs } = useConditionReferences();
const { t } = useI18n();

// ---- 运算符Options ----
const operatorOptions = computed(() => [
  { label: t("editor.conditionUi.opEqual"), value: "==", needsValue: true },
  { label: t("editor.conditionUi.opNotEqual"), value: "!=", needsValue: true },
  { label: t("editor.conditionUi.opGreater"), value: ">", needsValue: true },
  { label: t("editor.conditionUi.opLess"), value: "<", needsValue: true },
  {
    label: t("editor.conditionUi.opGreaterEqual"),
    value: ">=",
    needsValue: true,
  },
  { label: t("editor.conditionUi.opLessEqual"), value: "<=", needsValue: true },
  {
    label: t("editor.conditionUi.opContains"),
    value: "includes",
    needsValue: true,
  },
  {
    label: t("editor.conditionUi.opTruthy"),
    value: "truthy",
    needsValue: false,
  },
  { label: t("editor.conditionUi.opFalsy"), value: "falsy", needsValue: false },
]);

// ---- Condition子句Column表 ----
const clauses = ref<ConditionClause[]>([]);

/** 从表达式字符串Parse子句 */
function parseExpression(expr: string): ConditionClause[] {
  if (!expr?.trim()) return [];

  // 按 || Min割为 OR 组, 每组内部按 && Min割
  const orGroups = expr
    .split("||")
    .map((s) => s.trim())
    .filter(Boolean);
  const result: ConditionClause[] = [];

  for (let gi = 0; gi < orGroups.length; gi++) {
    const andParts = orGroups[gi]
      .split("&&")
      .map((s) => s.trim())
      .filter(Boolean);
    for (let ai = 0; ai < andParts.length; ai++) {
      const part = andParts[ai];
      const isFirst = gi === 0 && ai === 0;
      const logic: "&&" | "||" = isFirst ? "&&" : ai === 0 ? "||" : "&&";

      // 匹配 field op value 模式（支持 exposed.xxx.value 和 variables.xxx 作为 field）
      const match = part.match(/^([\w.]+)\s*(===?|!==?|>=|<=|>|<)\s*(.+)$/);
      if (match) {
        let val = match[3].trim();
        if (
          (val.startsWith("'") && val.endsWith("'")) ||
          (val.startsWith('"') && val.endsWith('"'))
        ) {
          val = val.slice(1, -1);
        }
        result.push({ field: match[1], operator: match[2], value: val, logic });
        continue;
      }

      // 匹配 field.includes(value)
      const includesMatch = part.match(/^([\w.]+)\.includes\((.+)\)$/);
      if (includesMatch) {
        let val = includesMatch[2].trim();
        if (
          (val.startsWith("'") && val.endsWith("'")) ||
          (val.startsWith('"') && val.endsWith('"'))
        ) {
          val = val.slice(1, -1);
        }
        result.push({
          field: includesMatch[1],
          operator: "includes",
          value: val,
          logic,
        });
        continue;
      }

      // 匹配 !!field 或 !field
      if (part.startsWith("!!")) {
        result.push({
          field: part.slice(2),
          operator: "truthy",
          value: "",
          logic,
        });
        continue;
      }
      if (part.startsWith("!")) {
        result.push({
          field: part.slice(1),
          operator: "falsy",
          value: "",
          logic,
        });
        continue;
      }

      result.push({ field: "", operator: "==", value: part, logic });
    }
  }

  return result;
}

/** 从子句Column表生成表达式字符串 */
function buildExpression(cls: ConditionClause[]): string {
  const parts: string[] = [];
  for (const c of cls) {
    if (!c.field) continue;
    const op = operatorOptions.value.find((o) => o.value === c.operator);
    if (!op) continue;

    let expr: string;
    if (c.operator === "truthy") {
      expr = `!!${c.field}`;
    } else if (c.operator === "falsy") {
      expr = `!${c.field}`;
    } else if (c.operator === "includes") {
      const val = isNaN(Number(c.value)) ? `'${c.value}'` : c.value;
      expr = `${c.field}.includes(${val})`;
    } else {
      const val = isNaN(Number(c.value)) ? `'${c.value}'` : c.value;
      expr = `${c.field} ${c.operator} ${val}`;
    }

    if (parts.length > 0) {
      parts.push(c.logic === "||" ? " || " : " && ");
    }
    parts.push(expr);
  }
  return parts.join("");
}

// ---- Sync：外部表达式 → 内部子句 ----
watch(
  () => props.modelValue,
  (expr) => {
    const parsed = parseExpression(expr ?? "");
    const current = buildExpression(clauses.value);
    if ((expr ?? "") !== current) {
      clauses.value = parsed.length > 0 ? parsed : [];
    }
  },
  { immediate: true },
);

// ---- Sync：内部子句 → 外部表达式 ----
function syncToExpression() {
  const expr = buildExpression(clauses.value);
  emit("update:modelValue", expr);
}

// ---- CRUD ----
function addClause() {
  const logic = clauses.value.length > 0 ? "&&" : "&&";
  clauses.value.push({ field: "", operator: "==", value: "", logic });
}

function removeClause(index: number) {
  clauses.value.splice(index, 1);
  syncToExpression();
}

function updateClause(index: number, key: keyof ConditionClause, val: string) {
  (clauses.value[index] as Record<string, unknown>)[key] = val;
  syncToExpression();
}

function needsValue(operator: string): boolean {
  return (
    operatorOptions.value.find((o) => o.value === operator)?.needsValue ?? true
  );
}
</script>

<template>
  <div :class="styles.builder">
    <div v-for="(clause, ci) in clauses" :key="ci" :class="styles.clause">
      <!-- 逻辑切换（非第一个子句） -->
      <el-select
        v-if="ci > 0"
        :model-value="clause.logic"
        :class="styles.logicSelect"
        @update:model-value="updateClause(ci, 'logic', $event)"
      >
        <el-option :label="t('editor.conditionUi.logicAnd')" value="&&" />
        <el-option :label="t('editor.conditionUi.logicOr')" value="||" />
      </el-select>

      <!-- Field选择（Group） -->
      <el-select
        :model-value="clause.field"
        filterable
        :placeholder="t('editor.conditionUi.selectField')"
        :class="styles.fieldSelect"
        @update:model-value="updateClause(ci, 'field', $event)"
      >
        <el-option-group
          v-if="fieldRefs.length > 0"
          :label="t('editor.conditionUi.groupFormField')"
        >
          <el-option
            v-for="opt in fieldRefs"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-option-group>
        <el-option-group
          v-if="variableRefs.length > 0"
          :label="t('editor.conditionUi.groupVariable')"
        >
          <el-option
            v-for="opt in variableRefs"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-option-group>
        <el-option-group
          v-if="exposedRefs.length > 0"
          :label="t('editor.conditionUi.groupExposed')"
        >
          <el-option
            v-for="opt in exposedRefs"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-option-group>
      </el-select>

      <!-- 运算符 -->
      <el-select
        :model-value="clause.operator"
        :class="styles.opSelect"
        @update:model-value="updateClause(ci, 'operator', $event)"
      >
        <el-option
          v-for="op in operatorOptions"
          :key="op.value"
          :label="op.label"
          :value="op.value"
        />
      </el-select>

      <!-- ValueInput -->
      <el-input
        v-if="needsValue(clause.operator)"
        :model-value="clause.value"
        :placeholder="t('editor.conditionUi.compareValue')"
        :class="styles.valueInput"
        @update:model-value="updateClause(ci, 'value', $event)"
      />

      <!-- Delete -->
      <el-button type="danger" size="small" text @click="removeClause(ci)">
        <AppIcon name="delete" />
      </el-button>
    </div>

    <!-- 空Status -->
    <div v-if="clauses.length === 0" :class="styles.empty">
      {{
        required
          ? t("editor.conditionUi.emptyRequired")
          : t("editor.conditionUi.emptyOptional")
      }}
    </div>

    <!-- 添加Condition -->
    <el-button type="primary" size="small" text @click="addClause">
      <AppIcon name="plus" />
      {{ t("editor.conditionUi.addCondition") }}
    </el-button>

    <!-- 表达式预览 -->
    <div v-if="clauses.length > 0" :class="styles.preview">
      <span :class="styles.previewLabel">{{
        t("editor.conditionUi.expressionLabel")
      }}</span>
      <code :class="styles.previewCode">{{ modelValue || "..." }}</code>
    </div>
  </div>
</template>
