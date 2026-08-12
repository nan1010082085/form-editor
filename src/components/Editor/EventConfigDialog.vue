<script setup lang="ts">
/**
 * EventConfigDialog -- WidgetEvent[] Config对话框
 *
 * 对每个Event支持：
 * - trigger: TriggerEvent名（select）
 * - condition: Condition表达式（textarea, 可选）
 * - confirm: Confirm提示（input, 可选）
 * - actions[]: ActionColumn表（type + target + value）
 *
 * SaveHrs emit 完整的 WidgetEvent[], 由调用方写入 widget。
 */
import { ref, watch, computed } from "vue";
import type {
  WidgetEvent,
  SchemaEventAction,
  ReceivableEventConfig,
  EventTargetConfig,
} from "../../widgets/base/types";
import { useWidgetStore } from "@/stores/widget";
import { getWidget } from "@/widgets/registry";
import AppDialog from "@schema-platform/platform-shared/components/common/AppDialog.vue";
import ConditionBuilder from "@/components/Editor/ConditionBuilder.vue";
import ActionListEditor from "@/components/Editor/ActionListEditor.vue";
import type { ActionTypeOption } from "@/components/Editor/ActionListEditor.vue";
import FlowPreview from "@/components/Editor/FlowPreview.vue";
import type { FlowItem } from "@/components/Editor/FlowPreview.vue";
import { EVENT_TRIGGER_I18N_KEYS } from "@/engine";
import styles from "./EventConfigDialog.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import { useI18n } from "@schema-platform/platform-shared";

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  events: WidgetEvent[];
  eventTargets?: EventTargetConfig[];
}>();

const emit = defineEmits<{
  "update:visible": [val: boolean];
  save: [events: WidgetEvent[]];
}>();

const widgetStore = useWidgetStore();

// ---- 本地Edit副本 ----

const localEvents = ref<WidgetEvent[]>([]);

watch(
  () => props.visible,
  (open) => {
    if (open) {
      // 深拷贝, Edit期间不影响原始Data
      localEvents.value = JSON.parse(JSON.stringify(props.events ?? []));
    }
  },
);

// ---- Options常量（与 eventEngine.EVENT_TRIGGER_I18N_KEYS 同源） ----

const triggerOptions = computed(() =>
  Object.entries(EVENT_TRIGGER_I18N_KEYS).map(([value, i18nKey]) => ({
    label: t(i18nKey),
    value,
  })),
);

const actionTypeOptions = computed<ActionTypeOption[]>(() => [
  { label: t("editor.eventDialog.actionShow"), value: "show" },
  { label: t("editor.eventDialog.actionHide"), value: "hide" },
  { label: t("editor.eventDialog.actionOpenDialog"), value: "open-dialog" },
  { label: t("editor.eventDialog.actionCloseDialog"), value: "close-dialog" },
  { label: t("editor.eventDialog.actionSwitchTab"), value: "switch-tab" },
  { label: t("editor.eventDialog.actionSetValue"), value: "set-value" },
  { label: t("editor.eventDialog.actionSubmit"), value: "submit" },
  { label: t("editor.eventDialog.actionReset"), value: "reset" },
  { label: t("editor.eventDialog.actionEmit"), value: "emit" },
  { label: t("editor.eventDialog.actionTriggerEvent"), value: "trigger-event" },
  { label: t("editor.eventDialog.actionSetVariable"), value: "set-variable" },
  { label: t("editor.eventDialog.actionCallApi"), value: "api" },
  { label: t("editor.eventDialog.actionNavigate"), value: "navigate" },
  { label: t("editor.eventDialog.actionPostMessage"), value: "post-message" },
  { label: t("editor.eventDialog.actionCopy"), value: "copy" },
  { label: t("editor.eventDialog.actionRefresh"), value: "refresh" },
  { label: t("editor.eventDialog.actionCloseTab"), value: "close-tab" },
  { label: t("editor.eventDialog.actionStartFlow"), value: "startFlow" },
  { label: t("editor.eventDialog.actionEndFlow"), value: "endFlow" },
  {
    label: t("editor.eventDialog.actionSubmitSubmission"),
    value: "submitSubmission",
  },
]);

// ---- 根据目标Component获取可接收Event ----

function getReceivableEvents(targetId: string): ReceivableEventConfig[] {
  const widget = widgetStore.findWidget(targetId);
  if (!widget) return [];
  const registryItem = getWidget(widget.type);
  return registryItem?.config?.receivableEvents ?? [];
}

// ---- Event CRUD ----

function addEvent() {
  localEvents.value.push({
    trigger: "click",
    condition: "",
    confirm: "",
    actions: [],
  });
}

function removeEvent(index: number) {
  localEvents.value.splice(index, 1);
}

// ---- ActionUpdate ----

function handleActionUpdate(eventIndex: number, actions: SchemaEventAction[]) {
  localEvents.value[eventIndex].actions = actions;
}

// ---- Save / Close ----

function handleSave() {
  emit("save", localEvents.value);
  emit("update:visible", false);
}

function handleClose() {
  emit("update:visible", false);
}

// ---- 流程预览Data ----

const triggerLabelMap = computed(() =>
  Object.fromEntries(triggerOptions.value.map((o) => [o.value, o.label])),
);

const actionLabelMap = computed(() =>
  Object.fromEntries(actionTypeOptions.value.map((o) => [o.value, o.label])),
);

function getActionLabel(action: SchemaEventAction): string {
  return actionLabelMap.value[action.type] ?? action.type;
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
  localEvents.value.map((evt) => ({
    type: "trigger",
    label: triggerLabelMap.value[evt.trigger] ?? evt.trigger,
    description: evt.eventTarget || undefined,
    children: [
      ...(evt.condition
        ? [
            {
              type: "condition" as const,
              label: t("editor.eventDialog.condition"),
              description: evt.condition,
            },
          ]
        : []),
      ...(evt.confirm
        ? [
            {
              type: "action" as const,
              label: t("editor.eventDialog.confirm"),
              description: evt.confirm,
            },
          ]
        : []),
      ...evt.actions.map((a) => ({
        type: "action" as const,
        label: getActionLabel(a),
        description: getActionDesc(a),
      })),
    ],
  })),
);
</script>

<template>
  <AppDialog
    :model-value="visible"
    :title="t('editor.eventDialog.title')"
    width="1000px"
    @update:model-value="emit('update:visible', $event)"
  >
    <div :class="[styles.body, 'editor-ui']">
      <!-- 左侧：ConfigForm -->
      <div :class="styles.form">
        <!-- 空Status -->
        <EmptyState
          v-if="localEvents.length === 0"
          icon="lightning"
          :title="t('editor.eventDialog.emptyHint')"
        />

        <!-- EventColumn表 -->
        <div v-for="(evt, ei) in localEvents" :key="ei" :class="styles.card">
          <div :class="styles.cardHeader">
            <span :class="styles.cardTitle"
              >{{ t("editor.eventDialog.event") }}
              <span :class="styles.cardNum">{{ ei + 1 }}</span></span
            >
            <el-button type="danger" size="small" text @click="removeEvent(ei)">
              <AppIcon name="delete" />
            </el-button>
          </div>

          <!-- trigger -->
          <div :class="styles.row">
            <label :class="styles.label">{{
              t("editor.eventDialog.trigger")
            }}</label>
            <el-select v-model="evt.trigger" style="flex: 1">
              <el-option
                v-for="opt in triggerOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>

          <!-- eventTarget -->
          <div v-if="eventTargets?.length" :class="styles.row">
            <label :class="styles.label">{{
              t("editor.eventDialog.target")
            }}</label>
            <el-select
              v-model="evt.eventTarget"
              style="flex: 1"
              clearable
              :placeholder="t('editor.eventDialog.entireWidget')"
            >
              <el-option
                v-for="t in eventTargets"
                :key="t.id"
                :label="t.label"
                :value="t.id"
              >
                <span>{{ t.label }}</span>
                <span
                  v-if="t.description"
                  style="
                    color: var(--text-color-muted);
                    font-size: 12px;
                    margin-left: 8px;
                  "
                  >{{ t.description }}</span
                >
              </el-option>
            </el-select>
          </div>

          <!-- condition -->
          <div :class="styles.row">
            <label :class="styles.label">{{
              t("editor.eventDialog.condition")
            }}</label>
            <div :class="styles.conditionArea">
              <ConditionBuilder v-model="evt.condition" />
            </div>
          </div>

          <!-- confirm -->
          <div :class="styles.row">
            <label :class="styles.label">{{
              t("editor.eventDialog.confirm")
            }}</label>
            <el-input
              v-model="evt.confirm"
              :placeholder="t('editor.eventDialog.confirmPlaceholder')"
            />
          </div>

          <!-- actions -->
          <ActionListEditor
            :actions="evt.actions"
            :action-types="actionTypeOptions"
            :get-receivable-events="getReceivableEvents"
            @update:actions="handleActionUpdate(ei, $event)"
          />
        </div>

        <!-- 添加Event -->
        <el-button type="primary" plain style="width: 100%" @click="addEvent">
          <AppIcon name="plus" />
          {{ t("editor.eventDialog.addEvent") }}
        </el-button>
      </div>

      <!-- 右侧：流程预览 -->
      <div :class="styles.preview">
        <div :class="styles.previewTitle">
          {{ t("editor.eventDialog.eventFlowPreview") }}
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
