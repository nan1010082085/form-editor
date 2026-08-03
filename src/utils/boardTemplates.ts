/**
 * boardTemplates — 新建实例时的画布 + Widget 种子
 *
 * layoutMode 决定编辑器/运行时渲染路径；gridTemplate / freePreset 决定初始结构。
 */
import type {
  CanvasConfig,
  Widget,
  BoardLayoutMode,
  GridPageTemplate,
  FreeLayoutPreset,
  FreeLayoutOptions,
} from "@/widgets/base/types";
import { createWidget, generateWidgetId } from "@/widgets/registry";
import { adaptWidgetsToBoardLayout } from "@/utils/widgetLayoutAdapter";
import { seedDashboardDemo } from "@/utils/dashboardDemo";

export interface CreateBoardOptions {
  layoutMode: BoardLayoutMode;
  gridTemplate?: GridPageTemplate;
  freePreset?: FreeLayoutPreset;
}

export interface BoardSeedResult {
  widgets: Widget[];
  canvas: CanvasConfig;
}

const FREE_LAYOUT_PRESETS: Record<
  Exclude<FreeLayoutPreset, "dashboard-demo">,
  FreeLayoutOptions & { width: number; height: number }
> = {
  full: {
    width: 1440,
    height: 900,
    maxContentWidth: undefined,
    contentAlign: "left",
    marginX: "0",
  },
  "form-narrow": {
    width: 960,
    height: 1200,
    maxContentWidth: 960,
    contentAlign: "center",
    marginX: "24px",
  },
  "list-standard": {
    width: 1200,
    height: 900,
    maxContentWidth: 1200,
    contentAlign: "center",
    marginX: "24px",
  },
  "list-wide": {
    width: 1440,
    height: 900,
    maxContentWidth: 1440,
    contentAlign: "center",
    marginX: "24px",
  },
};

function baseCanvas(
  layoutMode: BoardLayoutMode,
  patch: Partial<CanvasConfig> = {},
): CanvasConfig {
  const isGrid = layoutMode === "grid";
  return {
    width: isGrid ? 100 : 1440,
    height: isGrid ? 100 : 900,
    widthUnit: isGrid ? "%" : "px",
    heightUnit: isGrid ? "%" : "px",
    backgroundColor: "var(--bg-color-page)",
    padding: isGrid ? "20px" : "16px",
    zoom: 100,
    layoutMode,
    ...(isGrid
      ? {
          gridLayout: {
            rowGap: 12,
            columnGap: 8,
            minColumns: 1,
            maxColumns: 3,
            minWidth: 200,
            colWrap: true,
          },
        }
      : {}),
    ...patch,
  };
}

function mustCreate(type: Parameters<typeof createWidget>[0]): Widget {
  const id = generateWidgetId(type);
  const w = createWidget(type, id);
  if (!w) throw new Error(`Widget type not registered: ${type}`);
  return w;
}

function withFlowStyle(widget: Widget, fullWidth = true): Widget {
  if (!fullWidth) return widget;
  return {
    ...widget,
    style: { ...widget.style, width: "100%" },
  };
}

function seedFormGrid(): Widget[] {
  const title = mustCreate("title");
  title.props = { ...title.props, text: "表单标题", level: 2 };
  title.style = { width: "100%", marginBottom: "16px" };

  const form = mustCreate("form");
  form.style = { width: "100%" };
  form.props = { ...form.props, labelWidth: "100px", labelPosition: "right" };

  const col = mustCreate("double-col");
  col.style = { width: "100%" };

  const inputA = mustCreate("input");
  inputA.field = "name";
  inputA.label = "名称";
  inputA.formId = form.id;
  inputA.colIndex = 0;
  inputA.props = { ...inputA.props, placeholder: "请输入名称" };

  const inputB = mustCreate("input");
  inputB.field = "code";
  inputB.label = "编码";
  inputB.formId = form.id;
  inputB.colIndex = 1;
  inputB.props = { ...inputB.props, placeholder: "请输入编码" };

  col.children = [inputA, inputB];
  form.children = [col];

  const submitBtn = mustCreate("button");
  submitBtn.label = "提交";
  submitBtn.props = { ...submitBtn.props, text: "提交", type: "primary" };
  submitBtn.style = { marginTop: "16px" };

  return [title, form, submitBtn].map((w) => withFlowStyle(w));
}

function seedListGrid(): Widget[] {
  const crud = mustCreate("crud-list-page");
  crud.style = { width: "100%", height: "auto", minHeight: "600px" };
  crud.props = {
    ...crud.props,
    searchBar: {
      enabled: true,
      fields: [
        {
          field: "keyword",
          label: "关键词",
          type: "input",
          span: 8,
          placeholder: "申请人 / 事由",
        },
        {
          field: "status",
          label: "状态",
          type: "select",
          span: 8,
          options: [
            { label: "全部", value: "" },
            { label: "审批中", value: "submitted" },
            { label: "已通过", value: "approved" },
            { label: "已驳回", value: "rejected" },
          ],
        },
        { field: "createdAt", label: "申请日期", type: "date-range", span: 8 },
      ],
    },
    toolbar: [
      { key: "add", label: "新增", type: "primary", icon: "plus" },
      { key: "export", label: "导出", type: "default", icon: "download" },
    ],
  };
  return [withFlowStyle(crud)];
}

function seedDetailGrid(): Widget[] {
  const title = mustCreate("title");
  title.props = { ...title.props, text: "详情页", level: 2 };
  title.style = { width: "100%", marginBottom: "12px" };

  const desc = mustCreate("descriptions");
  desc.style = { width: "100%" };
  desc.props = {
    ...desc.props,
    title: "基本信息",
    column: 2,
    items: [
      { field: "name", label: "名称" },
      { field: "status", label: "状态" },
      { field: "createdAt", label: "创建时间" },
    ],
  };

  const timeline = mustCreate("flow-timeline");
  timeline.style = { width: "100%", marginTop: "16px" };

  return [title, desc, timeline].map((w) => withFlowStyle(w));
}

function seedPageGrid(): Widget[] {
  const title = mustCreate("title");
  title.props = { ...title.props, text: "数据看板", level: 1 };
  title.style = { width: "100%", marginBottom: "16px" };

  const statRow = mustCreate("card");
  statRow.style = { width: "100%", marginBottom: "16px" };

  const chartCard = mustCreate("card");
  chartCard.style = { width: "100%" };

  return [title, statRow, chartCard].map((w) => withFlowStyle(w));
}

function seedGridTemplate(template: GridPageTemplate): BoardSeedResult {
  let widgets: Widget[] = [];
  switch (template) {
    case "form":
      widgets = seedFormGrid();
      break;
    case "list":
      widgets = seedListGrid();
      break;
    case "detail":
      widgets = seedDetailGrid();
      break;
    case "page":
      widgets = seedPageGrid();
      break;
    case "blank":
    default:
      widgets = [];
      break;
  }

  return {
    widgets,
    canvas: baseCanvas("grid", { gridTemplate: template }),
  };
}

function seedFreeTemplate(preset: FreeLayoutPreset): BoardSeedResult {
  if (preset === "dashboard-demo") {
    return seedDashboardDemo();
  }

  const presetConfig = FREE_LAYOUT_PRESETS[preset];
  const { width, height, ...freeLayout } = presetConfig;

  return {
    widgets: [],
    canvas: baseCanvas("free", {
      width,
      height,
      freeLayout,
    }),
  };
}

/** 根据布局模式与模板生成初始 board + widgets */
export function createBoardFromTemplate(
  options: CreateBoardOptions,
): BoardSeedResult {
  const { layoutMode, gridTemplate = "blank", freePreset = "full" } = options;
  const result =
    layoutMode === "grid"
      ? seedGridTemplate(gridTemplate)
      : seedFreeTemplate(freePreset);
  adaptWidgetsToBoardLayout(result.widgets, layoutMode);
  return result;
}

/** CanvasConfig → WidgetRenderer layout */
export function resolveRendererLayout(
  canvas?: Partial<CanvasConfig>,
): "flow" | "absolute" {
  return canvas?.layoutMode === "grid" ? "flow" : "absolute";
}

/** 计算内容区留白样式（EditorCanvas / PublishView 共用） */
export function buildContentFrameStyle(
  canvas?: Partial<CanvasConfig>,
): Record<string, string> {
  if (!canvas) {
    return { width: "100%", height: "100%", boxSizing: "border-box" };
  }
  if (canvas.layoutMode === "grid") {
    const gl = canvas.gridLayout;
    if (!gl?.maxContentWidth) {
      return { width: "100%", height: "100%", boxSizing: "border-box" };
    }
    const style: Record<string, string> = {
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
      maxWidth: `${gl.maxContentWidth}px`,
    };
    if (gl.contentAlign === "center") {
      style.marginLeft = "auto";
      style.marginRight = "auto";
    }
    return style;
  }
  const fl = canvas.freeLayout;
  if (!fl?.maxContentWidth && !fl?.marginX) {
    return { width: "100%", height: "100%", boxSizing: "border-box" };
  }
  const style: Record<string, string> = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
  };
  if (fl.maxContentWidth) {
    style.maxWidth = `${fl.maxContentWidth}px`;
    if (fl.contentAlign === "center") {
      style.marginLeft = "auto";
      style.marginRight = "auto";
    }
  }
  if (fl.marginX) {
    style.paddingLeft = fl.marginX;
    style.paddingRight = fl.marginX;
  }
  return style;
}
