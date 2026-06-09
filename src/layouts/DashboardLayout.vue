<script setup lang="ts">
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronDown,
  CreditCard,
  FileText,
  HelpCircle,
  KeyRound,
  Layers,
  LayoutDashboard,
  Menu,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  Scale,
  Search,
  ShieldCheck,
  UserCircle,
  X,
} from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const sidebarCollapsed = ref(false)
const mobileDrawerOpen = ref(false)

const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/')

const menuGroups = [
  {
    label: '',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: '概览' },
      { path: '/dashboard/analytics', icon: BarChart3, label: '数据看板' },
    ],
  },
  {
    label: '接入管理',
    items: [
      { path: '/dashboard/channels', icon: Layers, label: '通道管理' },
      { path: '/dashboard/models', icon: Network, label: '模型管理' },
      { path: '/dashboard/routing', icon: Route, label: '路由策略' },
      { path: '/dashboard/load-balance', icon: Scale, label: '负载均衡' },
    ],
  },
  {
    label: '用量与成本',
    items: [
      { path: '/dashboard/usage', icon: Activity, label: '用量统计' },
      { path: '/dashboard/cost', icon: CreditCard, label: '成本分析' },
      { path: '/dashboard/billing', icon: FileText, label: '账单中心' },
    ],
  },
  {
    label: '安全与治理',
    items: [
      { path: '/dashboard/api-keys', icon: KeyRound, label: 'API Key 管理' },
      { path: '/dashboard/permissions', icon: ShieldCheck, label: '权限管理' },
      { path: '/dashboard/quota', icon: BarChart3, label: '配额管理' },
      { path: '/dashboard/audit', icon: AlertTriangle, label: '审计日志' },
    ],
  },
]

const closeMobile = () => {
  mobileDrawerOpen.value = false
}
</script>

<template>
  <div class="dashboard-shell">
    <!-- ====== Mobile overlay ====== -->
    <div v-if="mobileDrawerOpen" class="drawer-overlay" @click="closeMobile"></div>

    <!-- ====== Sidebar ====== -->
    <aside
      class="sidebar"
      :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileDrawerOpen }"
    >
      <div class="sidebar-head">
        <RouterLink class="sidebar-brand" to="/">
          <span class="brand-mark"><span>S</span></span>
          <span v-show="!sidebarCollapsed" class="brand-text">SeaSovereign <b>API</b></span>
        </RouterLink>
        <button
          class="collapse-btn"
          :aria-label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <PanelLeftOpen v-if="sidebarCollapsed" :size="18" />
          <PanelLeftClose v-else :size="18" />
        </button>
        <button class="mobile-close" aria-label="关闭菜单" @click="closeMobile">
          <X :size="20" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <template v-for="group in menuGroups" :key="group.label">
          <span v-if="group.label && !sidebarCollapsed" class="nav-group-label">{{ group.label }}</span>
          <RouterLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            :title="sidebarCollapsed ? item.label : undefined"
            @click="closeMobile"
          >
            <component :is="item.icon" :size="19" />
            <span v-show="!sidebarCollapsed">{{ item.label }}</span>
          </RouterLink>
        </template>
      </nav>

      <div v-show="!sidebarCollapsed" class="sidebar-footer">
        <div class="sidebar-plan">
          <span>企业版</span>
          <small>剩余 28 天</small>
        </div>
      </div>
    </aside>

    <!-- ====== Main area ====== -->
    <div class="main-area">
      <!-- ====== Topbar ====== -->
      <header class="topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" aria-label="打开菜单" @click="mobileDrawerOpen = true">
            <Menu :size="20" />
          </button>
          <div class="global-search">
            <Search :size="15" />
            <input type="text" placeholder="搜索模型、通道、API Key..." />
            <kbd>⌘K</kbd>
          </div>
        </div>

        <div class="topbar-right">
          <div class="project-selector">
            <span class="project-dot"></span>
            <select>
              <option>默认项目</option>
              <option>生产环境</option>
              <option>测试环境</option>
            </select>
          </div>

          <button class="icon-btn" aria-label="通知">
            <Bell :size="19" />
            <span class="badge">3</span>
          </button>
          <button class="icon-btn" aria-label="帮助">
            <HelpCircle :size="19" />
          </button>

          <div class="user-menu">
            <span class="avatar"><UserCircle :size="22" /></span>
            <span class="user-name">管理员</span>
            <ChevronDown :size="14" />
          </div>
        </div>
      </header>

      <!-- ====== Content ====== -->
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-shell {
  display: flex;
  height: 100dvh;
  overflow: hidden;
  background: var(--background);
}

/* ---------- Sidebar ---------- */
.sidebar {
  position: relative;
  z-index: 30;
  width: 248px;
  min-width: 248px;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--line);
  transition: width 200ms ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
  min-width: 64px;
}

.sidebar-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  min-height: 56px;
}

.sidebar-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #f5f9ff;
  text-decoration: none;
  font-size: 15px;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-brand b { font-weight: 500; color: #c7d7e9; }

.brand-mark {
  position: relative;
  width: 28px;
  height: 32px;
  display: grid;
  place-items: center;
  color: white;
  font-weight: 900;
  font-size: 13px;
  flex-shrink: 0;
  background: linear-gradient(140deg, #76c6ff, #116bf5 54%, #0035a8);
  clip-path: polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
  filter: drop-shadow(0 0 8px rgba(44, 141, 255, 0.55));
}

.collapse-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 160ms, background 160ms;
}

.collapse-btn:hover { color: var(--foreground); background: rgba(255,255,255,0.04); }

.collapsed .collapse-btn { margin-left: 0; }
.mobile-close { display: none; }

/* ---------- Sidebar nav ---------- */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-group-label {
  padding: 16px 14px 6px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 13px;
  border-radius: 7px;
  color: #a0b4cc;
  text-decoration: none;
  font-size: 14px;
  white-space: nowrap;
  transition: background 140ms, color 140ms;
}

.nav-item:hover { color: #e0ecff; background: rgba(255,255,255,0.03); }
.nav-item.active {
  color: #fff;
  background: rgba(22, 131, 255, 0.18);
  border-left: 3px solid var(--accent);
  padding-left: 10px;
}

.collapsed .nav-item { justify-content: center; padding: 10px; }
.collapsed .nav-item.active { border-left: none; border-radius: 7px; padding: 10px; }
.collapsed .nav-group-label { display: none; }

/* ---------- Sidebar footer ---------- */
.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--line);
}

.sidebar-plan {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(22, 131, 255, 0.08);
  border: 1px solid rgba(22, 131, 255, 0.2);
}

.sidebar-plan span { font-size: 13px; font-weight: 600; color: var(--accent-bright); }
.sidebar-plan small { font-size: 11px; color: var(--muted); }

/* ---------- Main area ---------- */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* ---------- Topbar ---------- */
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(6, 22, 41, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.global-search {
  display: flex;
  align-items: center;
  gap: 9px;
  max-width: 380px;
  width: 100%;
  height: 36px;
  padding: 0 13px;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  color: var(--foreground);
}

.global-search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--foreground);
  font-size: 13px;
}

.global-search input::placeholder { color: var(--muted); }
.global-search kbd {
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 4px;
  color: var(--muted);
  border: 1px solid var(--line);
  background: rgba(0,0,0,0.25);
  letter-spacing: 0.04em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.project-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--surface-2);
}

.project-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px rgba(56, 217, 154, 0.5);
}

.project-selector select {
  background: transparent;
  border: none;
  outline: none;
  color: var(--foreground);
  font-size: 13px;
  cursor: pointer;
}

.project-selector select option { background: var(--surface); color: var(--foreground); }

.icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: color 160ms, background 160ms;
}

.icon-btn:hover { color: var(--foreground); background: rgba(255,255,255,0.04); }

.badge {
  position: absolute;
  top: 4px;
  right: 6px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
  color: #fff;
  background: #e5484d;
  padding: 0 4px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 6px;
  border-radius: 7px;
  cursor: pointer;
  color: var(--foreground);
  font-size: 13px;
  transition: background 160ms;
}

.user-menu:hover { background: rgba(255,255,255,0.04); }
.user-menu .avatar { display: flex; color: var(--accent-bright); }

/* ---------- Content ---------- */
.content {
  flex: 1;
  overflow-y: auto;
}

/* ---------- Mobile drawer ---------- */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 28;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(2px);
}

/* ====== Responsive ====== */
@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 260px;
    min-width: 260px;
    transform: translateX(-100%);
    transition: transform 220ms ease;
    box-shadow: 8px 0 30px rgba(0,0,0,0.5);
  }

  .sidebar.mobile-open { transform: translateX(0); }
  .sidebar.collapsed { width: 260px; min-width: 260px; transform: translateX(-100%); }
  .mobile-close { display: flex; }
  .collapse-btn { display: none; }

  .sidebar.collapsed .brand-text { display: inline !important; }
  .sidebar.collapsed .nav-item { justify-content: flex-start; padding: 9px 13px; }
  .sidebar.collapsed .nav-item span { display: inline !important; }
  .sidebar.collapsed .nav-item.active { border-left: 3px solid var(--accent); padding-left: 10px; border-radius: 7px; }
  .sidebar.collapsed .sidebar-footer { display: block !important; }

  .mobile-menu-btn { display: flex; }
  .user-menu .user-name { display: none; }
  .topbar { padding: 0 16px; }
}
</style>
