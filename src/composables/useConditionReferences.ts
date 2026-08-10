/**
 * useConditionReferences — 收集所有可用于Condition表达式的引用
 *
 * 三类引用：
 * - FormField：有 field Property的Component → 直接用 field 名（如 status）
 * - 变量：Canvas Variable + Component Variable → variables.xxx
 * - Exposed Value：Component exposedValues → exposed.widgetId.key
 *
 * BackGroupOptionsColumn表, 供 ConditionBuilder 使用。
 */
import { computed } from "vue";
import { useWidgetStore } from "@/stores/widget";
import { useBoardStore } from "@/stores/board";
import { getWidget } from "@/widgets/registry";
import type { Widget, BoardVariable } from "@/widgets/base/types";

export interface ConditionReference {
  label: string;
  value: string;
  group: "field" | "variable" | "exposed";
}

function collectFields(widgets: Widget[]): ConditionReference[] {
  const result: ConditionReference[] = [];
  for (const w of widgets) {
    if (w.field) {
      const label = w.label || w.field;
      result.push({
        label: `${label}（Field）`,
        value: w.field,
        group: "field",
      });
    }
    if (w.children?.length) result.push(...collectFields(w.children));
  }
  return result;
}

function collectVariables(
  widgets: Widget[],
  boardVars: BoardVariable[],
): ConditionReference[] {
  const result: ConditionReference[] = [];
  for (const v of boardVars) {
    result.push({
      label: `${v.name}（Canvas Variable）`,
      value: `variables.${v.name}`,
      group: "variable",
    });
  }
  function walk(items: Widget[]) {
    for (const w of items) {
      if (w.variables?.length) {
        for (const v of w.variables) {
          result.push({
            label: `${v.name}（Component Variable）`,
            value: `variables.${v.name}`,
            group: "variable",
          });
        }
      }
      if (w.children?.length) walk(w.children);
    }
  }
  walk(widgets);
  return result;
}

function collectExposed(widgets: Widget[]): ConditionReference[] {
  const result: ConditionReference[] = [];
  function walk(items: Widget[]) {
    for (const w of items) {
      const config = getWidget(w.type);
      const evs = config?.config?.exposedValues;
      if (evs?.length) {
        for (const ev of evs) {
          result.push({
            label: `${w.label || w.type} - ${ev.description}（Exposed Value）`,
            value: `exposed.${w.id}.${ev.key}`,
            group: "exposed",
          });
        }
      }
      if (w.children?.length) walk(w.children);
    }
  }
  walk(widgets);
  return result;
}

export function useConditionReferences() {
  const widgetStore = useWidgetStore();
  const boardStore = useBoardStore();

  const conditionReferences = computed<ConditionReference[]>(() => {
    const fields = collectFields(widgetStore.widgets);
    const variables = collectVariables(
      widgetStore.widgets,
      boardStore.variables,
    );
    const exposed = collectExposed(widgetStore.widgets);
    return [...fields, ...variables, ...exposed];
  });

  const fieldRefs = computed(() =>
    conditionReferences.value.filter((r) => r.group === "field"),
  );
  const variableRefs = computed(() =>
    conditionReferences.value.filter((r) => r.group === "variable"),
  );
  const exposedRefs = computed(() =>
    conditionReferences.value.filter((r) => r.group === "exposed"),
  );

  return { conditionReferences, fieldRefs, variableRefs, exposedRefs };
}
