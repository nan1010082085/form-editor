<script setup lang="ts">
/**
 * BreadcrumbNav — BreadcrumbNavigation
 *
 * 根据当前Route自动生成Breadcrumb路径。
 */
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import styles from "./BreadcrumbNav.module.scss";

const route = useRoute();
const router = useRouter();

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const routeLabelMap: Record<string, string> = {
  instances: "Instances",
  "widget-templates": "Template Library",
  submissions: "FormSubmitData",
  credentials: "Credentials",
};

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [{ label: "Home", path: "/instances" }];

  const routeName = route.name as string | undefined;
  if (routeName && routeLabelMap[routeName]) {
    const isHome = routeName === "instances";
    if (!isHome) {
      items.push({ label: routeLabelMap[routeName] });
    }
  }

  return items;
});

function handleClick(item: BreadcrumbItem) {
  if (item.path) {
    router.push(item.path);
  }
}
</script>

<template>
  <nav v-if="breadcrumbs.length > 1" :class="styles.breadcrumb">
    <template v-for="(item, index) in breadcrumbs" :key="index">
      <span v-if="index > 0" :class="styles.separator">/</span>
      <span
        v-if="item.path && index < breadcrumbs.length - 1"
        :class="styles.item"
        @click="handleClick(item)"
        >{{ item.label }}</span
      >
      <span v-else :class="styles.current">{{ item.label }}</span>
    </template>
  </nav>
</template>
