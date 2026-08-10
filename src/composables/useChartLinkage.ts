/**
 * useChartLinkage — ChartLinkage composable
 *
 * Implement drilldown/filter/highlight linkage between charts:
 * 1. Listen for chart click events (via event engine chart-click trigger)
 * 2. Map params to target chart by paramMapping
 * 3. Execute filter/drilldown/highlight action
 * 4. Maintain drilldown history stack, support breadcrumb back
 */
import { ref, computed, type Ref } from "vue";
import type {
  Widget,
  ChartLinkageRule,
  DrilldownHistoryEntry,
} from "../widgets/base/types";
import { useLogger } from "@/composables/useLogger";

const logger = useLogger("ChartLinkage");

/** Drilldown status */
export interface DrilldownState {
  /** Current active drilldown level (widgetId -> history stack) */
  history: Map<string, DrilldownHistoryEntry[]>;
  /** Current filter condition (widgetId -> filter params) */
  activeFilters: Map<string, Record<string, unknown>>;
  /** Current highlight item (widgetId -> highlighted dataIndex set) */
  highlights: Map<string, Set<number>>;
}

export interface UseChartLinkageOptions {
  /** All widgets on current canvas */
  widgets: Ref<Widget[]>;
  /** Callback to update widget property */
  updateWidget: (id: string, patch: Partial<Widget>) => void;
  /** Callback to get chart data */
  getChartData?: (widgetId: string) => Record<string, unknown>[];
}

export function useChartLinkage(options: UseChartLinkageOptions) {
  const { widgets, getChartData } = options;

  // ---- Drilldown status ----
  const drilldownState = ref<DrilldownState>({
    history: new Map(),
    activeFilters: new Map(),
    highlights: new Map(),
  });

  // ---- Collect all chart linkage rules ----
  const allRules = computed<ChartLinkageRule[]>(() => {
    const rules: ChartLinkageRule[] = [];
    for (const widget of widgets.value) {
      if (widget.chartLinkages?.length) {
        rules.push(...widget.chartLinkages);
      }
    }
    return rules;
  });

  /**
   * Extract param values from chart click event data
   * @param data - Original data row from chart click
   * @param paramMapping - Source field -> target field mapping
   * @returns Mapped params object
   */
  function extractParams(
    data: Record<string, unknown>,
    paramMapping: Record<string, string>,
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    for (const [sourceField, targetField] of Object.entries(paramMapping)) {
      if (sourceField in data) {
        params[targetField] = data[sourceField];
      }
    }
    return params;
  }

  /**
   * Execute filter action: set filter condition for target chart
   */
  function applyFilter(
    targetWidgetId: string,
    filters: Record<string, unknown>,
  ) {
    const current =
      drilldownState.value.activeFilters.get(targetWidgetId) ?? {};
    const merged = { ...current, ...filters };
    drilldownState.value.activeFilters.set(targetWidgetId, merged);
    logger.event(`Filter: #${targetWidgetId}`, merged);
  }

  /**
   * Execute drilldown action: push to history stack, set filter condition
   */
  function applyDrilldown(
    sourceWidgetId: string,
    targetWidgetId: string,
    value: string,
    field: string,
    label: string,
    filters: Record<string, unknown>,
  ) {
    // Get or initialize history stack
    const history = drilldownState.value.history.get(sourceWidgetId) ?? [];

    // Push current level
    const entry: DrilldownHistoryEntry = {
      value,
      field,
      label,
      filters,
    };
    history.push(entry);
    drilldownState.value.history.set(sourceWidgetId, [...history]);

    // Apply filter at the same time
    applyFilter(targetWidgetId, filters);
    logger.event(`Drilldown: #${sourceWidgetId} → #${targetWidgetId}`, {
      value,
      field,
      label,
    });
  }

  /**
   * Execute highlight action: mark highlighted data items in target chart
   */
  function applyHighlight(targetWidgetId: string, dataIndices: number[]) {
    drilldownState.value.highlights.set(targetWidgetId, new Set(dataIndices));
    logger.event(`Highlight: #${targetWidgetId}`, dataIndices);
  }

  /**
   * Clear all linkage status for target chart
   */
  function clearLinkageState(targetWidgetId: string) {
    drilldownState.value.activeFilters.delete(targetWidgetId);
    drilldownState.value.highlights.delete(targetWidgetId);
  }

  /**
   * Handle chart click event, find matching linkage rule and execute
   *
   * @param sourceWidgetId - Chart widget ID that triggered the click
   * @param chartEvent - Chart click event data
   */
  function handleChartClick(
    sourceWidgetId: string,
    chartEvent: {
      dataIndex: number;
      name: string;
      value: unknown;
      seriesName: string;
      data: Record<string, unknown>;
    },
  ) {
    // Find all click trigger rules with current chart as source
    const matchingRules = allRules.value.filter(
      (rule) =>
        rule.sourceWidgetId === sourceWidgetId && rule.trigger === "click",
    );

    if (matchingRules.length === 0) return;

    logger.event(`Handle chart click: #${sourceWidgetId}`, {
      name: chartEvent.name,
      dataIndex: chartEvent.dataIndex,
    });

    for (const rule of matchingRules) {
      const params = extractParams(chartEvent.data, rule.paramMapping);

      for (const targetId of rule.targetWidgetIds) {
        switch (rule.action) {
          case "filter":
            applyFilter(targetId, params);
            break;

          case "drilldown":
            applyDrilldown(
              sourceWidgetId,
              targetId,
              String(chartEvent.name),
              rule.drilldownField ?? Object.keys(rule.paramMapping)[0] ?? "",
              rule.drilldownLabel ?? String(chartEvent.name),
              params,
            );
            break;

          case "highlight": {
            // Highlight all data items in the same category as clicked data
            const chartData = getChartData?.(targetId) ?? [];
            const targetField = Object.values(rule.paramMapping)[0] ?? "";
            const sourceValue =
              chartEvent.data[Object.keys(rule.paramMapping)[0] ?? ""];
            const indices = chartData
              .map((item, idx) =>
                item[targetField] === sourceValue ? idx : -1,
              )
              .filter((idx) => idx >= 0);
            applyHighlight(targetId, indices);
            break;
          }
        }
      }
    }
  }

  /**
   * Drilldown back: pop one level from history stack
   *
   * @param sourceWidgetId - Drilldown source chart ID
   * @param level - Level to go back to (-1 = go back one level, 0 = go to top)
   */
  function drilldownBack(sourceWidgetId: string, level?: number) {
    const history = drilldownState.value.history.get(sourceWidgetId);
    if (!history || history.length === 0) return;

    const targetLevel = level ?? history.length - 2;

    if (targetLevel < 0) {
      // Go to top level, clear all status
      drilldownState.value.history.set(sourceWidgetId, []);
      // Clear all target chart filters
      const rules = allRules.value.filter(
        (r) => r.sourceWidgetId === sourceWidgetId,
      );
      for (const rule of rules) {
        for (const targetId of rule.targetWidgetIds) {
          clearLinkageState(targetId);
        }
      }
      logger.event(`Drilldown back: #${sourceWidgetId} → top level`);
    } else {
      // Go back to specified level
      const newHistory = history.slice(0, targetLevel + 1);
      drilldownState.value.history.set(sourceWidgetId, newHistory);
      // Restore filter condition for that level
      const entry = newHistory[targetLevel];
      const rules = allRules.value.filter(
        (r) => r.sourceWidgetId === sourceWidgetId,
      );
      for (const rule of rules) {
        for (const targetId of rule.targetWidgetIds) {
          clearLinkageState(targetId);
          applyFilter(targetId, entry.filters);
        }
      }
      logger.event(`Drilldown back: #${sourceWidgetId} → level ${targetLevel}`);
    }
  }

  /**
   * Get drilldown breadcrumb path for specified chart
   */
  function getBreadcrumbs(sourceWidgetId: string): DrilldownHistoryEntry[] {
    return drilldownState.value.history.get(sourceWidgetId) ?? [];
  }

  /**
   * Get current filter condition for specified chart
   */
  function getActiveFilters(widgetId: string): Record<string, unknown> {
    return drilldownState.value.activeFilters.get(widgetId) ?? {};
  }

  /**
   * Get highlight index set for specified chart
   */
  function getHighlights(widgetId: string): Set<number> {
    return drilldownState.value.highlights.get(widgetId) ?? new Set();
  }

  /**
   * Check if specified chart has active drilldown status
   */
  function hasDrilldown(sourceWidgetId: string): boolean {
    const history = drilldownState.value.history.get(sourceWidgetId);
    return !!history && history.length > 0;
  }

  /**
   * Reset all linkage status
   */
  function resetAll() {
    drilldownState.value = {
      history: new Map(),
      activeFilters: new Map(),
      highlights: new Map(),
    };
  }

  return {
    drilldownState,
    handleChartClick,
    drilldownBack,
    getBreadcrumbs,
    getActiveFilters,
    getHighlights,
    hasDrilldown,
    resetAll,
  };
}
