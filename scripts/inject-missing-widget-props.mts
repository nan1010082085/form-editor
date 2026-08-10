/**
 * 将缺失的 widgetProps / styleProps / animationPresets 注入中英 locale
 */
import fs from "node:fs";
import path from "node:path";
import zh from "../src/locales/editor-zh-CN";

/**
 * @param obj - 对象树
 * @param prefix - 前缀
 */
function leafKeys(obj: Record<string, unknown>, prefix = ""): Set<string> {
  const out = new Set<string>();
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const c of leafKeys(v as Record<string, unknown>, p)) out.add(c);
    } else out.add(p);
  }
  return out;
}

const existing = leafKeys(
  (zh as { editor: { widgetProps: Record<string, unknown> } }).editor
    .widgetProps,
);

const labelMap = new Map<string, { en?: string; zh?: string }>();

/**
 * @param d - 目录
 */
function walk(d: string): void {
  for (const name of fs.readdirSync(d)) {
    const p = path.join(d, name);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    if (!/^config(-.*)?\.ts$/.test(name)) continue;
    const text = fs.readFileSync(p, "utf8");
    const patterns: Array<{ re: RegExp; swap: boolean }> = [
      {
        re: /\{\s*key:\s*["']([^"']+)["']\s*,\s*label:\s*["']([^"']+)["']/g,
        swap: false,
      },
      {
        re: /\{\s*label:\s*["']([^"']+)["']\s*,\s*key:\s*["']([^"']+)["']/g,
        swap: true,
      },
    ];
    for (const { re, swap } of patterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const key = swap ? m[2] : m[1];
        const label = swap ? m[1] : m[2];
        const hasCjk = /[\u4e00-\u9fff]/.test(label);
        const prev = labelMap.get(key) || {};
        if (hasCjk) prev.zh = prev.zh || label;
        else prev.en = prev.en || label;
        labelMap.set(key, prev);
      }
    }
  }
}

walk(path.resolve("src/widgets"));

/** 英文 → 中文常用属性名 */
const EN_ZH: Record<string, string> = {
  "File Type": "文件类型",
  "On Color": "开启颜色",
  "Default Active": "默认激活",
  "On Text": "开启文案",
  "Start Request": "发起申请",
  "Add Button Text": "添加按钮文案",
  Addable: "可添加",
  Age: "年龄",
  Aggregation: "聚合",
  "Align Items": "交叉轴对齐",
  "Allow Delete": "允许删除",
  "Allow Preview": "允许预览",
  "Alt Text": "替代文本",
  "Flow API URL": "流程接口地址",
  Approval: "审批",
  "Area Opacity": "区域透明度",
  "Arrow Control": "箭头控制",
  Background: "背景",
  Border: "边框",
  "Button Text": "按钮文案",
  "Button List": "按钮列表",
  "Cancel Text": "取消文案",
  "Title Field": "标题字段",
  "Any Level": "任意层级",
  "Circle Button": "圆形按钮",
  "Clear Button Text": "清除按钮文案",
  Collapsible: "可折叠",
  "Custom Colors": "自定义颜色",
  "Color Format": "颜色格式",
  "Col Count": "列数",
  "Column Field": "列字段",
  "Column Config": "列配置",
  "Comment Widget ID": "评论部件 ID",
  "Compare Label": "对比标签",
  "Confirm Text": "确认文案",
  "Content Mode": "内容模式",
  "Text Position": "文本位置",
  "Created At": "创建时间",
  Currency: "货币",
  "Current Value": "当前值",
  "Tree Data (JSON)": "树数据 (JSON)",
  Date: "日期",
  "Debounce (ms)": "防抖 (ms)",
  "Expand All": "全部展开",
  "Default Expanded": "默认展开",
  Description: "描述",
  "Destroy on Close": "关闭时销毁",
  "Dialog Mode": "弹窗模式",
  Edit: "编辑",
  End: "结束",
  "End Field": "结束字段",
  Export: "导出",
  Field: "字段",
  Fields: "字段列表",
  "Fill Opacity": "填充透明度",
  Filters: "筛选",
  Fit: "适应",
  Gap: "间距",
  Gutter: "间距",
  "Highlight Top": "高亮前几名",
  Icon: "图标",
  Iframe: "内嵌页",
  "Image Field": "图片字段",
  "Image Height": "图片高度",
  "Off Color": "关闭颜色",
  "Off Text": "关闭文案",
  "Instance ID": "实例 ID",
  "Instance ID Variable": "实例 ID 变量",
  "Interval (seconds)": "间隔（秒）",
  "Is Range": "范围选择",
  Items: "列表项",
  Justify: "主轴对齐",
  Key: "键",
  Label: "标签",
  Layout: "布局",
  "Left Title": "左侧标题",
  Level: "级别",
  Limit: "限制",
  "List Type": "列表类型",
  Loop: "循环",
  "Max Height": "最大高度",
  "Max Items": "最大项数",
  "Max Rows": "最大行数",
  "Max Score": "最高分",
  "Max Size": "最大尺寸",
  "Max Tags": "最大标签数",
  "Min Height": "最小高度",
  "Min Rows": "最小行数",
  "Name Key": "名称字段",
  Options: "选项",
  "Page Size": "每页条数",
  "Pause on Hover": "悬停暂停",
  "Pen Color": "笔触颜色",
  "Pen Width": "笔触宽度",
  Plain: "朴素",
  Prefix: "前缀",
  "Previous Value": "上期值",
  "Price Field": "价格字段",
  Progress: "进度",
  "Progress Field": "进度字段",
  Quantity: "数量",
  Range: "范围",
  "Right Title": "右侧标题",
  "Risk Type Field": "风险类型字段",
  Round: "圆形",
  "Row Field": "行字段",
  "Row Height": "行高",
  "Row Key": "行主键",
  Score: "分数",
  "Search Placeholder": "搜索占位",
  Searchable: "可搜索",
  "Series Fields": "系列字段",
  "Series Names": "系列名称",
  Severity: "严重级别",
  "Severity Field": "严重级别字段",
  Shadow: "阴影",
  "Show AI Suggestion": "显示 AI 建议",
  "Show All Levels": "显示全部层级",
  "Show Alpha": "显示透明度",
  "Show Chart": "显示图表",
  "Show Checkbox": "显示复选框",
  "Show Clear": "显示清除",
  "Show Date": "显示日期",
  "Show Description": "显示描述",
  "Show Footer": "显示页脚",
  "Show Fullscreen Button": "显示全屏按钮",
  "Show Icon": "显示图标",
  "Show Image": "显示图片",
  "Show Input": "显示输入框",
  "Show Labels": "显示标签",
  "Show Level": "显示级别",
  "Show Price": "显示价格",
  "Show Progress": "显示进度",
  "Show Rank": "显示排名",
  "Show Search": "显示搜索",
  "Show Stats": "显示统计",
  "Show Status": "显示状态",
  "Show Stops": "显示间断点",
  "Show Time": "显示时间",
  "Show Toolbar": "显示工具栏",
  "Show Totals": "显示合计",
  "Show Trend": "显示趋势",
  "Show Weekday": "显示星期",
  "Size Field": "尺寸字段",
  Sortable: "可排序",
  Source: "数据源",
  Span: "跨度",
  Speed: "速度",
  Src: "地址",
  Start: "开始",
  "Start Field": "开始字段",
  Status: "状态",
  "Status Field": "状态字段",
  Steps: "步骤",
  Stretch: "拉伸",
  Stripe: "斑马纹",
  "Stroke Width": "描边宽度",
  Suffix: "后缀",
  Suggestions: "建议列表",
  "Tab Position": "页签位置",
  "Table Columns": "表格列",
  Tabs: "页签",
  "Target Table ID": "目标表格 ID",
  Targets: "目标",
  "Task Field": "任务字段",
  "Task ID Variable": "任务 ID 变量",
  Text: "文本",
  Thresholds: "阈值",
  Time: "时间",
  "Time Field": "时间字段",
  "Title Font Size": "标题字号",
  Toolbar: "工具栏",
  Trend: "趋势",
  "Trend Key": "趋势字段",
  "Trend Value": "趋势值",
  Url: "链接",
  "Value Font Size": "数值字号",
  "Value Key": "值字段",
  Variant: "变体",
  View: "视图",
  "Virtual Scroll": "虚拟滚动",
  Wrap: "换行",
  Enabled: "启用",
  Title: "标题",
  Width: "宽度",
  Filename: "文件名",
  "API URL": "接口地址",
  "Create API URL": "创建接口",
  "Update API URL": "更新接口",
  "Detail API URL": "详情接口",
  "Confirm Navigate Path": "确认跳转路径",
  "Show Flow Timeline": "显示流程时间线",
  "Apply Navigate Path": "申请跳转路径",
  "Approve Navigate Path": "审批跳转路径",
  Virtual: "虚拟滚动",
  "Col Width (px, 0=auto)": "列宽 (px, 0=自适应)",
};

/**
 * @param enLabel - 英文
 */
function toZh(enLabel: string): string {
  if (EN_ZH[enLabel]) return EN_ZH[enLabel];
  if (/[\u4e00-\u9fff]/.test(enLabel)) return enLabel;
  return enLabel;
}

/**
 * @param obj - 对象
 * @param dotted - 路径
 * @param value - 值
 */
function setPath(
  obj: Record<string, unknown>,
  dotted: string,
  value: string,
): void {
  const parts = dotted.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = (cur[parts[i]] as Record<string, unknown>) || {};
    cur[parts[i]] = next;
    cur = next;
  }
  cur[parts[parts.length - 1]] = value;
}

/**
 * @param obj - 对象
 * @param indent - 缩进
 */
function toSnippet(obj: Record<string, unknown>, indent = 6): string {
  const sp = " ".repeat(indent);
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object") {
      lines.push(`${sp}${k}: {`);
      lines.push(toSnippet(v as Record<string, unknown>, indent + 2));
      lines.push(`${sp}},`);
    } else {
      const s = String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      lines.push(`${sp}${k}: "${s}",`);
    }
  }
  return lines.join("\n");
}

const missing = [...labelMap.keys()].filter((k) => !existing.has(k)).sort();
const zhObj: Record<string, unknown> = {};
const enObj: Record<string, unknown> = {};

for (const k of missing) {
  const lab = labelMap.get(k)!;
  const enLabel = lab.en || k;
  const zhLabel = lab.zh || toZh(lab.en || lab.zh || k);
  setPath(zhObj, k, zhLabel);
  setPath(enObj, k, enLabel);
}

/**
 * @param filePath - locale 文件
 * @param snippet - 插入内容
 * @param marker - 定位：widgetProps 结束前的 rawOption 或 yField
 */
function injectBeforeWidgetPropsClose(
  filePath: string,
  snippet: string,
): void {
  const text = fs.readFileSync(filePath, "utf8");
  // 在第一段 widgetProps 的闭合 `    },` 前插入（紧接 yField 行后）
  const anchor = /      yField: "[^"]*",\n    \},/;
  if (!anchor.test(text)) {
    throw new Error(`anchor not found in ${filePath}`);
  }
  const next = text.replace(
    anchor,
    (m) => m.replace(/\n    \},/, `,\n${snippet}\n    },`),
  );
  fs.writeFileSync(filePath, next);
}

const zhSnippet = toSnippet(zhObj);
const enSnippet = toSnippet(enObj);

injectBeforeWidgetPropsClose("src/locales/editor-zh-CN.ts", zhSnippet);
injectBeforeWidgetPropsClose("src/locales/editor-en-US.ts", enSnippet);

console.log(`injected ${missing.length} widgetProps keys`);
