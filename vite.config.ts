import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSharedSourceAliases, sharedOptimizeDepsExclude } from '../scripts/vite-shared-source.mjs'
import { createDevApiProxy } from '../scripts/vite-dev-proxy.mjs'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  const env = loadEnv(mode, rootDir, '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'https://pyflow.icu'

  return {
    base: isProd ? '/schema-platform/editor/' : '/',
    plugins: [
      vue(),
      qiankun('editor', { useDevMode: true }),
    ],
    css: {
      preprocessorOptions: {
        scss: { api: 'modern-compiler' },
      },
    },
    build: {
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          format: 'umd',
          name: 'editor',
        },
      },
    },
    resolve: {
      alias: [
        { find: '@', replacement: resolve(rootDir, 'src') },
        ...createSharedSourceAliases(import.meta.url, { platformShared: true }),
      ],
      dedupe: ['vue', 'vue-router', 'pinia', 'element-plus'],
    },
    optimizeDeps: {
      exclude: sharedOptimizeDepsExclude({ platformShared: true }),
    },
    server: {
      port: 5100,
      strictPort: true,
      cors: true,
      headers: { 'Access-Control-Allow-Origin': '*' },
      proxy: createDevApiProxy(proxyTarget),
    },
  }
})
