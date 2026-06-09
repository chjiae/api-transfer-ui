import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/dashboard',
      component: () => import('@/layouts/DashboardLayout.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'channels',
          name: 'channels',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'models',
          name: 'models',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'routing',
          name: 'routing',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'load-balance',
          name: 'load-balance',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'usage',
          name: 'usage',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'cost',
          name: 'cost',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'billing',
          name: 'billing',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'api-keys',
          name: 'api-keys',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'permissions',
          name: 'permissions',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'quota',
          name: 'quota',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'audit',
          name: 'audit',
          component: () => import('@/views/DashboardView.vue'),
        },
      ],
    },
  ],
})

export default router
