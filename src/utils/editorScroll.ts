/** 将画布上指定Widget滚动到可见Region */
export function scrollToWidget(id: string): void {
  const el = document.querySelector(
    `[data-widget-id="${id}"]`,
  ) as HTMLElement | null;
  el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

/** 将结构树当前节点滚动到可见Region */
export function scrollTreeNodeIntoView(
  treeRoot: HTMLElement | undefined,
  nodeId: string,
): void {
  if (!treeRoot) return;
  const current =
    (treeRoot.querySelector(`[data-key="${nodeId}"]`) as HTMLElement | null) ??
    (treeRoot.querySelector(".is-current") as HTMLElement | null);
  current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
