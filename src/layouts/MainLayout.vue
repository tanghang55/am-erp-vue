<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-text">Amazon ERP</span>
        </div>

        <!-- 顶部菜单 -->
        <div
          class="menu-shell"
          :class="{
            'show-left-fade': showLeftFade,
            'show-right-fade': showRightFade
          }"
        >
          <div ref="menuScrollRef" class="menu-scroll" @scroll.passive="updateMenuFade">
            <el-menu
              v-if="!menuStore.loading"
              :default-active="activeMenu"
              mode="horizontal"
              :ellipsis="false"
              router
              class="top-menu"
            >
              <template v-for="menu in menuStore.menus" :key="menu.id">
                <!-- 无子菜单的顶级菜单 -->
                <el-menu-item v-if="!menu.children || menu.children.length === 0" :index="menu.path || ''">
                  <el-icon v-if="menu.icon">
                    <component :is="getIcon(menu.icon)" />
                  </el-icon>
                  <span class="menu-title">{{ getMenuTitle(menu) }}</span>
                </el-menu-item>

                <!-- 有子菜单的顶级菜单 -->
                <el-sub-menu v-else :index="menu.code">
                  <template #title>
                    <el-icon v-if="menu.icon">
                      <component :is="getIcon(menu.icon)" />
                    </el-icon>
                    <span class="menu-title">{{ getMenuTitle(menu) }}</span>
                  </template>
                  <el-menu-item
                    v-for="child in menu.children"
                    :key="child.id"
                    :index="child.path || ''"
                  >
                    {{ getMenuTitle(child) }}
                  </el-menu-item>
                </el-sub-menu>
              </template>
            </el-menu>
          </div>
          <div class="menu-fade menu-fade-left"></div>
          <div class="menu-fade menu-fade-right"></div>
        </div>
      </div>

      <div class="header-right">
        <el-select
          v-model="localeStore.locale"
          class="locale-select"
          size="small"
          @change="localeStore.setLocale"
        >
          <el-option label="中文" value="zh-CN" />
          <el-option label="English" value="en-US" />
        </el-select>
        <el-dropdown>
          <span class="user-dropdown">
            <el-icon><User /></el-icon>
            <span class="username">{{ authStore.user?.real_name || authStore.user?.username }}</span>
            <el-icon class="arrow"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                <div class="user-info">
                  <div><strong>{{ authStore.user?.username }}</strong></div>
                  <div class="user-roles">{{ roleNames }}</div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                Logout
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <!-- 多标签页 -->
    <tabs-view />

    <!-- 主内容区 -->
    <el-main class="main-content">
      <router-view v-slot="{ Component, route }">
        <transition v-if="route.meta.keepAlive !== false" name="fade-transform" mode="out-in">
          <keep-alive>
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </transition>
        <transition v-else name="fade-transform" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref, nextTick, onBeforeUnmount, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/modules/identity/stores/authStore'
import { useMenuStore } from '@/modules/identity/stores/menuStore'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { useTabsStore } from '@/stores/tabsStore'
import TabsView from '@/components/TabsView.vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const menuStore = useMenuStore()
const localeStore = useLocaleStore()
const tabsStore = useTabsStore()
const menuScrollRef = ref<HTMLElement | null>(null)
const showLeftFade = ref(false)
const showRightFade = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 角色名称
const roleNames = computed(() => {
  return authStore.roles.map((role) => role.display_name).join(', ')
})

// 获取图标组件
const iconMap = ElementPlusIconsVue as Record<string, Component>
const getIcon = (iconName: string) => iconMap[iconName]

const getMenuTitle = (menu: { title?: string; title_en?: string | null }) => {
  if (localeStore.isEnglish) {
    return menu.title_en || menu.title || ''
  }
  return menu.title || menu.title_en || ''
}

const updateMenuFade = () => {
  const el = menuScrollRef.value
  if (!el) {
    showLeftFade.value = false
    showRightFade.value = false
    return
  }

  const maxScroll = el.scrollWidth - el.clientWidth
  if (maxScroll <= 2) {
    showLeftFade.value = false
    showRightFade.value = false
    return
  }

  showLeftFade.value = el.scrollLeft > 2
  showRightFade.value = el.scrollLeft < maxScroll - 2
}

// 退出登录
const handleLogout = async () => {
  await authStore.logout()
  menuStore.clearMenus()
  tabsStore.clearTabs()
  router.push('/login')
}

// 加载菜单
onMounted(async () => {
  await menuStore.loadMenus()
  await nextTick()
  updateMenuFade()
  window.addEventListener('resize', updateMenuFade)
  // 初始化标签页
  tabsStore.init()
  // 添加当前路由到标签页
  if (route.path !== '/login') {
    tabsStore.addTab(route)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMenuFade)
})

// 监听路由变化，自动添加标签页
watch(
  () => route.path,
  async () => {
    if (route.path !== '/login') {
      tabsStore.addTab(route)
    }
    await nextTick()
    updateMenuFade()
  }
)

watch(
  () => menuStore.menus.length,
  async () => {
    await nextTick()
    updateMenuFade()
  }
)

watch(
  () => localeStore.locale,
  async () => {
    await nextTick()
    updateMenuFade()
  }
)
</script>

<style scoped>
.layout-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

/* 顶部导航栏 */
.header {
  height: 56px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  height: 100%;
  flex: 1;
  min-width: 0;
}

.logo {
  height: 100%;
  padding: 0 16px;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-width: 150px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.4px;
}

.menu-shell {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
}

.menu-scroll {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.menu-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 18px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 3;
}

.menu-fade-left {
  left: 0;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0));
}

.menu-fade-right {
  right: 0;
  background: linear-gradient(to left, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0));
}

.menu-shell.show-left-fade .menu-fade-left {
  opacity: 1;
}

.menu-shell.show-right-fade .menu-fade-right {
  opacity: 1;
}

.top-menu {
  border-bottom: none;
  height: 100%;
  min-width: max-content;
}

.top-menu :deep(.el-menu-item),
.top-menu :deep(.el-sub-menu__title) {
  height: 56px;
  line-height: 56px;
  padding: 0 12px;
  font-size: 13px;
}

.top-menu :deep(.el-sub-menu__title) {
  display: flex;
  align-items: center;
  gap: 6px;
}

.top-menu :deep(.el-sub-menu__icon-arrow) {
  position: static;
  margin: 0 0 0 4px;
}

.menu-title {
  white-space: nowrap;
}

.top-menu .el-menu-item,
.top-menu .el-sub-menu {
  height: 56px;
  line-height: 56px;
}

.header-right {
  height: 100%;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  border-left: 1px solid #f3f4f6;
}

.locale-select {
  width: 96px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #333;
  font-size: 13px;
  transition: color 0.3s;
}

.user-dropdown:hover {
  color: #409eff;
}

.username {
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  font-size: 12px;
}

.user-info {
  padding: 5px 0;
  min-width: 150px;
}

.user-roles {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 主内容区 */
.main-content {
  width: 100%;
  background-color: #f0f2f5;
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  min-height: calc(100vh - 100px);
}

/* 页面切换动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.2s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* 响应式 */
@media (max-width: 768px) {
  .logo {
    min-width: 118px;
    padding: 0 10px;
  }

  .logo-text {
    font-size: 14px;
  }

  .menu-scroll {
    overflow-x: auto;
  }

  .top-menu :deep(.el-icon) {
    display: none;
  }

  .username {
    display: none;
  }

  .locale-select {
    width: 82px;
  }
}
</style>
