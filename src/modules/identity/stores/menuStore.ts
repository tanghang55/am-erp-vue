import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getMenuList as getUserMenus } from '../api/system'
import type { MenuItem } from '../types'

export const useMenuStore = defineStore('menu', () => {
  const menus = ref<MenuItem[]>([])
  const loading = ref(false)

  // 加载菜单
  const loadMenus = async () => {
    if (menus.value.length > 0) {
      return // 已加载，不重复加载
    }

    loading.value = true
    try {
      const res = await getUserMenus()
      if (res.success) {
        menus.value = res.data
      }
    } catch (error) {
      console.error('Failed to load menus:', error)
    } finally {
      loading.value = false
    }
  }

  // 清空菜单（登出时使用）
  const clearMenus = () => {
    menus.value = []
  }

  return {
    menus,
    loading,
    loadMenus,
    clearMenus
  }
})
