<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-text">Amazon ERP</span>
        </div>

        <!-- 顶部菜单 -->
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
              <span>{{ getMenuTitle(menu) }}</span>
            </el-menu-item>

            <!-- 有子菜单的顶级菜单 -->
            <el-sub-menu v-else :index="menu.code">
              <template #title>
                <el-icon v-if="menu.icon">
                  <component :is="getIcon(menu.icon)" />
                </el-icon>
                <span>{{ getMenuTitle(menu) }}</span>
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

    <!-- 主内容区 -->
    <el-main class="main-content">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/modules/identity/stores/authStore'
import { useMenuStore } from '@/modules/identity/stores/menuStore'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const menuStore = useMenuStore()
const localeStore = useLocaleStore()

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 角色名称
const roleNames = computed(() => {
  return authStore.roles.map((role) => role.display_name).join(', ')
})

// 获取图标组件
const getIcon = (iconName: string) => {
  return (ElementPlusIconsVue as any)[iconName]
}

const getMenuTitle = (menu: { title?: string; title_en?: string | null }) => {
  if (localeStore.isEnglish) {
    return menu.title_en || menu.title || ''
  }
  return menu.title || menu.title_en || ''
}

// 退出登录
const handleLogout = async () => {
  await authStore.logout()
  menuStore.clearMenus()
  router.push('/login')
}

// 加载菜单
onMounted(async () => {
  await menuStore.loadMenus()
})
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
  height: 60px;
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
}

.logo {
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-width: 200px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 1px;
}

.top-menu {
  border-bottom: none;
  flex: 1;
  height: 100%;
}

.top-menu .el-menu-item,
.top-menu .el-sub-menu {
  height: 60px;
  line-height: 60px;
}

.header-right {
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.locale-select {
  width: 110px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  transition: color 0.3s;
}

.user-dropdown:hover {
  color: #409eff;
}

.username {
  max-width: 120px;
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
  min-height: calc(100vh - 60px);
}

/* 响应式 */
@media (max-width: 768px) {
  .logo-text {
    font-size: 16px;
  }

  .header-left {
    flex-wrap: wrap;
  }

  .username {
    display: none;
  }
}
</style>

<style>
/* 全局样式修正 */
.el-sub-menu__title {
  display: flex;
  align-items: center;
}

.el-menu--horizontal > .el-sub-menu .el-sub-menu__title {
  height: 60px;
  line-height: 60px;
}
</style>
