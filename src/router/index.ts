import { createRouter, createWebHistory } from "vue-router";
import { ElMessageBox } from "element-plus";
import { useEditorStore } from "@/stores/editor";
import { tt } from "@/locales";
import { useAuthStore } from "@schema-platform/platform-shared/utils/stores/authStore";
import { guardAuthenticatedRoute } from "@schema-platform/platform-shared/utils/authSession";

// qiankun 模式下使用 memory history, 避免子应用Route篡改宿主 URL
const isQiankunSubApp = () => !!window.__POWERED_BY_QIANKUN__;

const routes = [
  // ---- 共享登录页（独立模式） ----
  {
    path: "/login",
    name: "login",
    component: () =>
      import("@schema-platform/platform-shared/components/auth/LoginView.vue"),
    props: {
      title: "Form Designer",
      subtitle: "Schema Form Platform",
    },
    meta: { public: true },
  },

  // ---- SSO Callback ----
  {
    path: "/auth/callback",
    name: "auth-callback",
    component: () => import("@/views/AuthCallbackView.vue"),
    meta: { public: true },
  },

  // ---- Redirects ----
  { path: "/", redirect: "/instances" },
  {
    path: "/renderer",
    redirect: (to: { query: { id?: string } }) =>
      `/view?id=${to.query.id || ""}`,
  },

  // ---- 带全局Layout的管理Page ----
  {
    path: "/",
    component: () => import("@/components/AppLayout.vue"),
    children: [
      {
        path: "instances",
        name: "instances",
        component: () => import("@/views/InstancesView.vue"),
      },
      {
        path: "templates",
        name: "widget-templates",
        component: () => import("@/views/WidgetTemplateView.vue"),
      },
      {
        path: "credentials",
        name: "credentials",
        component: () => import("@/views/CredentialListView.vue"),
      },
      {
        path: "tenants",
        name: "tenants",
        component: () => import("@/views/TenantListView.vue"),
      },
      {
        path: "key-usage",
        name: "key-usage",
        component: () => import("@/views/KeyUsageAuditView.vue"),
      },
      {
        path: "submissions",
        name: "submissions",
        component: () => import("@/views/SubmissionListView.vue"),
      },
      {
        path: "widget-docs",
        name: "widget-docs",
        component: () => import("@/views/WidgetDocsView.vue"),
      },
      {
        path: "widget-market",
        name: "widget-market",
        component: () => import("@/views/WidgetMarketView.vue"),
      },
    ],
  },

  // ---- 全屏Page（无Layout壳）----
  {
    path: "/editor",
    name: "editor",
    component: () => import("@/views/EditorView.vue"),
  },
  {
    path: "/preview",
    name: "preview-render",
    component: () => import("@/views/PreviewRenderView.vue"),
  },
  {
    path: "/perf",
    name: "perf",
    component: () => import("@/views/PerfView.vue"),
    meta: { public: true },
  },
  {
    path: "/view/:schemaCode",
    name: "publish-view-by-code",
    component: () => import("@/views/PublishView.vue"),
  },
  {
    path: "/view",
    name: "publish-view",
    component: () => import("@/views/PublishView.vue"),
  },

  // ---- 403 ----
  {
    path: "/403",
    name: "forbidden",
    component: () => import("@/views/ForbiddenView.vue"),
  },

  // ---- 404 ----
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/NotFoundView.vue"),
  },
];

/**
 * 从浏览器 URL 自动推导子应用的Route base。
 * qiankun 模式下 shell passed getRouteBase() 下发；独立运RowHrs从 URL 推导。
 */
function inferRouteBase(): string {
  const p = window.location.pathname;
  const match = p.match(/^(.+?\/)(app|standalone)\/([^/]+)(\/|$)/);
  if (match) {
    return `${match[1]}${match[2]}/${match[3]}`;
  }
  return "";
}

function resolveRouteBase(routeBase?: string): string {
  if (routeBase) return routeBase;
  const inferred = inferRouteBase();
  if (inferred) return inferred;
  const viteBase = import.meta.env.BASE_URL;
  if (viteBase && viteBase !== "/") return viteBase;
  return import.meta.env.VITE_ROUTE_BASE || "/";
}

export function createEditorRouter(routeBase?: string) {
  const base = resolveRouteBase(routeBase);
  const router = createRouter({
    history: createWebHistory(base),
    routes,
  });

  // Route守卫：独立访问Hrs检查登录Status
  router.beforeEach(async (to) => {
    if (
      to.name === "forbidden" ||
      to.name === "not-found" ||
      to.name === "auth-callback" ||
      to.name === "login"
    ) {
      if (to.name === "login" && !isQiankunSubApp()) {
        const authStore = useAuthStore();
        if (authStore.accessToken && authStore.user) {
          let redirect = (to.query.redirect as string) || "/";
          const base = import.meta.env.BASE_URL || "/";
          if (base !== "/" && redirect.startsWith(base)) {
            redirect = "/" + redirect.slice(base.length);
          }
          return { path: redirect };
        }
      }
      return true;
    }

    return guardAuthenticatedRoute(to);
  });

  // Route守卫：Edit器未SaveHrs拦截离开
  let allowEditorLeave = false;

  router.beforeEach((to, from) => {
    if (allowEditorLeave) {
      allowEditorLeave = false;
      return true;
    }

    if (from.name === "editor") {
      const editorStore = useEditorStore();
      if (editorStore.isDirty) {
        // 弹框Confirm（Async）, 先阻止Navigation
        ElMessageBox.confirm(
          tt("editor.common.unsavedChanges"),
          tt("editor.common.info"),
          {
            confirmButtonText: tt("editor.editorView.confirmLeave"),
            cancelButtonText: tt("editor.common.cancel"),
            type: "warning",
          },
        )
          .then(() => {
            allowEditorLeave = true;
            router.push(to.fullPath);
          })
          .catch(() => {
            // UserCancel：Restore浏览器 URL 到当前Route（仅非微前端模式）
            if (!isQiankunSubApp()) {
              window.history.pushState(
                null,
                "",
                router.resolve(from.fullPath).href,
              );
            }
          });
        return false;
      }
    }
  });

  return router;
}
