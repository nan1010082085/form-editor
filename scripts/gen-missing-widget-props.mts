/**
 * 扫描 widgets config 中 propertyPanel 的 key/label，
 * 与 locale widgetProps 对比，生成缺失词条片段。
 */
import fs from "node:fs";
import path from "node:path";
import zh from "../src/locales/editor-zh-CN";
import en from "../src/locales/editor-en-US";

/**
 * @param obj - 对象树
 * @param prefix - 路径前缀
 */
function leafKeys(obj: Record<string, unknown>, prefix = ""): Set<string> {
  const out = new Set<string>();
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const c of leafKeys(v as Record<string, unknown>, p)) out.add(c);
    } else {
      out.add(p);
    }
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

const missing = [...labelMap.keys()].filter((k) => !existing.has(k)).sort();

/** 英文 label → 中文（常见词） */
const EN_ZH: Record<string, string> = {
  Age: "年龄",
  Aggregation: "聚合",
  Alt: "替代文本",
  "Area Opacity": "区域透明度",
  "Background Color": "背景色",
  Buttons: "按钮",
  "Card Subtitle Field": "卡片副标题字段",
  "Card Title Field": "卡片标题字段",
  "Checked Items": "已选项",
  "Checked Keys": "勾选键",
  Circle: "圆形",
  "Clear Text": "清除文案",
  Collapsible: "可折叠",
  Column: "列",
  "Column Field": "列字段",
  Conditions: "条件",
  Currency: "货币",
  "Current Step": "当前步骤",
  Data: "数据",
  "Default Expanded": "默认展开",
  Done: "完成",
  End: "结束",
  "End Field": "结束字段",
  "Expand All": "全部展开",
  "Fill Opacity": "填充透明度",
  "Filter Data": "筛选数据",
  Filters: "筛选",
  Fit: "适应",
  "Form Data": "表单数据",
  Gap: "间距",
  "Image Field": "图片字段",
  "Image Height": "图片高度",
  "Is Empty": "是否为空",
  Items: "项",
  Justify: "对齐",
  Key: "键",
  Layout: "布局",
  Logic: "逻辑",
  Logs: "日志",
  "Max Height": "最大高度",
  "Max Rows": "最大行数",
  "Max Score": "最高分",
  "Min Height": "最小高度",
  "Min Rows": "最小行数",
  "Page Size": "每页条数",
  "Pen Color": "笔触颜色",
  "Pen Width": "笔触宽度",
  "Pivot Data": "透视数据",
  Plain: "朴素",
  "Price Field": "价格字段",
  "Product Data": "产品数据",
  "Progress Field": "进度字段",
  Quantity: "数量",
  Remark: "备注",
  "Risk Type Field": "风险类型字段",
  Round: "圆形",
  "Row Field": "行字段",
  "Row Height": "行高",
  Score: "分数",
  "Selected Node": "选中节点",
  "Selected Task": "选中任务",
  "Series Fields": "系列字段",
  "Series Names": "系列名称",
  Severity: "严重级别",
  "Severity Field": "严重级别字段",
  "Show Chart": "显示图表",
  "Show Clear": "显示清除",
  "Show Description": "显示描述",
  "Show Icon": "显示图标",
  "Show Image": "显示图片",
  "Show Labels": "显示标签",
  "Show Level": "显示级别",
  "Show Price": "显示价格",
  "Show Progress": "显示进度",
  "Show Stats": "显示统计",
  "Show Totals": "显示合计",
  "Size Field": "尺寸字段",
  Start: "开始",
  "Start Field": "开始字段",
  Steps: "步骤",
  Targets: "目标",
  "Task Data": "任务数据",
  "Task Field": "任务字段",
  "Task Id": "任务 ID",
  Time: "时间",
  "Time Field": "时间字段",
  "Total Steps": "总步骤",
  View: "视图",
  Virtual: "虚拟滚动",
  Wrap: "换行",
  Enabled: "启用",
  Title: "标题",
  Width: "宽度",
  Fields: "字段",
  Filename: "文件名",
  "Api Url": "接口地址",
  "Create Api Url": "创建接口",
  "Update Api Url": "更新接口",
  "Detail Api Url": "详情接口",
  "Confirm Text": "确认文案",
  "Confirm Navigate Path": "确认跳转路径",
  "Show Flow Timeline": "显示流程时间线",
  "Apply Navigate Path": "申请跳转路径",
  "Approve Navigate Path": "审批跳转路径",
  Export: "导出",
  Search: "搜索",
  Selection: "选择",
  Pagination: "分页",
  "Form Dialog": "表单弹窗",
  "Detail Dialog": "详情弹窗",
  "Page Actions": "页面操作",
  "Search Bar": "搜索栏",
};

/**
 * @param enLabel - 英文标签
 */
function toZh(enLabel: string): string {
  if (EN_ZH[enLabel]) return EN_ZH[enLabel];
  if (/[\u4e00-\u9fff]/.test(enLabel)) return enLabel;
  return enLabel;
}

/**
 * @param obj - 目标对象
 * @param dotted - 点分路径
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
 * @param indent - 缩进空格
 */
function toSnippet(obj: Record<string, unknown>, indent = 6): string {
  const sp = " ".repeat(indent);
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object") {
      lines.push(`${sp}${JSON.stringify(k).replace(/^"|"$/g, "")}: {`);
      // keep unquoted keys for valid identifiers
      lines.pop();
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

const zhObj: Record<string, unknown> = {};
const enObj: Record<string, unknown> = {};

for (const k of missing) {
  const lab = labelMap.get(k)!;
  const enLabel = lab.en || lab.zh || k;
  const zhLabel = lab.zh || toZh(enLabel);
  setPath(zhObj, k, zhLabel);
  setPath(enObj, k, enLabel);
}

fs.writeFileSync("/tmp/widgetProps-missing-zh.txt", toSnippet(zhObj) + "\n");
fs.writeFileSync("/tmp/widgetProps-missing-en.txt", toSnippet(enObj) + "\n");
console.log(`missing=${missing.length}`);
console.log(missing.join(", "));
