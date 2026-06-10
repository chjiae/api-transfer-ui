import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import { getToken } from '@/network/http'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    {
      path: '/dashboard',
      component: () => import('@/layouts/DashboardLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'chat', name: 'chat', component: () => import('@/views/ChatView.vue') },
        { path: 'channels', name: 'channels', component: () => import('@/views/ChannelsView.vue') },
        { path: 'channel-costs', name: 'channel-costs', component: () => import('@/views/ChannelCostsView.vue') },
        { path: 'models', name: 'models', component: () => import('@/views/ModelsView.vue') },
        { path: 'routing', name: 'routing', component: () => import('@/views/PlaceholderView.vue') },
        { path: 'load-balance', name: 'load-balance', component: () => import('@/views/PlaceholderView.vue') },
        { path: 'usage', name: 'usage', component: () => import('@/views/UsageLogsView.vue') },
        { path: 'cost', name: 'cost', component: () => import('@/views/CostAnalysisView.vue') },
        { path: 'billing', name: 'billing', component: () => import('@/views/PlaceholderView.vue') },
        { path: 'api-keys', name: 'api-keys', component: () => import('@/views/ApiKeysView.vue') },
        { path: 'permissions', name: 'permissions', component: () => import('@/views/UserManagementView.vue') },
        { path: 'quota', name: 'quota', component: () => import('@/views/UserManagementView.vue') },
        { path: 'audit', name: 'audit', component: () => import('@/views/AuditLogView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

// 登录守卫：未登录访问受保护页 → 跳登录；已登录访问登录页 → 跳概览
router.beforeEach((to) => {
  const authed = !!getToken()
  if (!to.meta.public && !authed) return { name: 'login' }
  if (to.name === 'login' && authed) return { name: 'dashboard' }
  return true
})

export default router
