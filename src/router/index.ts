import { createRouter, createWebHistory } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useEditorStore } from '@/stores/editor'
import { useAuthStore } from '@schema-platform/platform-shared/utils/stores/authStore'
import { guardAuthenticatedRoute } from '@schema-platform/platform-shared/utils/authSession'

// qiankun 模式下使用 memory history，避免子应用路由篡改宿主 URL
const isQiankunSubApp = () => !!window.__POWERED_BY_QIANKUN__

const routes = [
  // ---- 共享登录页（独立模式） ----
  {
    path: '/login',
    name: 'login',
    component: () => import('@schema-platform/platform-shared/components/auth/LoginView.vue'),
    props: {
      title: '表单设计器',
      subtitle: 'Schema Form Platform',
    },
    meta: { public: true },
  },

  // ---- SSO Callback ----
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/views/AuthCallbackView.vue'),
    meta: { public: true },
  },

  // ---- Redirects ----
  { path: '/', redirect: '/instances' },
  {
    path: '/renderer',
    redirect: (to: { query: { id?: string } }) => `/view?id=${to.query.id || ''}`,
  },

  // ---- 带全局布局的管理页面 ----
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    children: [
      {
        path: 'instances',
        name: 'instances',
        component: () => import('@/views/InstancesView.vue'),
      },
      {
        path: 'templates',
        name: 'widget-templates',
        component: () => import('@/views/WidgetTemplateView.vue'),
      },
      {
        path: 'credentials',
        name: 'credentials',
        component: () => import('@/views/CredentialListView.vue'),
      },
      {
        path: 'tenants',
        name: 'tenants',
        component: () => import('@/views/TenantListView.vue'),
      },
      {
        path: 'key-usage',
        name: 'key-usage',
        component: () => import('@/views/KeyUsageAuditView.vue'),
      },
      {
        path: 'submissions',
        name: 'submissions',
        component: () => import('@/views/SubmissionListView.vue'),
      },
      {
        path: 'widget-docs',
        name: 'widget-docs',
        component: () => import('@/views/WidgetDocsView.vue'),
      },
    ],
  },

  // ---- 全屏页面（无布局壳）----
  {
    path: '/editor',
    name: 'editor',
    component: () => import('@/views/EditorView.vue'),
  },
  {
    path: '/preview',
    name: 'preview-render',
    component: () => import('@/views/PreviewRenderView.vue'),
  },
  {
    path: '/view/:schemaCode',
    name: 'publish-view-by-code',
    component: () => import('@/views/PublishView.vue'),
  },
  {
    path: '/view',
    name: 'publish-view',
    component: () => import('@/views/PublishView.vue'),
  },

  // ---- 403 ----
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
  },

  // ---- 404 ----
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

/**
 * 从浏览器 URL 自动推导子应用的路由 base。
 * qiankun 模式下 shell 通过 getRouteBase() 下发；独立运行时从 URL 推导。
 */
function inferRouteBase(): string {
  const p = window.location.pathname
  const match = p.match(/^(.+?\/)(app|standalone)\/([^/]+)(\/|$)/)
  if (match) {
    return `${match[1]}${match[2]}/${match[3]}`
  }
  return ''
}

function resolveRouteBase(routeBase?: string): string {
  if (routeBase) return routeBase
  const inferred = inferRouteBase()
  if (inferred) return inferred
  const viteBase = import.meta.env.BASE_URL
  if (viteBase && viteBase !== '/') return viteBase
  return import.meta.env.VITE_ROUTE_BASE || '/'
}

export function createEditorRouter(routeBase?: string) {
  const base = resolveRouteBase(routeBase)
  const router = createRouter({
    history: createWebHistory(base),
    routes,
  })

  // 路由守卫：独立访问时检查登录状态
  router.beforeEach(async (to) => {
    if (to.name === 'forbidden' || to.name === 'not-found' || to.name === 'auth-callback' || to.name === 'login') {
      if (to.name === 'login' && !isQiankunSubApp()) {
        const authStore = useAuthStore()
        if (authStore.accessToken && authStore.user) {
          return { path: (to.query.redirect as string) || '/' }
        }
      }
      return true
    }

    return guardAuthenticatedRoute(to)
  })

  // 路由守卫：编辑器未保存时拦截离开
  let allowEditorLeave = false

  router.beforeEach((to, from) => {
    if (allowEditorLeave) {
      allowEditorLeave = false
      return true
    }

    if (from.name === 'editor') {
      const editorStore = useEditorStore()
      if (editorStore.isDirty) {
        // 弹框确认（异步），先阻止导航
        ElMessageBox.confirm('当前编辑未保存，确定要离开吗？', '提示', {
          confirmButtonText: '确定离开',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(() => {
          allowEditorLeave = true
          router.push(to.fullPath)
        }).catch(() => {
          // 用户取消：恢复浏览器 URL 到当前路由（仅非微前端模式）
          if (!isQiankunSubApp()) {
            window.history.pushState(null, '', router.resolve(from.fullPath).href)
          }
        })
        return false
      }
    }
  })

  return router
}
