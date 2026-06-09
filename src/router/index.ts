import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'

const Placeholder = () => import('@/views/PlaceholderView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/dashboard',
      component: () => import('@/layouts/DashboardLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'chat', name: 'chat', component: () => import('@/views/ChatView.vue') },
        { path: 'analytics', name: 'analytics', component: () => import('@/views/DashboardView.vue') },
        { path: 'channels', name: 'channels', component: () => import('@/views/ChannelsView.vue') },
        { path: 'models', name: 'models', component: () => import('@/views/ModelsView.vue') },
        { path: 'routing', name: 'routing', component: Placeholder },
        { path: 'load-balance', name: 'load-balance', component: Placeholder },
        { path: 'usage', name: 'usage', component: () => import('@/views/UsageLogsView.vue') },
        { path: 'cost', name: 'cost', component: () => import('@/views/CostAnalysisView.vue') },
        { path: 'billing', name: 'billing', component: Placeholder },
        { path: 'api-keys', name: 'api-keys', component: () => import('@/views/ApiKeysView.vue') },
        { path: 'permissions', name: 'permissions', component: () => import('@/views/UserManagementView.vue') },
        { path: 'quota', name: 'quota', component: () => import('@/views/UserManagementView.vue') },
        { path: 'audit', name: 'audit', component: () => import('@/views/AuditLogView.vue') },
      ],
    },
  ],
})

export default router
