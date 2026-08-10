<script setup lang="ts">
/**
 * AppLayout — 全局Layout壳
 *
 * SidebarNavigation + 主内容区。Edit器/预览/发布页不使用此Layout。
 */
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "@schema-platform/platform-shared";
import styles from "./AppLayout.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import { useQiankunShell } from "@schema-platform/platform-shared/qiankun";
import { useAppLocale } from "@/composables/useAppLocale";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { locale, toggleLocale } = useAppLocale();
const { isQiankunSubApp, shouldHideSubAppMenu, goToShellHome } =
  useQiankunShell();

const navItems = computed(() => [
  {
    path: "/instances",
    label: t("editor.appLayout.instances"),
    icon: "odometer",
  },
  {
    path: "/templates",
    label: t("editor.appLayout.templates"),
    icon: "grid",
  },
  {
    path: "/widget-market",
    label: t("editor.appLayout.widgetMarket"),
    icon: "goods",
  },
]);

const activeNav = computed(() => {
  if (route.path.startsWith("/templates")) return "/templates";
  return route.path;
});

const langButtonLabel = computed(() =>
  locale.value === "zh-CN"
    ? t("editor.toolbar.langEn")
    : t("editor.toolbar.langZh"),
);
</script>

<template>
  <div :class="[styles.layout, shouldHideSubAppMenu && styles.layoutEmbedded]">
    <!-- Sidebar -->
    <aside v-if="!shouldHideSubAppMenu" :class="styles.sidebar">
      <div :class="styles.logo" @click="router.push('/instances')">
        <span :class="styles.logoText">{{ t("editor.appLayout.brand") }}</span>
      </div>

      <nav :class="styles.nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="[
            styles.navItem,
            activeNav === item.path && styles.navItemActive,
          ]"
        >
          <AppIcon :name="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div :class="styles.sidebarFooter">
        <button
          type="button"
          :class="[styles.navItem, styles.footerItem, styles.langBtn]"
          :title="t('editor.appLayout.language')"
          @click="toggleLocale"
        >
          <span :class="styles.langBadge">{{ langButtonLabel }}</span>
          <span>{{ t("editor.appLayout.language") }}</span>
        </button>
        <button
          v-if="isQiankunSubApp && !shouldHideSubAppMenu"
          type="button"
          :class="[styles.navItem, styles.footerItem]"
          :title="t('editor.appLayout.backHomeTitle')"
          @click="goToShellHome"
        >
          <AppIcon name="home-filled" :size="18" />
          <span>{{ t("editor.appLayout.backHome") }}</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main :class="styles.main">
      <router-view />
    </main>
  </div>
</template>
