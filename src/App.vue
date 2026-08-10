<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import { ElConfigProvider } from "element-plus";
import "@schema-platform/platform-shared/styles/css-variables.scss";
import { useAppStore } from "@/stores/app";
import { fetchCurrentUser } from "@/utils/apiClient";
import { useAppLocale } from "@/composables/useAppLocale";

const appStore = useAppStore();
const { epLocale } = useAppLocale();

onMounted(async () => {
  // /perf 压测页无需登录, 跳过User上下文加载（避免 401 Trigger跳登录）
  if (window.location.pathname.endsWith("/perf")) return;
  try {
    const user = await fetchCurrentUser();
    appStore.userContext.id = user.id;
    appStore.userContext.name = user.displayName || user.username;
    appStore.userContext.roles = user.roles ?? [];
    appStore.userContext.permissions = user.permissions ?? [];
    appStore.userContext.deptId = user.deptId ?? "";
  } catch {
    // 静默Failed：Route守卫已处理未登录跳转, 此处仅填充 userContext
  }
});
</script>

<template>
  <ElConfigProvider :locale="epLocale" :size="'default'" :z-index="2000">
    <RouterView />
  </ElConfigProvider>
</template>
