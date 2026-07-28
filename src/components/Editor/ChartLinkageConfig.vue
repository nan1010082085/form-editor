<script setup lang="ts">
/**
 * ChartLinkageConfig — 图表联动规则配置组件
 *
 * 支持配置：
 * - 触发方式（click/select/hover）
 * - 目标图表（多选）
 * - 参数映射（源字段 -> 目标字段）
 * - 动作类型（filter/drilldown/highlight）
 * - 钻取字段和标签（drilldown 专用）
 */
import { computed } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import type {
  ChartLinkageRule,
  ChartLinkageTrigger,
  ChartLinkageAction,
  Widget,
} from "@/widgets/base/types";
import { generateComponentId } from "@/composables/useIdGenerate";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import styles from "./ChartLinkageConfig.module.scss";

const { t } = useI18n();

const props = defineProps<{
  rules: ChartLinkageRule[];
  sourceWidgetId: string;
  allWidgets: Widget[];
}>();

const emit = defineEmits<{
  "update:rules": [rules: ChartLinkageRule[]];
}>();

const generateId = () => generateComponentId("chart-linkage");

/** 可选的图表 Widget 列表（排除自身） */
const chartWidgets = computed(() =>
  props.allWidgets.filter(
    (w) => w.id !== props.sourceWidgetId && isChartType(w.type),
  ),
);

/** 判断是否为图表类型 */
function isChartType(type: string): boolean {
  const chartTypes = [
    "bar-chart",
    "stacked-bar-chart",
    "horizontal-bar-chart",
    "line-chart",
    "area-chart",
    "pie-chart",
    "donut-chart",
    "scatter-chart",
    "bubble-chart",
    "radar",
    "filled-radar",
    "gauge",
    "multi-gauge",
    "heatmap",
    "funnel",
    "compare-funnel",
    "candlestick",
    "map",
  ];
  return chartTypes.includes(type);
}

/** 触发方式选项 */
const triggerOptions = computed<
  { label: string; value: ChartLinkageTrigger }[]
>(() => [
  { label: t("editor.chartLinkage.triggerClick"), value: "click" },
  { label: t("editor.chartLinkage.triggerSelect"), value: "select" },
  { label: t("editor.chartLinkage.triggerHover"), value: "hover" },
]);

/** 动作类型选项 */
const actionOptions = computed<{ label: string; value: ChartLinkageAction }[]>(
  () => [
    { label: t("editor.chartLinkage.actionFilter"), value: "filter" },
    { label: t("editor.chartLinkage.actionDrilldown"), value: "drilldown" },
    { label: t("editor.chartLinkage.actionHighlight"), value: "highlight" },
  ],
);

/** 图表 Widget 选项 */
const targetWidgetOptions = computed(() =>
  chartWidgets.value.map((w) => ({
    label: `${w.label ?? w.type} #${w.id.slice(-5)}`,
    value: w.id,
  })),
);

function addRule() {
  const newRule: ChartLinkageRule = {
    id: generateId(),
    sourceWidgetId: props.sourceWidgetId,
    trigger: "click",
    targetWidgetIds: [],
    paramMapping: {},
    action: "filter",
  };
  emit("update:rules", [...props.rules, newRule]);
}

function removeRule(index: number) {
  const updated = props.rules.filter((_, i) => i !== index);
  emit("update:rules", updated);
}

function updateRule<K extends keyof ChartLinkageRule>(
  index: number,
  field: K,
  value: ChartLinkageRule[K],
) {
  const updated = props.rules.map((item, i) =>
    i === index ? { ...item, [field]: value } : item,
  );
  emit("update:rules", updated);
}

/** 添加参数映射行 */
function addParamMapping(index: number) {
  const updated = props.rules.map((item, i) =>
    i === index
      ? { ...item, paramMapping: { ...item.paramMapping, "": "" } }
      : item,
  );
  emit("update:rules", updated);
}

/** 删除参数映射行 */
function removeParamMapping(ruleIndex: number, sourceKey: string) {
  const rule = props.rules[ruleIndex];
  const { [sourceKey]: _, ...rest } = rule.paramMapping;
  const updated = props.rules.map((item, i) =>
    i === ruleIndex ? { ...item, paramMapping: rest } : item,
  );
  emit("update:rules", updated);
}

/** 更新参数映射的 key（源字段） */
function updateMappingSource(
  ruleIndex: number,
  oldKey: string,
  newKey: string,
) {
  const rule = props.rules[ruleIndex];
  const value = rule.paramMapping[oldKey];
  const { [oldKey]: _, ...rest } = rule.paramMapping;
  const updated = props.rules.map((item, i) =>
    i === ruleIndex
      ? { ...item, paramMapping: { ...rest, [newKey]: value } }
      : item,
  );
  emit("update:rules", updated);
}

/** 更新参数映射的 value（目标字段） */
function updateMappingTarget(
  ruleIndex: number,
  sourceKey: string,
  targetValue: string,
) {
  const updated = props.rules.map((item, i) =>
    i === ruleIndex
      ? {
          ...item,
          paramMapping: { ...item.paramMapping, [sourceKey]: targetValue },
        }
      : item,
  );
  emit("update:rules", updated);
}

/** 获取参数映射条目列表 */
function getMappingEntries(mapping: Record<string, string>) {
  return Object.entries(mapping);
}
</script>

<template>
  <div :class="styles['chart-linkage-config']">
    <div
      v-if="rules.length === 0"
      :class="styles['chart-linkage-config__empty']"
    >
      {{ t("editor.chartLinkage.emptyHint") }}
    </div>

    <div
      v-for="(rule, idx) in rules"
      :key="rule.id"
      :class="styles['chart-linkage-config__item']"
    >
      <div :class="styles['chart-linkage-config__item-header']">
        <span :class="styles['chart-linkage-config__item-title']">{{
          t("editor.chartLinkage.ruleTitle", { index: idx + 1 })
        }}</span>
        <el-button type="danger" link size="small" @click="removeRule(idx)">
          <AppIcon name="delete" />
        </el-button>
      </div>

      <!-- 触发方式 -->
      <div :class="styles['chart-linkage-config__field']">
        <label :class="styles['chart-linkage-config__label']">{{
          t("editor.chartLinkage.triggerType")
        }}</label>
        <el-select
          :model-value="rule.trigger"
          size="small"
          style="width: 100%"
          @update:model-value="
            updateRule(idx, 'trigger', $event as ChartLinkageTrigger)
          "
        >
          <el-option
            v-for="opt in triggerOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>

      <!-- 目标图表 -->
      <div :class="styles['chart-linkage-config__field']">
        <label :class="styles['chart-linkage-config__label']">{{
          t("editor.chartLinkage.targetChart")
        }}</label>
        <el-select
          :model-value="rule.targetWidgetIds"
          size="small"
          multiple
          filterable
          style="width: 100%"
          :placeholder="t('editor.chartLinkage.targetChartPlaceholder')"
          @update:model-value="
            updateRule(idx, 'targetWidgetIds', $event as string[])
          "
        >
          <el-option
            v-for="opt in targetWidgetOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>

      <!-- 联动动作 -->
      <div :class="styles['chart-linkage-config__field']">
        <label :class="styles['chart-linkage-config__label']">{{
          t("editor.chartLinkage.linkageAction")
        }}</label>
        <el-select
          :model-value="rule.action"
          size="small"
          style="width: 100%"
          @update:model-value="
            updateRule(idx, 'action', $event as ChartLinkageAction)
          "
        >
          <el-option
            v-for="opt in actionOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>

      <!-- 钻取字段（drilldown 专用） -->
      <div
        v-if="rule.action === 'drilldown'"
        :class="styles['chart-linkage-config__field']"
      >
        <label :class="styles['chart-linkage-config__label']">{{
          t("editor.chartLinkage.drilldownField")
        }}</label>
        <el-input
          :model-value="rule.drilldownField ?? ''"
          size="small"
          :placeholder="t('editor.chartLinkage.drilldownFieldPlaceholder')"
          @update:model-value="
            updateRule(idx, 'drilldownField', $event || undefined)
          "
        />
      </div>

      <!-- 钻取标签（drilldown 专用） -->
      <div
        v-if="rule.action === 'drilldown'"
        :class="styles['chart-linkage-config__field']"
      >
        <label :class="styles['chart-linkage-config__label']">{{
          t("editor.chartLinkage.drilldownLabel")
        }}</label>
        <el-input
          :model-value="rule.drilldownLabel ?? ''"
          size="small"
          :placeholder="t('editor.chartLinkage.drilldownLabelPlaceholder')"
          @update:model-value="
            updateRule(idx, 'drilldownLabel', $event || undefined)
          "
        />
      </div>

      <!-- 参数映射 -->
      <div :class="styles['chart-linkage-config__field']">
        <label :class="styles['chart-linkage-config__label']">{{
          t("editor.chartLinkage.paramMapping")
        }}</label>
        <div :class="styles['chart-linkage-config__param-section']">
          <div :class="styles['chart-linkage-config__param-header']">
            <span :class="styles['chart-linkage-config__param-title']">{{
              t("editor.chartLinkage.sourceMapping")
            }}</span>
            <el-button
              type="primary"
              link
              size="small"
              @click="addParamMapping(idx)"
            >
              <AppIcon name="plus" />
              {{ t("editor.common.add") }}
            </el-button>
          </div>

          <div
            v-for="([sourceKey, targetVal], mi) in getMappingEntries(
              rule.paramMapping,
            )"
            :key="mi"
            :class="styles['chart-linkage-config__mapping-row']"
          >
            <el-input
              :model-value="sourceKey"
              size="small"
              :placeholder="t('editor.chartLinkage.sourceField')"
              style="flex: 1"
              @update:model-value="updateMappingSource(idx, sourceKey, $event)"
            />
            <span :class="styles['chart-linkage-config__mapping-arrow']"
              >→</span
            >
            <el-input
              :model-value="targetVal"
              size="small"
              :placeholder="t('editor.chartLinkage.targetField')"
              style="flex: 1"
              @update:model-value="updateMappingTarget(idx, sourceKey, $event)"
            />
            <el-button
              type="danger"
              size="small"
              link
              @click="removeParamMapping(idx, sourceKey)"
            >
              <AppIcon name="delete" />
            </el-button>
          </div>

          <div
            v-if="getMappingEntries(rule.paramMapping).length === 0"
            style="
              text-align: center;
              color: #909399;
              font-size: 11px;
              padding: 4px 0;
            "
          >
            {{ t("editor.chartLinkage.addMappingHint") }}
          </div>
        </div>
      </div>
    </div>

    <el-button
      type="primary"
      plain
      size="small"
      style="width: 100%; margin-top: 8px"
      @click="addRule"
    >
      <AppIcon name="plus" />
      {{ t("editor.chartLinkage.addRule") }}
    </el-button>
  </div>
</template>
