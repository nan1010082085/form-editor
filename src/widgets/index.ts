import { defineAsyncComponent, type Component } from "vue";
import { registerWidget, type WidgetRegistryItem } from "./registry";

// ────────────────────────────────────────────
// 懒加载 Widget 组件 — 按需加载，减少主 bundle 体积
// ────────────────────────────────────────────

/** 创建懒加载 Widget 注册项 */
function lazyWidget(
  opts: Omit<WidgetRegistryItem, "component"> & { loader: () => Promise<{ default: Component }> },
): WidgetRegistryItem {
  return {
    ...opts,
    component: defineAsyncComponent(opts.loader),
  };
}

// ────────────────────────────────────────────
// Config imports (同步，体积小)
// ────────────────────────────────────────────
import { createFormWidget, formConfig } from "./form";
import { createCardWidget, cardConfig } from "./card";
import { createTabsWidget, tabsConfig } from "./tabs";
import { createDialogWidget, dialogConfig } from "./dialog";
import { microAppContainerConfig } from "./micro-app-container";
import { createInputWidget, inputConfig } from "./input";
import { createSelectWidget, selectConfig } from "./select";
import { createNumberWidget, numberConfig } from "./number";
import { createRadioWidget, radioConfig } from "./radio";
import { createCheckboxWidget, checkboxConfig } from "./checkbox";
import { createDateWidget, dateConfig } from "./date";
import { createTextareaWidget, textareaConfig } from "./textarea";
import { createTitleWidget, titleConfig } from "./title";
import { createDividerWidget, dividerConfig } from "./divider";
import { createSpacerWidget, spacerConfig } from "./spacer";
import { createToolbarButtonsWidget, toolbarButtonsConfig } from "./toolbar-buttons";
import { createButtonWidget, buttonConfig } from "./button";
import { filterBarConfig, createFilterBarWidget } from "./filter-bar";
import { subFormConfig, createSubFormWidget } from "./sub-form";
import { progressBarConfig, createProgressBarWidget } from "./progress-bar";
import { rankListConfig, createRankListWidget } from "./rank-list";
import { comparisonCardConfig, createComparisonCardWidget } from "./comparison-card";
import { realtimeClockConfig, createRealtimeClockWidget } from "./realtime-clock";
import { marqueeTextConfig, createMarqueeTextWidget } from "./marquee-text";
import { tabContainerConfig, createTabContainerWidget } from "./tab-container";
import { formStepsConfig, createFormStepsWidget } from "./form-steps";
import { conditionBuilderConfig, createConditionBuilderWidget } from "./condition-builder";
import { treemapConfig, createTreemapWidget } from "./treemap";
import { countDownConfig, createCountDownWidget } from "./count-down";
import { carouselConfig, createCarouselWidget } from "./carousel";
import { sankeyConfig, createSankeyWidget } from "./sankey";
import { parallelConfig, createParallelWidget } from "./parallel";
import { approvalProcessConfig, createApprovalProcessWidget } from "./approval-process";
import { createTableWidget, tableConfig } from "./table";
import { createRichtextWidget, richtextConfig } from "./richtext";
import { createUploadWidget, uploadConfig } from "./upload";
import { createBannerWidget, bannerConfig } from "./banner";
import { createTreeLayoutWidget, treeLayoutConfig } from "./tree-layout";
import { createDateTimeSlotWidget, dateTimeSlotConfig } from "./date-time-slot";
import { createTimePickerWidget, timePickerConfig } from "./time-picker";
import { createCascaderWidget, cascaderConfig } from "./cascader";
import { createColorPickerWidget, colorPickerConfig } from "./color-picker";
import { createTagInputWidget, tagInputConfig } from "./tag-input";
import { createAutocompleteWidget, autocompleteConfig } from "./autocomplete";
import { createFileListWidget, fileListConfig } from "./file-list";
import { createDescriptionsWidget, descriptionsConfig } from "./descriptions";
import { createTransferWidget, transferConfig } from "./transfer";
import { createSwitchWidget, switchConfig } from "./switch";
import { createSliderWidget, sliderConfig } from "./slider";
import { createRateWidget, rateConfig } from "./rate";
import { createAdvancedTableWidget, advancedTableConfig } from "./advanced-table";
import { createTreeTableWidget, treeTableConfig } from "./tree-table";
import { createBarChartWidget, barChartConfig } from "./bar-chart";
import { createLineChartWidget, lineChartConfig } from "./line-chart";
import { createPieChartWidget, pieChartConfig } from "./pie-chart";
import { createScatterChartWidget, scatterChartConfig } from "./scatter-chart";
import { createRadarWidget, radarConfig } from "./radar";
import { createGaugeWidget, gaugeConfig } from "./gauge";
import { createHeatmapWidget, heatmapConfig } from "./heatmap";
import { createFunnelWidget, funnelConfig } from "./funnel";
import { createCandlestickWidget, candlestickConfig } from "./candlestick";
import { createStackedBarChartWidget, stackedBarChartConfig } from "./bar-chart/stacked";
import { createHorizontalBarChartWidget, horizontalBarChartConfig } from "./bar-chart/horizontal";
import { createAreaChartWidget, areaChartConfig } from "./line-chart/area";
import { createDonutChartWidget, donutChartConfig } from "./pie-chart/donut";
import { createBubbleChartWidget, bubbleChartConfig } from "./scatter-chart/bubble";
import { createFilledRadarWidget, filledRadarConfig } from "./radar/filled";
import { createMultiGaugeWidget, multiGaugeConfig } from "./gauge/multi";
import { createCompareFunnelWidget, compareFunnelConfig } from "./funnel/compare";
import { createStatisticWidget, statisticConfig } from "./statistic";
import { createSingleColWidget, singleColConfig } from "./single-col";
import { createDoubleColWidget, doubleColConfig } from "./double-col";
import { createTripleColWidget, tripleColConfig } from "./triple-col";
import { createQuadColWidget, quadColConfig } from "./quad-col";
import { createRowContainerWidget, rowContainerConfig } from "./row-container";
import { createApprovalUserPickerWidget, approvalUserPickerConfig } from "./approval-user-picker";
import { createApprovalRolePickerWidget, approvalRolePickerConfig } from "./approval-role-picker";
import { createApprovalCommentWidget, approvalCommentConfig } from "./approval-comment";
import { createScoreCardWidget, scoreCardConfig } from "./score-card";
import { createRiskBadgeWidget, riskBadgeConfig } from "./risk-badge";
import { createAiSuggestionPanelWidget, aiSuggestionPanelConfig } from "./ai-suggestion-panel";
import { createSignatureWidget, signatureConfig } from "./signature";
import { createGanttChartWidget, ganttChartConfig } from "./gantt-chart";
import { createFlexZoneWidget, flexZoneConfig } from "./flex-zone";
import { createPivotTableWidget, pivotTableConfig } from "./pivot-table";
import { createMindMapWidget, mindMapConfig } from "./mind-map";
import { createFileViewerWidget, fileViewerConfig } from "./file-viewer";
import { createRiskMatrixWidget, riskMatrixConfig } from "./risk-matrix";
import { createMedicalRecordWidget, medicalRecordConfig } from "./medical-record";
import { createProductCardWidget, productCardConfig } from "./product-card";
import { createEnergyDashboardWidget, energyDashboardConfig } from "./energy-dashboard";
import { createIconPickerWidget, iconPickerConfig } from "./icon-picker";
import { iframeConfig } from "./iframe";
import { microAppConfig } from "./micro-app";
import { createPermissionTreeWidget, permissionTreeConfig } from "./permission-tree";
import { createRoleManagementWidget, roleManagementConfig } from "./role-management";
import { createTreeSelectWidget, treeSelectConfig } from "./tree-select";
import { createUserManagementWidget, userManagementConfig } from "./user-management";
import { createCrudListPageWidget, crudListPageConfig } from "./crud-list-page";
import { createUserSelectorWidget, userSelectorConfig } from "./user-selector";
import { createFlowTimelineWidget, flowTimelineConfig } from "./flow-timeline";
import { createFlowTaskActionsWidget, flowTaskActionsConfig } from "./flow-task-actions";
import { createCalendarWidget, calendarConfig } from "./calendar";
import { createKanbanWidget, kanbanConfig } from "./kanban";
import { createAdhocQueryWidget, adhocQueryConfig } from "./adhoc-query";
import { createNotificationWidget, notificationConfig } from "./notification";
import { createDynamicDetailTableWidget, dynamicDetailTableConfig } from "./dynamic-detail-table";
import { createComplianceChecklistWidget, complianceChecklistConfig } from "./compliance-checklist";
import { createQrScannerWidget, qrScannerConfig } from "./qr-scanner";
import { createAutoRefreshWidget, autoRefreshConfig } from "./auto-refresh";
import { createMapWidget, mapConfig } from "./map";

export function registerAllWidgets() {
  // ── Layout widgets ──
  registerWidget(lazyWidget({ name: cardConfig.name, displayName: cardConfig.displayName, type: "card", group: "layout", create: createCardWidget, config: cardConfig, loader: () => import("./card") }));
  registerWidget(lazyWidget({ name: tabsConfig.name, displayName: tabsConfig.displayName, type: "tabs", group: "layout", create: createTabsWidget, config: tabsConfig, loader: () => import("./tabs") }));
  registerWidget(lazyWidget({ name: singleColConfig.name, displayName: singleColConfig.displayName, type: "single-col", group: "layout", create: createSingleColWidget, config: singleColConfig, loader: () => import("./single-col") }));
  registerWidget(lazyWidget({ name: doubleColConfig.name, displayName: doubleColConfig.displayName, type: "double-col", group: "layout", create: createDoubleColWidget, config: doubleColConfig, loader: () => import("./double-col") }));
  registerWidget(lazyWidget({ name: tripleColConfig.name, displayName: tripleColConfig.displayName, type: "triple-col", group: "layout", create: createTripleColWidget, config: tripleColConfig, loader: () => import("./triple-col") }));
  registerWidget(lazyWidget({ name: quadColConfig.name, displayName: quadColConfig.displayName, type: "quad-col", group: "layout", create: createQuadColWidget, config: quadColConfig, loader: () => import("./quad-col") }));
  registerWidget(lazyWidget({ name: rowContainerConfig.name, displayName: rowContainerConfig.displayName, type: "row-container", group: "layout", create: createRowContainerWidget, config: rowContainerConfig, loader: () => import("./row-container") }));
  registerWidget(lazyWidget({ name: dividerConfig.name, displayName: dividerConfig.displayName, type: "divider", group: "layout", create: createDividerWidget, config: dividerConfig, loader: () => import("./divider") }));
  registerWidget(lazyWidget({ name: spacerConfig.name, displayName: spacerConfig.displayName, type: "spacer", group: "layout", create: createSpacerWidget, config: spacerConfig, loader: () => import("./spacer") }));
  registerWidget(lazyWidget({ name: tabContainerConfig.name, displayName: tabContainerConfig.displayName, type: "tab-container", group: "layout", create: createTabContainerWidget, config: tabContainerConfig, loader: () => import("./tab-container") }));
  registerWidget(lazyWidget({ name: formStepsConfig.name, displayName: formStepsConfig.displayName, type: "form-steps", group: "layout", create: createFormStepsWidget, config: formStepsConfig, loader: () => import("./form-steps") }));
  registerWidget(lazyWidget({ name: treeLayoutConfig.name, displayName: treeLayoutConfig.displayName, type: "tree-layout", group: "layout", create: createTreeLayoutWidget, config: treeLayoutConfig, loader: () => import("./tree-layout") }));
  registerWidget(lazyWidget({ name: carouselConfig.name, displayName: carouselConfig.displayName, type: "carousel", group: "layout", create: createCarouselWidget, config: carouselConfig, loader: () => import("./carousel") }));

  // ── Container widgets ──
  registerWidget(lazyWidget({ name: formConfig.name, displayName: formConfig.displayName, type: "form", group: "container", create: createFormWidget, config: formConfig, loader: () => import("./form") }));
  registerWidget(lazyWidget({ name: dialogConfig.name, displayName: dialogConfig.displayName, type: "dialog", group: "container", create: createDialogWidget, config: dialogConfig, loader: () => import("./dialog") }));
  registerWidget(lazyWidget({ name: microAppContainerConfig.name, displayName: microAppContainerConfig.displayName, type: "micro-app-container", group: "container", create: (id: string) => ({ id, type: "micro-app-container", name: microAppContainerConfig.name, label: microAppContainerConfig.displayName, props: { ...microAppContainerConfig.defaultProps }, position: { x: 0, y: 0, w: 600, h: 400, zIndex: 1 } }), config: microAppContainerConfig, loader: () => import("./micro-app-container") }));
  registerWidget(lazyWidget({ name: flexZoneConfig.name, displayName: flexZoneConfig.displayName, type: "flex-zone", group: "container", create: createFlexZoneWidget, config: flexZoneConfig, loader: () => import("./flex-zone") }));
  registerWidget(lazyWidget({ name: iframeConfig.name, displayName: iframeConfig.displayName, type: "iframe", group: "container", create: (id: string) => ({ id, type: "iframe", name: iframeConfig.name, label: iframeConfig.displayName, props: { ...iframeConfig.defaultProps }, position: { x: 0, y: 0, w: 600, h: 400, zIndex: 1 } }), config: iframeConfig, loader: () => import("./iframe") }));
  registerWidget(lazyWidget({ name: microAppConfig.name, displayName: microAppConfig.displayName, type: "micro-app", group: "container", create: (id: string) => ({ id, type: "micro-app", name: microAppConfig.name, label: microAppConfig.displayName, props: { ...microAppConfig.defaultProps }, position: { x: 0, y: 0, w: 600, h: 400, zIndex: 1 } }), config: microAppConfig, loader: () => import("./micro-app") }));

  // ── Form widgets ──
  registerWidget(lazyWidget({ name: inputConfig.name, displayName: inputConfig.displayName, type: "input", group: "form", create: createInputWidget, config: inputConfig, loader: () => import("./input") }));
  registerWidget(lazyWidget({ name: selectConfig.name, displayName: selectConfig.displayName, type: "select", group: "form", create: createSelectWidget, config: selectConfig, loader: () => import("./select") }));
  registerWidget(lazyWidget({ name: numberConfig.name, displayName: numberConfig.displayName, type: "number", group: "form", create: createNumberWidget, config: numberConfig, loader: () => import("./number") }));
  registerWidget(lazyWidget({ name: radioConfig.name, displayName: radioConfig.displayName, type: "radio", group: "form", create: createRadioWidget, config: radioConfig, loader: () => import("./radio") }));
  registerWidget(lazyWidget({ name: checkboxConfig.name, displayName: checkboxConfig.displayName, type: "checkbox", group: "form", create: createCheckboxWidget, config: checkboxConfig, loader: () => import("./checkbox") }));
  registerWidget(lazyWidget({ name: dateConfig.name, displayName: dateConfig.displayName, type: "date", group: "form", create: createDateWidget, config: dateConfig, loader: () => import("./date") }));
  registerWidget(lazyWidget({ name: textareaConfig.name, displayName: textareaConfig.displayName, type: "textarea", group: "form", create: createTextareaWidget, config: textareaConfig, loader: () => import("./textarea") }));
  registerWidget(lazyWidget({ name: switchConfig.name, displayName: switchConfig.displayName, type: "switch", group: "form", create: createSwitchWidget, config: switchConfig, loader: () => import("./switch") }));
  registerWidget(lazyWidget({ name: sliderConfig.name, displayName: sliderConfig.displayName, type: "slider", group: "form", create: createSliderWidget, config: sliderConfig, loader: () => import("./slider") }));
  registerWidget(lazyWidget({ name: rateConfig.name, displayName: rateConfig.displayName, type: "rate", group: "form", create: createRateWidget, config: rateConfig, loader: () => import("./rate") }));
  registerWidget(lazyWidget({ name: richtextConfig.name, displayName: richtextConfig.displayName, type: "richtext", group: "form", create: createRichtextWidget, config: richtextConfig, loader: () => import("./richtext") }));
  registerWidget(lazyWidget({ name: uploadConfig.name, displayName: uploadConfig.displayName, type: "upload", group: "form", create: createUploadWidget, config: uploadConfig, loader: () => import("./upload") }));
  registerWidget(lazyWidget({ name: dateTimeSlotConfig.name, displayName: dateTimeSlotConfig.displayName, type: "date-time-slot", group: "form", create: createDateTimeSlotWidget, config: dateTimeSlotConfig, loader: () => import("./date-time-slot") }));
  registerWidget(lazyWidget({ name: timePickerConfig.name, displayName: timePickerConfig.displayName, type: "time-picker", group: "form", create: createTimePickerWidget, config: timePickerConfig, loader: () => import("./time-picker") }));
  registerWidget(lazyWidget({ name: cascaderConfig.name, displayName: cascaderConfig.displayName, type: "cascader", group: "form", create: createCascaderWidget, config: cascaderConfig, loader: () => import("./cascader") }));
  registerWidget(lazyWidget({ name: colorPickerConfig.name, displayName: colorPickerConfig.displayName, type: "color-picker", group: "form", create: createColorPickerWidget, config: colorPickerConfig, loader: () => import("./color-picker") }));
  registerWidget(lazyWidget({ name: tagInputConfig.name, displayName: tagInputConfig.displayName, type: "tag-input", group: "form", create: createTagInputWidget, config: tagInputConfig, loader: () => import("./tag-input") }));
  registerWidget(lazyWidget({ name: autocompleteConfig.name, displayName: autocompleteConfig.displayName, type: "autocomplete", group: "form", create: createAutocompleteWidget, config: autocompleteConfig, loader: () => import("./autocomplete") }));
  registerWidget(lazyWidget({ name: fileListConfig.name, displayName: fileListConfig.displayName, type: "file-list", group: "form", create: createFileListWidget, config: fileListConfig, loader: () => import("./file-list") }));
  registerWidget(lazyWidget({ name: transferConfig.name, displayName: transferConfig.displayName, type: "transfer", group: "form", create: createTransferWidget, config: transferConfig, loader: () => import("./transfer") }));
  registerWidget(lazyWidget({ name: conditionBuilderConfig.name, displayName: conditionBuilderConfig.displayName, type: "condition-builder", group: "form", create: createConditionBuilderWidget, config: conditionBuilderConfig, loader: () => import("./condition-builder") }));
  registerWidget(lazyWidget({ name: subFormConfig.name, displayName: subFormConfig.displayName, type: "sub-form", group: "form", create: createSubFormWidget, config: subFormConfig, loader: () => import("./sub-form") }));
  registerWidget(lazyWidget({ name: treeSelectConfig.name, displayName: treeSelectConfig.displayName, type: "tree-select", group: "form", create: createTreeSelectWidget, config: treeSelectConfig, loader: () => import("./tree-select") }));
  registerWidget(lazyWidget({ name: iconPickerConfig.name, displayName: iconPickerConfig.displayName, type: "icon-picker", group: "form", create: createIconPickerWidget, config: iconPickerConfig, loader: () => import("./icon-picker") }));
  registerWidget(lazyWidget({ name: permissionTreeConfig.name, displayName: permissionTreeConfig.displayName, type: "permission-tree", group: "form", create: createPermissionTreeWidget, config: permissionTreeConfig, loader: () => import("./permission-tree") }));
  registerWidget(lazyWidget({ name: dynamicDetailTableConfig.name, displayName: dynamicDetailTableConfig.displayName, type: "dynamic-detail-table", group: "form", create: createDynamicDetailTableWidget, config: dynamicDetailTableConfig, loader: () => import("./dynamic-detail-table") }));
  registerWidget(lazyWidget({ name: qrScannerConfig.name, displayName: qrScannerConfig.displayName, type: "qr-scanner", group: "form", create: createQrScannerWidget, config: qrScannerConfig, loader: () => import("./qr-scanner") }));

  // ── Static widgets ──
  registerWidget(lazyWidget({ name: titleConfig.name, displayName: titleConfig.displayName, type: "title", group: "static", create: createTitleWidget, config: titleConfig, loader: () => import("./title") }));
  registerWidget(lazyWidget({ name: bannerConfig.name, displayName: bannerConfig.displayName, type: "banner", group: "static", create: createBannerWidget, config: bannerConfig, loader: () => import("./banner") }));
  registerWidget(lazyWidget({ name: statisticConfig.name, displayName: statisticConfig.displayName, type: "statistic", group: "static", create: createStatisticWidget, config: statisticConfig, loader: () => import("./statistic") }));
  registerWidget(lazyWidget({ name: rankListConfig.name, displayName: rankListConfig.displayName, type: "rank-list", group: "static", create: createRankListWidget, config: rankListConfig, loader: () => import("./rank-list") }));
  registerWidget(lazyWidget({ name: comparisonCardConfig.name, displayName: comparisonCardConfig.displayName, type: "comparison-card", group: "static", create: createComparisonCardWidget, config: comparisonCardConfig, loader: () => import("./comparison-card") }));
  registerWidget(lazyWidget({ name: realtimeClockConfig.name, displayName: realtimeClockConfig.displayName, type: "realtime-clock", group: "static", create: createRealtimeClockWidget, config: realtimeClockConfig, loader: () => import("./realtime-clock") }));
  registerWidget(lazyWidget({ name: marqueeTextConfig.name, displayName: marqueeTextConfig.displayName, type: "marquee-text", group: "static", create: createMarqueeTextWidget, config: marqueeTextConfig, loader: () => import("./marquee-text") }));
  registerWidget(lazyWidget({ name: countDownConfig.name, displayName: countDownConfig.displayName, type: "count-down", group: "static", create: createCountDownWidget, config: countDownConfig, loader: () => import("./count-down") }));
  registerWidget(lazyWidget({ name: descriptionsConfig.name, displayName: descriptionsConfig.displayName, type: "descriptions", group: "static", create: createDescriptionsWidget, config: descriptionsConfig, loader: () => import("./descriptions") }));

  // ── Action widgets ──
  registerWidget(lazyWidget({ name: toolbarButtonsConfig.name, displayName: toolbarButtonsConfig.displayName, type: "toolbar-buttons", group: "action", create: createToolbarButtonsWidget, config: toolbarButtonsConfig, loader: () => import("./toolbar-buttons") }));
  registerWidget(lazyWidget({ name: buttonConfig.name, displayName: buttonConfig.displayName, type: "button", group: "action", create: createButtonWidget, config: buttonConfig, loader: () => import("./button") }));
  registerWidget(lazyWidget({ name: filterBarConfig.name, displayName: filterBarConfig.displayName, type: "filter-bar", group: "action", create: createFilterBarWidget, config: filterBarConfig, loader: () => import("./filter-bar") }));

  // ── Table widgets ──
  registerWidget(lazyWidget({ name: tableConfig.name, displayName: tableConfig.displayName, type: "table", group: "table", create: createTableWidget, config: tableConfig, loader: () => import("./table") }));
  registerWidget(lazyWidget({ name: advancedTableConfig.name, displayName: advancedTableConfig.displayName, type: "advanced-table", group: "table", create: createAdvancedTableWidget, config: advancedTableConfig, loader: () => import("./advanced-table") }));
  registerWidget(lazyWidget({ name: treeTableConfig.name, displayName: treeTableConfig.displayName, type: "tree-table", group: "table", create: createTreeTableWidget, config: treeTableConfig, loader: () => import("./tree-table") }));
  registerWidget(lazyWidget({ name: pivotTableConfig.name, displayName: pivotTableConfig.displayName, type: "pivot-table", group: "table", create: createPivotTableWidget, config: pivotTableConfig, loader: () => import("./pivot-table") }));

  // ── Chart widgets ──
  registerWidget(lazyWidget({ name: barChartConfig.name, displayName: barChartConfig.displayName, type: "bar-chart", group: "chart", create: createBarChartWidget, config: barChartConfig, loader: () => import("./bar-chart") }));
  registerWidget(lazyWidget({ name: stackedBarChartConfig.name, displayName: stackedBarChartConfig.displayName, type: "stacked-bar-chart", group: "chart", create: createStackedBarChartWidget, config: stackedBarChartConfig, loader: () => import("./bar-chart/stacked") }));
  registerWidget(lazyWidget({ name: horizontalBarChartConfig.name, displayName: horizontalBarChartConfig.displayName, type: "horizontal-bar-chart", group: "chart", create: createHorizontalBarChartWidget, config: horizontalBarChartConfig, loader: () => import("./bar-chart/horizontal") }));
  registerWidget(lazyWidget({ name: lineChartConfig.name, displayName: lineChartConfig.displayName, type: "line-chart", group: "chart", create: createLineChartWidget, config: lineChartConfig, loader: () => import("./line-chart") }));
  registerWidget(lazyWidget({ name: areaChartConfig.name, displayName: areaChartConfig.displayName, type: "area-chart", group: "chart", create: createAreaChartWidget, config: areaChartConfig, loader: () => import("./line-chart/area") }));
  registerWidget(lazyWidget({ name: pieChartConfig.name, displayName: pieChartConfig.displayName, type: "pie-chart", group: "chart", create: createPieChartWidget, config: pieChartConfig, loader: () => import("./pie-chart") }));
  registerWidget(lazyWidget({ name: donutChartConfig.name, displayName: donutChartConfig.displayName, type: "donut-chart", group: "chart", create: createDonutChartWidget, config: donutChartConfig, loader: () => import("./pie-chart/donut") }));
  registerWidget(lazyWidget({ name: scatterChartConfig.name, displayName: scatterChartConfig.displayName, type: "scatter-chart", group: "chart", create: createScatterChartWidget, config: scatterChartConfig, loader: () => import("./scatter-chart") }));
  registerWidget(lazyWidget({ name: bubbleChartConfig.name, displayName: bubbleChartConfig.displayName, type: "bubble-chart", group: "chart", create: createBubbleChartWidget, config: bubbleChartConfig, loader: () => import("./scatter-chart/bubble") }));
  registerWidget(lazyWidget({ name: radarConfig.name, displayName: radarConfig.displayName, type: "radar", group: "chart", create: createRadarWidget, config: radarConfig, loader: () => import("./radar") }));
  registerWidget(lazyWidget({ name: filledRadarConfig.name, displayName: filledRadarConfig.displayName, type: "filled-radar", group: "chart", create: createFilledRadarWidget, config: filledRadarConfig, loader: () => import("./radar/filled") }));
  registerWidget(lazyWidget({ name: gaugeConfig.name, displayName: gaugeConfig.displayName, type: "gauge", group: "chart", create: createGaugeWidget, config: gaugeConfig, loader: () => import("./gauge") }));
  registerWidget(lazyWidget({ name: multiGaugeConfig.name, displayName: multiGaugeConfig.displayName, type: "multi-gauge", group: "chart", create: createMultiGaugeWidget, config: multiGaugeConfig, loader: () => import("./gauge/multi") }));
  registerWidget(lazyWidget({ name: heatmapConfig.name, displayName: heatmapConfig.displayName, type: "heatmap", group: "chart", create: createHeatmapWidget, config: heatmapConfig, loader: () => import("./heatmap") }));
  registerWidget(lazyWidget({ name: funnelConfig.name, displayName: funnelConfig.displayName, type: "funnel", group: "chart", create: createFunnelWidget, config: funnelConfig, loader: () => import("./funnel") }));
  registerWidget(lazyWidget({ name: compareFunnelConfig.name, displayName: compareFunnelConfig.displayName, type: "compare-funnel", group: "chart", create: createCompareFunnelWidget, config: compareFunnelConfig, loader: () => import("./funnel/compare") }));
  registerWidget(lazyWidget({ name: candlestickConfig.name, displayName: candlestickConfig.displayName, type: "candlestick", group: "chart", create: createCandlestickWidget, config: candlestickConfig, loader: () => import("./candlestick") }));
  registerWidget(lazyWidget({ name: progressBarConfig.name, displayName: progressBarConfig.displayName, type: "progress-bar", group: "chart", create: createProgressBarWidget, config: progressBarConfig, loader: () => import("./progress-bar") }));
  registerWidget(lazyWidget({ name: treemapConfig.name, displayName: treemapConfig.displayName, type: "treemap", group: "chart", create: createTreemapWidget, config: treemapConfig, loader: () => import("./treemap") }));
  registerWidget(lazyWidget({ name: ganttChartConfig.name, displayName: ganttChartConfig.displayName, type: "gantt-chart", group: "chart", create: createGanttChartWidget, config: ganttChartConfig, loader: () => import("./gantt-chart") }));
  registerWidget(lazyWidget({ name: sankeyConfig.name, displayName: sankeyConfig.displayName, type: "sankey", group: "chart", create: createSankeyWidget, config: sankeyConfig, loader: () => import("./sankey") }));
  registerWidget(lazyWidget({ name: parallelConfig.name, displayName: parallelConfig.displayName, type: "parallel", group: "chart", create: createParallelWidget, config: parallelConfig, loader: () => import("./parallel") }));
  registerWidget(lazyWidget({ name: mapConfig.name, displayName: mapConfig.displayName, type: "map", group: "chart", create: createMapWidget, config: mapConfig, loader: () => import("./map") }));

  // ── Business widgets ──
  registerWidget(lazyWidget({ name: approvalUserPickerConfig.name, displayName: approvalUserPickerConfig.displayName, type: "approval-user-picker", group: "business", create: createApprovalUserPickerWidget, config: approvalUserPickerConfig, loader: () => import("./approval-user-picker") }));
  registerWidget(lazyWidget({ name: approvalRolePickerConfig.name, displayName: approvalRolePickerConfig.displayName, type: "approval-role-picker", group: "business", create: createApprovalRolePickerWidget, config: approvalRolePickerConfig, loader: () => import("./approval-role-picker") }));
  registerWidget(lazyWidget({ name: approvalCommentConfig.name, displayName: approvalCommentConfig.displayName, type: "approval-comment", group: "business", create: createApprovalCommentWidget, config: approvalCommentConfig, loader: () => import("./approval-comment") }));
  registerWidget(lazyWidget({ name: scoreCardConfig.name, displayName: scoreCardConfig.displayName, type: "score-card", group: "business", create: createScoreCardWidget, config: scoreCardConfig, loader: () => import("./score-card") }));
  registerWidget(lazyWidget({ name: riskBadgeConfig.name, displayName: riskBadgeConfig.displayName, type: "risk-badge", group: "business", create: createRiskBadgeWidget, config: riskBadgeConfig, loader: () => import("./risk-badge") }));
  registerWidget(lazyWidget({ name: aiSuggestionPanelConfig.name, displayName: aiSuggestionPanelConfig.displayName, type: "ai-suggestion-panel", group: "business", create: createAiSuggestionPanelWidget, config: aiSuggestionPanelConfig, loader: () => import("./ai-suggestion-panel") }));
  registerWidget(lazyWidget({ name: signatureConfig.name, displayName: signatureConfig.displayName, type: "signature", group: "business", create: createSignatureWidget, config: signatureConfig, loader: () => import("./signature") }));
  registerWidget(lazyWidget({ name: mindMapConfig.name, displayName: mindMapConfig.displayName, type: "mind-map", group: "business", create: createMindMapWidget, config: mindMapConfig, loader: () => import("./mind-map") }));
  registerWidget(lazyWidget({ name: fileViewerConfig.name, displayName: fileViewerConfig.displayName, type: "file-viewer", group: "business", create: createFileViewerWidget, config: fileViewerConfig, loader: () => import("./file-viewer") }));
  registerWidget(lazyWidget({ name: riskMatrixConfig.name, displayName: riskMatrixConfig.displayName, type: "risk-matrix", group: "business", create: createRiskMatrixWidget, config: riskMatrixConfig, loader: () => import("./risk-matrix") }));
  registerWidget(lazyWidget({ name: medicalRecordConfig.name, displayName: medicalRecordConfig.displayName, type: "medical-record", group: "business", create: createMedicalRecordWidget, config: medicalRecordConfig, loader: () => import("./medical-record") }));
  registerWidget(lazyWidget({ name: productCardConfig.name, displayName: productCardConfig.displayName, type: "product-card", group: "business", create: createProductCardWidget, config: productCardConfig, loader: () => import("./product-card") }));
  registerWidget(lazyWidget({ name: energyDashboardConfig.name, displayName: energyDashboardConfig.displayName, type: "energy-dashboard", group: "business", create: createEnergyDashboardWidget, config: energyDashboardConfig, loader: () => import("./energy-dashboard") }));
  registerWidget(lazyWidget({ name: roleManagementConfig.name, displayName: roleManagementConfig.displayName, type: "role-management", group: "business", create: createRoleManagementWidget, config: roleManagementConfig, loader: () => import("./role-management") }));
  registerWidget(lazyWidget({ name: userManagementConfig.name, displayName: userManagementConfig.displayName, type: "user-management", group: "business", create: createUserManagementWidget, config: userManagementConfig, loader: () => import("./user-management") }));
  registerWidget(lazyWidget({ name: crudListPageConfig.name, displayName: crudListPageConfig.displayName, type: "crud-list-page", group: "business", create: createCrudListPageWidget, config: crudListPageConfig, loader: () => import("./crud-list-page") }));
  registerWidget(lazyWidget({ name: approvalProcessConfig.name, displayName: approvalProcessConfig.displayName, type: "approval-process", group: "business", create: createApprovalProcessWidget, config: approvalProcessConfig, loader: () => import("./approval-process") }));
  registerWidget(lazyWidget({ name: flowTimelineConfig.name, displayName: flowTimelineConfig.displayName, type: "flow-timeline", group: "business", create: createFlowTimelineWidget, config: flowTimelineConfig, loader: () => import("./flow-timeline") }));
  registerWidget(lazyWidget({ name: flowTaskActionsConfig.name, displayName: flowTaskActionsConfig.displayName, type: "flow-task-actions", group: "business", create: createFlowTaskActionsWidget, config: flowTaskActionsConfig, loader: () => import("./flow-task-actions") }));
  registerWidget(lazyWidget({ name: calendarConfig.name, displayName: calendarConfig.displayName, type: "calendar", group: "business", create: createCalendarWidget, config: calendarConfig, loader: () => import("./calendar") }));
  registerWidget(lazyWidget({ name: kanbanConfig.name, displayName: kanbanConfig.displayName, type: "kanban", group: "business", create: createKanbanWidget, config: kanbanConfig, loader: () => import("./kanban") }));
  registerWidget(lazyWidget({ name: adhocQueryConfig.name, displayName: adhocQueryConfig.displayName, type: "adhoc-query", group: "business", create: createAdhocQueryWidget, config: adhocQueryConfig, loader: () => import("./adhoc-query") }));
  registerWidget(lazyWidget({ name: notificationConfig.name, displayName: notificationConfig.displayName, type: "notification", group: "business", create: createNotificationWidget, config: notificationConfig, loader: () => import("./notification") }));
  registerWidget(lazyWidget({ name: autoRefreshConfig.name, displayName: autoRefreshConfig.displayName, type: "auto-refresh", group: "business", create: createAutoRefreshWidget, config: autoRefreshConfig, loader: () => import("./auto-refresh") }));
  registerWidget(lazyWidget({ name: complianceChecklistConfig.name, displayName: complianceChecklistConfig.displayName, type: "compliance-checklist", group: "business", create: createComplianceChecklistWidget, config: complianceChecklistConfig, loader: () => import("./compliance-checklist") }));
  registerWidget(lazyWidget({ name: userSelectorConfig.name, displayName: userSelectorConfig.displayName, type: "user-selector", group: "business", create: createUserSelectorWidget, config: userSelectorConfig, loader: () => import("./user-selector") }));
}