<script setup lang="ts">
import {
  PhChatCircle as ChatCircle,
  PhSquaresFour as SquaresFour,
  PhChartLine as ChartLine,
  PhStack as Stack,
  PhShareNetwork as ShareNetwork,
  PhArrowsSplit as ArrowsSplit,
  PhScales as Scales,
  PhPulse as Pulse,
  PhCurrencyDollar as CurrencyDollar,
  PhReceipt as Receipt,
  PhKey as Key,
  PhShieldCheck as ShieldCheck,
  PhGauge as Gauge,
  PhClipboardText as ClipboardText,
  PhList as List,
  PhX as X,
  PhSignOut as SignOut,
  PhCaretUpDown as CaretUpDown,
  PhSidebarSimple as SidebarSimple,
} from '@phosphor-icons/vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { fetchSelf } from '@/network/user'
import { clearToken } from '@/network/http'
import UiThemeToggle from '@/components/ui/UiThemeToggle.vue'

const route = useRoute()
const router = useRouter()
const sidebarCollapsed = ref(false)
const mobileDrawerOpen = ref(false)

const isActive = (path: string) =>
  path === '/dashboard' ? route.path === path : route.path.startsWith(path)

interface NavItem {
  path: string
  icon: typeof ChatCircle
  label: string
  soon?: boolean
}
interface NavGroup {
  label: string
  items: NavItem[]
}

const menuGroups: NavGroup[] = [
  {
    label: '',
    items: [
      { path: '/dashboard', icon: SquaresFour, label: '概览' },
      { path: '/dashboard/chat', icon: ChatCircle, label: '调试对话' },
      { path: '/dashboard/analytics', icon: ChartLine, label: '数据看板' },
    ],
  },
  {
    label: '接入',
    items: [
      { path: '/dashboard/channels', icon: Stack, label: '上游通道' },
      { path: '/dashboard/models', icon: ShareNetwork, label: '模型目录' },
      { path: '/dashboard/routing', icon: ArrowsSplit, label: '路由策略', soon: true },
      { path: '/dashboard/load-balance', icon: Scales, label: '负载均衡', soon: true },
    ],
  },
  {
    label: '用量',
    items: [
      { path: '/dashboard/usage', icon: Pulse, label: '调用明细' },
      { path: '/dashboard/cost', icon: CurrencyDollar, label: '成本分析' },
      { path: '/dashboard/billing', icon: Receipt, label: '账单', soon: true },
    ],
  },
  {
    label: '治理',
    items: [
      { path: '/dashboard/api-keys', icon: Key, label: '密钥' },
      { path: '/dashboard/permissions', icon: ShieldCheck, label: '成员与权限' },
      { path: '/dashboard/quota', icon: Gauge, label: '配额' },
      { path: '/dashboard/audit', icon: ClipboardText, label: '审计日志' },
    ],
  },
]

const closeMobile = () => {
  mobileDrawerOpen.value = false
}

// —— 真实用户信息 ——
const displayName = ref('账户')
const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())
const userMenuOpen = ref(false)

onMounted(async () => {
  try {
    const me = await fetchSelf()
    displayName.value = me.displayName || me.username || '账户'
  } catch {
    /* 401 拦截器会处理跳转 */
  }
})

const signOut = () => {
  clearToken()
  router.push('/login')
}
</script>

<template>
  <div class="shell">
    <!-- 移动端遮罩 -->
    <Transition name="fade">
      <div v-if="mobileDrawerOpen" class="drawer-scrim" @click="closeMobile" />
    </Transition>

    <!-- ===== 侧边栏 ===== -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileDrawerOpen }">
      <div class="sidebar-head">
        <RouterLink class="brand" to="/dashboard" @click="closeMobile">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M4 9h11l-3-3M20 15H9l3 3" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span v-show="!sidebarCollapsed" class="brand-name">Relay</span>
        </RouterLink>
        <button class="mobile-close" aria-label="关闭菜单" @click="closeMobile">
          <X :size="20" />
        </button>
      </div>

      <nav class="nav">
        <template v-for="(group, gi) in menuGroups" :key="gi">
          <span v-if="group.label && !sidebarCollapsed" class="nav-group">{{ group.label }}</span>
          <div v-else-if="group.label && sidebarCollapsed" class="nav-divider" />
          <RouterLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path), soon: item.soon }"
            :title="sidebarCollapsed ? item.label : undefined"
            @click="closeMobile"
          >
            <component :is="item.icon" :size="18" :weight="isActive(item.path) ? 'fill' : 'regular'" />
            <span v-show="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
            <span v-if="item.soon && !sidebarCollapsed" class="nav-soon">待开放</span>
          </RouterLink>
        </template>
      </nav>

      <div class="sidebar-foot">
        <button class="collapse-btn" :aria-label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
          @click="sidebarCollapsed = !sidebarCollapsed">
          <SidebarSimple :size="18" />
          <span v-show="!sidebarCollapsed">收起</span>
        </button>
      </div>
    </aside>

    <!-- ===== 主区 ===== -->
    <div class="main">
      <header class="topbar">
        <button class="mobile-menu-btn" aria-label="打开菜单" @click="mobileDrawerOpen = true">
          <List :size="20" />
        </button>

        <div class="topbar-spacer" />

        <div class="topbar-right">
          <UiThemeToggle />

          <div class="user" :class="{ open: userMenuOpen }">
            <button class="user-btn" @click="userMenuOpen = !userMenuOpen" @blur="userMenuOpen = false">
              <span class="avatar">{{ userInitial }}</span>
              <span class="user-name">{{ displayName }}</span>
              <CaretUpDown :size="14" class="user-caret" />
            </button>
            <Transition name="pop">
              <div v-if="userMenuOpen" class="user-pop">
                <div class="user-pop-head">
                  <span class="avatar lg">{{ userInitial }}</span>
                  <div class="user-pop-meta">
                    <strong>{{ displayName }}</strong>
                    <small>已登录</small>
                  </div>
                </div>
                <button class="user-pop-item danger" @mousedown.prevent="signOut">
                  <SignOut :size="16" />
                  退出登录
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <main class="content">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  height: 100dvh;
  overflow: hidden;
  background: var(--canvas);
}

/* ---------- 侧边栏 ---------- */
.sidebar {
  position: relative;
  z-index: 30;
  width: 232px;
  min-width: 232px;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--line);
  transition: width var(--dur) var(--ease), min-width var(--dur) var(--ease);
}
.sidebar.collapsed {
  width: 60px;
  min-width: 60px;
}

.sidebar-head {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: var(--text-on-brand);
  background: var(--accent);
  border-radius: var(--radius-md);
}
.brand-name {
  font-size: var(--text-lg);
  font-weight: 620;
  letter-spacing: -0.02em;
  color: var(--text);
}

.collapsed .sidebar-head {
  padding: 0 16px;
}

/* ---------- 导航 ---------- */
.nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) 10px var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.nav-group {
  padding: var(--space-4) 10px var(--space-1);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-3);
}
.nav-divider {
  height: 1px;
  margin: var(--space-3) 8px;
  background: var(--line);
}
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 10px;
  border-radius: var(--radius-md);
  color: var(--text-2);
  font-size: var(--text-base);
  font-weight: 460;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.nav-item:hover {
  background: var(--surface-2);
  color: var(--text);
}
.nav-item.active {
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: 540;
}
.nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
}
.nav-soon {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-3);
  background: var(--surface-2);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}
.nav-item.active .nav-soon {
  background: transparent;
}
.collapsed .nav-item {
  justify-content: center;
  padding: 0;
}

/* ---------- 侧栏底部 ---------- */
.sidebar-foot {
  padding: var(--space-2) 10px var(--space-3);
  border-top: 1px solid var(--line);
}
.collapse-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-3);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.collapse-btn:hover {
  background: var(--surface-2);
  color: var(--text);
}
.collapsed .collapse-btn {
  justify-content: center;
  padding: 0;
}
.mobile-close {
  display: none;
}

/* ---------- 主区 ---------- */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
.topbar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 56px;
  padding: 0 var(--space-5);
  background: color-mix(in srgb, var(--canvas) 80%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.topbar-spacer {
  flex: 1;
}
.mobile-menu-btn {
  display: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* 用户菜单 */
.user {
  position: relative;
}
.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 8px 0 6px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: background var(--dur-fast);
}
.user-btn:hover {
  background: var(--surface-2);
}
.avatar {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-on-brand);
  background: var(--accent);
  border-radius: var(--radius-sm);
}
.avatar.lg {
  width: 36px;
  height: 36px;
  font-size: 15px;
  border-radius: var(--radius-md);
}
.user-name {
  font-size: var(--text-sm);
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-caret {
  color: var(--text-3);
}
.user-pop {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 220px;
  padding: var(--space-2);
  background: var(--overlay);
  border: 1px solid var(--line-2);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.user-pop-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: var(--space-2) var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--line);
  margin-bottom: var(--space-2);
}
.user-pop-meta {
  min-width: 0;
}
.user-pop-meta strong {
  display: block;
  font-size: var(--text-sm);
  font-weight: 560;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-pop-meta small {
  font-size: var(--text-xs);
  color: var(--text-3);
}
.user-pop-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-2);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.user-pop-item.danger:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

/* ---------- 内容 ---------- */
.content {
  flex: 1;
  overflow-y: auto;
}

/* ---------- 动效 ---------- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--dur) var(--ease);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.pop-enter-active {
  transition: opacity var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
}
.pop-leave-active {
  transition: opacity var(--dur-fast) var(--ease);
}
.pop-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}
.pop-leave-to {
  opacity: 0;
}
.page-enter-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

/* ---------- 移动端抽屉 ---------- */
.drawer-scrim {
  position: fixed;
  inset: 0;
  z-index: 28;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}
@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 248px;
    min-width: 248px;
    transform: translateX(-100%);
    transition: transform var(--dur-slow) var(--ease);
    box-shadow: var(--shadow-lg);
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  .sidebar.collapsed {
    width: 248px;
    min-width: 248px;
  }
  .sidebar.collapsed .brand-name,
  .sidebar.collapsed .nav-label,
  .sidebar.collapsed .nav-soon {
    display: inline !important;
  }
  .sidebar.collapsed .nav-item {
    justify-content: flex-start;
    padding: 0 10px;
  }
  .mobile-close {
    display: grid;
    place-items: center;
    margin-left: auto;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--text-2);
    cursor: pointer;
  }
  .sidebar-foot {
    display: none;
  }
  .mobile-menu-btn {
    display: grid;
  }
}
</style>
