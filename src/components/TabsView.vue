<template>
  <div class="tabs-view" v-if="tabsStore.tabs.length > 0">
    <div class="tabs-container">
      <div
        v-for="tab in tabsStore.tabs"
        :key="tab.path"
        :class="['tab-item', { active: tab.path === tabsStore.activeTab }]"
        @click="handleTabClick(tab)"
        @contextmenu.prevent="handleContextMenu($event, tab)"
      >
        <span class="tab-title">{{ tab.title }}</span>
        <el-icon
          v-if="tab.closable"
          class="tab-close"
          @click.stop="handleTabClose(tab)"
        >
          <Close />
        </el-icon>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      @click="closeContextMenu"
    >
      <div class="context-menu-item" @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
        <span>{{ labels.refresh }}</span>
      </div>
      <div
        v-if="contextMenuTab?.closable"
        class="context-menu-item"
        @click="handleClose"
      >
        <el-icon><Close /></el-icon>
        <span>{{ labels.close }}</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleCloseOthers">
        <el-icon><CircleClose /></el-icon>
        <span>{{ labels.closeOthers }}</span>
      </div>
      <div class="context-menu-item" @click="handleCloseLeft">
        <el-icon><DArrowLeft /></el-icon>
        <span>{{ labels.closeLeft }}</span>
      </div>
      <div class="context-menu-item" @click="handleCloseRight">
        <el-icon><DArrowRight /></el-icon>
        <span>{{ labels.closeRight }}</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleCloseAll">
        <el-icon><CloseBold /></el-icon>
        <span>{{ labels.closeAll }}</span>
      </div>
    </div>

    <!-- 点击遮罩层关闭右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu-mask"
      @click="closeContextMenu"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTabsStore, type TabItem } from '@/stores/tabsStore'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { Close, Refresh, CircleClose, DArrowLeft, DArrowRight, CloseBold } from '@element-plus/icons-vue'

const router = useRouter()
const tabsStore = useTabsStore()
const localeStore = useLocaleStore()

// 国际化标签
const labels = computed(() => {
  return localeStore.isEnglish
    ? {
        refresh: 'Refresh',
        close: 'Close',
        closeOthers: 'Close Others',
        closeLeft: 'Close Left',
        closeRight: 'Close Right',
        closeAll: 'Close All'
      }
    : {
        refresh: '刷新',
        close: '关闭',
        closeOthers: '关闭其他',
        closeLeft: '关闭左侧',
        closeRight: '关闭右侧',
        closeAll: '关闭所有'
      }
})

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuTab = ref<TabItem | null>(null)

// 点击Tab切换
const handleTabClick = (tab: TabItem) => {
  tabsStore.setActiveTab(tab.path)
  router.push(tab.path)
}

// 关闭Tab
const handleTabClose = (tab: TabItem) => {
  const targetPath = tabsStore.closeTab(tab.path)
  if (targetPath && targetPath !== tab.path) {
    router.push(targetPath)
  }
}

// 右键菜单
const handleContextMenu = (event: MouseEvent, tab: TabItem) => {
  contextMenuVisible.value = true
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuTab.value = tab
}

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false
  contextMenuTab.value = null
}

// 刷新当前Tab
const handleRefresh = () => {
  if (contextMenuTab.value) {
    router.push({
      path: contextMenuTab.value.path,
      query: { _t: Date.now() } // 强制刷新
    })
  }
}

// 关闭当前Tab
const handleClose = () => {
  if (contextMenuTab.value && contextMenuTab.value.closable) {
    const targetPath = tabsStore.closeTab(contextMenuTab.value.path)
    if (targetPath && targetPath !== contextMenuTab.value.path) {
      router.push(targetPath)
    }
  }
}

// 关闭其他Tab
const handleCloseOthers = () => {
  if (contextMenuTab.value) {
    tabsStore.closeOtherTabs(contextMenuTab.value.path)
    tabsStore.setActiveTab(contextMenuTab.value.path)
    router.push(contextMenuTab.value.path)
  }
}

// 关闭左侧Tab
const handleCloseLeft = () => {
  if (contextMenuTab.value) {
    tabsStore.closeLeftTabs(contextMenuTab.value.path)
  }
}

// 关闭右侧Tab
const handleCloseRight = () => {
  if (contextMenuTab.value) {
    tabsStore.closeRightTabs(contextMenuTab.value.path)
  }
}

// 关闭所有Tab
const handleCloseAll = () => {
  const targetPath = tabsStore.closeAllTabs()
  router.push(targetPath)
}

// 点击页面其他地方关闭右键菜单
const handleClickOutside = (event: MouseEvent) => {
  if (contextMenuVisible.value) {
    closeContextMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.tabs-view {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: relative;
}

.tabs-container {
  display: flex;
  align-items: center;
  padding: 0 12px;
  overflow-x: auto;
  overflow-y: hidden;
  height: 40px;
}

.tabs-container::-webkit-scrollbar {
  height: 0;
}

.tab-item {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 32px;
  margin: 4px 4px 4px 0;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 3px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-item:hover {
  background-color: #ecf5ff;
  border-color: #c6e2ff;
}

.tab-item.active {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

.tab-title {
  font-size: 13px;
  margin-right: 8px;
}

.tab-close {
  font-size: 12px;
  transition: all 0.2s;
  border-radius: 50%;
  padding: 2px;
}

.tab-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.tab-item.active .tab-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 右键菜单 */
.context-menu-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1999;
}

.context-menu {
  position: fixed;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  z-index: 2000;
  min-width: 150px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}

.context-menu-item:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.context-menu-item .el-icon {
  margin-right: 8px;
  font-size: 14px;
}

.context-menu-divider {
  height: 1px;
  background-color: #e4e7ed;
  margin: 4px 0;
}
</style>
