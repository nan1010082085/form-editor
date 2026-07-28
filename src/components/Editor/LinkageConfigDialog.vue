<script setup lang="ts">
/**
 * LinkageConfigDialog — WidgetEvent[] 规则配置对话框
 *
 * 每条规则输出一个 WidgetEvent：
 * - trigger: 'change'（由监听字段值变化驱动）
 * - condition: 条件表达式
 * - actions: SchemaEventAction[]（直接对接事件引擎）
 */
import { ref, watch, computed } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { useWidgetOptions } from "@/composables/useWidgetOptions";
import type { WidgetEvent, SchemaEventAction } from "../../widgets/base/types";
import AppDialog from "@schema-platform/platform-shared/components/common/AppDialog.vue";
import ConditionBuilder from "@/components/Editor/ConditionBuilder.vue";
import ActionListEditor from "@/components/Editor/ActionListEditor.vue";
import type { ActionTypeOption } from "@/components/Editor/ActionListEditor.vue";
import FlowPreview from "@/components/Editor/FlowPreview.vue";
import type { FlowItem } from "@/components/Editor/FlowPreview.vue";
import styles from "./LinkageConfigDialog.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  events: WidgetEvent[];
}>();

const emit = defineEmits<{
  "update:visible": [val: boolean];
  save: [events: WidgetEvent[]];
}>();

// ---- 部件字段选项 ----
const { allWidgetOptions } = useWidgetOptions();

// ---- 内部编辑模型（与 UI 绑定） ----

interface RuleUI {
  watches: { source: string }[];
  condition: string;
  actions: SchemaEventAction[];
}

const localRules = ref<RuleUI[]>([]);

/** WidgetEvent[] → RuleUI[] 用于编辑 */
function fromEvents(events: WidgetEvent[]): RuleUI[] {
  return events.map((ev) => ({
    watches: [],
    condition: ev.condition ?? "",
    actions: JSON.parse(JSON.stringify(ev.actions)),
  }));
}

/** RuleUI[] → WidgetEvent[] 用于保存 */
function toEvents(rules: RuleUI[]): WidgetEvent[] {
  return rules
    .filter((r) => r.actions.length > 0)
    .map((r) => ({
      trigger: "change",
      condition: r.condition || undefined,
      actions: r.actions,
    }))
    .filter((ev) => ev.actions.length > 0);
}

watch(
  () => props.visible,
  (open) => {
    if (open) {
      localRules.value = fromEvents(
        JSON.parse(JSON.stringify(props.events ?? [])),
      );
      if (localRules.value.length === 0) {
        addRule();
      }
    }
  },
);

// ---- 选项常量 ----

const actionTypeOptions = computed<ActionTypeOption[]>(() => [
  { label: t("editor.linkageDialog.actionOpenDialog"), value: "open-dialog" },
  { label: t("editor.linkageDialog.actionCloseDialog"), value: "close-dialog" },
  { label: t("editor.linkageDialog.actionHide"), value: "hide" },
  { label: t("editor.linkageDialog.actionShow"), value: "visible" },
  { label: t("editor.linkageDialog.actionDisable"), value: "disabled" },
  { label: t("editor.linkageDialog.actionSetValue"), value: "set-value" },
  { label: t("editor.linkageDialog.actionFetchData"), value: "fetch-data" },
  { label: t("editor.linkageDialog.actionSetVariable"), value: "set-variable" },
  {
    label: t("editor.linkageDialog.actionTriggerEvent"),
    value: "trigger-event",
  },
  { label: t("editor.linkageDialog.actionSubmit"), value: "submit" },
  { label: t("editor.linkageDialog.actionReset"), value: "reset" },
  { label: t("editor.linkageDialog.actionNavigate"), value: "navigate" },
]);

// ---- 规则 CRUD ----

function addRule() {
  localRules.value.push({
    watches: [],
    condition: "",
    actions: [],
  });
}

function removeRule(index: number) {
  localRules.value.splice(index, 1);
}

// ---- 监听字段 CRUD ----

function addWatch(ruleIndex: number) {
  localRules.value[ruleIndex].watches.push({ source: "" });
}

function removeWatch(ruleIndex: number, watchIndex: number) {
  localRules.value[ruleIndex].watches.splice(watchIndex, 1);
}

// ---- 动作更新 ----

function handleActionUpdate(ruleIndex: number, actions: SchemaEventAction[]) {
  localRules.value[ruleIndex].actions = actions;
}

// ---- 保存 / 关闭 ----

function handleSave() {
  emit("save", toEvents(localRules.value));
  emit("update:visible", false);
}

function handleClose() {
  emit("update:visible", false);
}

// ---- 流程预览数据 ----

const actionLabelMap: Record<string, string> = Object.fromEntries(
  actionTypeOptions.value.map((o: ActionTypeOption) => [o.value, o.label]),
);

function getActionLabel(action: SchemaEventAction): string {
  return actionLabelMap[action.type] ?? action.type;
}

function getActionDesc(action: SchemaEventAction): string {
  if (action.target) return action.target;
  if (action.apiUrl) return action.apiUrl;
  if (action.variable) return action.variable;
  if (action.event) return action.event;
  if (action.value) return String(action.value);
  return "";
}

const flowItems = computed<FlowItem[]>(() =>
  localRules.value.map((rule) => {
    const watchDesc = rule.watches
      .filter((w) => w.source)
      .map((w) => w.source)
      .join(", ");

    return {
      type: "trigger" as const,
      label: t("editor.linkageDialog.triggerValueChange"),
      description: watchDesc || undefined,
      children: [
        ...(rule.condition
          ? [
              {
                type: "condition" as const,
                label: t("editor.linkageDialog.condition"),
                description: rule.condition,
              },
            ]
          : []),
        ...rule.actions.map((a) => ({
          type: "action" as const,
          label: getActionLabel(a),
          description: getActionDesc(a),
        })),
      ],
    };
  }),
);
</script>

<template>
  <AppDialog
    :model-value="visible"
    :title="t('editor.linkageDialog.title')"
    width="1100px"
    @update:model-value="emit('update:visible', $event)"
  >
    <div :class="styles.body">
      <!-- 左侧：配置表单 -->
      <div :class="styles.form">
        <!-- 空状态 -->
        <div v-if="localRules.length === 0" :class="styles.empty">
          {{ t("editor.linkageDialog.emptyHint") }}
        </div>

        <!-- 规则列表 -->
        <div v-for="(rule, ri) in localRules" :key="ri" :class="styles.card">
          <div :class="styles.cardHeader">
            <span :class="styles.cardTitle"
              >{{ t("editor.linkageDialog.ruleLabel") }}
              <span :class="styles.cardNum">{{ ri + 1 }}</span></span
            >
            <el-button type="danger" size="small" link @click="removeRule(ri)">
              <AppIcon name="delete" />
            </el-button>
          </div>

          <!-- watches（辅助配置，帮助用户理解触发来源） -->
          <div :class="styles.row">
            <label :class="styles.label">{{
              t("editor.linkageDialog.watch")
            }}</label>
            <div :class="styles.conditionArea">
              <div
                v-for="(w, wi) in rule.watches"
                :key="wi"
                :class="styles.watchRow"
              >
                <el-select
                  v-model="w.source"
                  filterable
                  :placeholder="t('editor.linkageDialog.watchPlaceholder')"
                  style="flex: 1"
                >
                  <el-option
                    v-for="opt in allWidgetOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>

                <el-button
                  type="danger"
                  size="small"
                  link
                  @click="removeWatch(ri, wi)"
                >
                  <AppIcon name="delete" />
                </el-button>
              </div>

              <el-button type="primary" size="small" link @click="addWatch(ri)">
                <AppIcon name="plus" />
                {{ t("editor.linkageDialog.addWatch") }}
              </el-button>
            </div>
          </div>

          <!-- condition -->
          <div :class="styles.row">
            <label :class="styles.label">{{
              t("editor.linkageDialog.condition")
            }}</label>
            <div :class="styles.conditionArea">
              <ConditionBuilder v-model="rule.condition" required />
            </div>
          </div>

          <!-- actions -->
          <ActionListEditor
            :actions="rule.actions"
            :action-types="actionTypeOptions"
            @update:actions="handleActionUpdate(ri, $event)"
          />
        </div>

        <!-- 添加规则 -->
        <el-button type="primary" plain style="width: 100%" @click="addRule">
          <AppIcon name="plus" />
          {{ t("editor.linkageDialog.addRule") }}
        </el-button>
      </div>

      <!-- 右侧：流程预览 -->
      <div :class="styles.preview">
        <div :class="styles.previewTitle">
          {{ t("editor.linkageDialog.flowPreview") }}
        </div>
        <div :class="styles.previewBody">
          <FlowPreview :items="flowItems" />
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">{{
        t("editor.common.cancel")
      }}</el-button>
      <el-button type="primary" @click="handleSave">{{
        t("editor.common.save")
      }}</el-button>
    </template>
  </AppDialog>
</template>
