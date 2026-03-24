import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

export interface TabItem {
  path: string
  name: string
  title: string
  closable: boolean
}

export const useTabsStore = defineStore('tabs', () => {
  // 状态
  const tabs = ref<TabItem[]>([])
  const activeTab = ref<string>('')

  // 固定的首页Tab（不可关闭）
  const homeTab: TabItem = {
    path: '/dashboard',
    name: 'dashboard',
    title: '仪表板',
    closable: false
  }

  // 初始化
  const init = () => {
    const deprecatedTabPrefixes = [
      '/system/settings',
      '/system/business-config',
      '/inventory/movements/create',
      '/product/parents'
    ]
    const isDeprecatedTabPath = (path: string) => deprecatedTabPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))

    // 尝试从localStorage恢复标签页
    const savedTabs = localStorage.getItem('erp-tabs')
    const savedActiveTab = localStorage.getItem('erp-active-tab')

    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs)
        tabs.value = Array.isArray(parsed)
          ? parsed.filter((tab) => !isDeprecatedTabPath(tab.path))
          : [homeTab]
      } catch {
        tabs.value = [homeTab]
      }
    } else {
      tabs.value = [homeTab]
    }

    // 确保首页Tab存在且不可关闭
    if (!tabs.value.find((t) => t.path === homeTab.path)) {
      tabs.value.unshift(homeTab)
    } else {
      const home = tabs.value.find((t) => t.path === homeTab.path)
      if (home) {
        home.closable = false
        home.title = getTitleByName(home.name)
      }
    }

    tabs.value = tabs.value.map((tab) => ({
      ...tab,
      title: getTitleByName(tab.name) || tab.title
    }))

    activeTab.value = isDeprecatedTabPath(savedActiveTab || '') ? homeTab.path : (savedActiveTab || homeTab.path)
  }

  // 持久化
  const persist = () => {
    localStorage.setItem('erp-tabs', JSON.stringify(tabs.value))
    localStorage.setItem('erp-active-tab', activeTab.value)
  }

  // 添加Tab
  const addTab = (route: RouteLocationNormalizedLoaded) => {
    // 忽略登录页
    if (route.path === '/login') return

    const path = route.path
    const name = route.name as string
    const title = getRouteTitle(route)

    // 检查是否已存在
    const existingTab = tabs.value.find((t) => t.path === path)
    if (existingTab) {
      activeTab.value = path
      persist()
      return
    }

    // 添加新Tab
    const newTab: TabItem = {
      path,
      name,
      title,
      closable: path !== homeTab.path
    }

    tabs.value.push(newTab)
    activeTab.value = path
    persist()
  }

  // 关闭Tab
  const closeTab = (targetPath: string) => {
    const index = tabs.value.findIndex((t) => t.path === targetPath)
    if (index === -1) return

    const tab = tabs.value[index]
    if (!tab.closable) return

    tabs.value.splice(index, 1)

    // 如果关闭的是当前激活的Tab，需要激活其他Tab
    if (activeTab.value === targetPath) {
      // 优先激活右侧Tab，否则激活左侧
      const nextTab = tabs.value[index] || tabs.value[index - 1]
      activeTab.value = nextTab ? nextTab.path : homeTab.path
    }

    persist()
    return activeTab.value
  }

  // 关闭其他Tab
  const closeOtherTabs = (targetPath: string) => {
    tabs.value = tabs.value.filter((t) => !t.closable || t.path === targetPath)
    activeTab.value = targetPath
    persist()
  }

  // 关闭所有Tab（除了固定的）
  const closeAllTabs = () => {
    tabs.value = tabs.value.filter((t) => !t.closable)
    activeTab.value = homeTab.path
    persist()
    return homeTab.path
  }

  // 关闭左侧Tab
  const closeLeftTabs = (targetPath: string) => {
    const index = tabs.value.findIndex((t) => t.path === targetPath)
    if (index === -1) return

    tabs.value = tabs.value.filter((t, i) => !t.closable || i >= index)
    persist()
  }

  // 关闭右侧Tab
  const closeRightTabs = (targetPath: string) => {
    const index = tabs.value.findIndex((t) => t.path === targetPath)
    if (index === -1) return

    tabs.value = tabs.value.filter((t, i) => !t.closable || i <= index)
    persist()
  }

  // 设置激活Tab
  const setActiveTab = (path: string) => {
    activeTab.value = path
    persist()
  }

  // 清空所有Tab（用于退出登录）
  const clearTabs = () => {
    tabs.value = []
    activeTab.value = ''
    localStorage.removeItem('erp-tabs')
    localStorage.removeItem('erp-active-tab')
  }

  // 获取路由标题（根据路由配置）
  const getRouteTitle = (route: RouteLocationNormalizedLoaded): string => {
    // 优先使用meta中的title
    if (route.meta?.title) {
      return route.meta.title as string
    }

    // 根据路由name生成标题
    const name = route.name as string
    return getTitleByName(name)
  }

  const getTitleByName = (name?: string): string => {
    if (!name) return '未命名'

    const titleMap: Record<string, { zh: string; en: string }> = {
      dashboard: { zh: '仪表板', en: 'Dashboard' },
      'system-users': { zh: '用户管理', en: 'User Management' },
      'integration-authorizations': { zh: '平台授权', en: 'Platform Authorizations' },
      'system-audit-logs': { zh: '操作日志', en: 'Audit Logs' },
      'system-config-center': { zh: '配置中心', en: 'Config Center' },
      'system-monitor': { zh: '系统监控', en: 'System Monitor' },
      'system-field-labels': { zh: '字段标签', en: 'Field Labels' },
      'system-menus': { zh: '菜单管理', en: 'Menu Management' },
      'product-skus': { zh: '产品列表', en: 'Product List' },
      'product-config': { zh: '产品配置', en: 'Product Config' },
      'product-images': { zh: '产品图片', en: 'Product Images' },
      'product-groups': { zh: '产品归组', en: 'Product Grouping' },
      'product-groups-detail': { zh: '归组详情', en: 'Grouping Detail' },
      'product-combos': { zh: '组合产品', en: 'Product Combos' },
      'supplier-suppliers': { zh: '供应商列表', en: 'Supplier List' },
      'supplier-product-quotes': { zh: '产品报价', en: 'Product Quotes' },
      'inventory-warehouses': { zh: '仓库管理', en: 'Warehouse Management' },
      'inventory-balances': { zh: '库存余额', en: 'Inventory Balances' },
      'inventory-lots': { zh: '库存批次', en: 'Inventory Lots' },
      'inventory-movements': { zh: '库存流水', en: 'Inventory Movements' },
      'inventory-adjustments': { zh: '调整库存', en: 'Adjust Inventory' },
      'procurement-purchase-orders': { zh: '采购单', en: 'Purchase Orders' },
      'procurement-replenishment-strategies': { zh: '采购策略', en: 'Replenishment Strategies' },
      'procurement-replenishment-plans': { zh: '采购计划', en: 'Replenishment Plans' },
      'procurement-purchase-orders-create': { zh: '创建采购单', en: 'Create Purchase Order' },
      'procurement-purchase-orders-edit': { zh: '编辑采购单', en: 'Edit Purchase Order' },
      'procurement-purchase-orders-detail': { zh: '采购单详情', en: 'Purchase Order Detail' },
      'procurement-assembly': { zh: '打包管理', en: 'Assembly Management' },
      'sales-orders': { zh: '销售订单', en: 'Sales Orders' },
      'sales-order-import': { zh: '导入记录', en: 'Import History' },
      'sales-order-detail': { zh: '销售订单详情', en: 'Sales Order Detail' },
      'shipping-shipments': { zh: '发货管理', en: 'Shipment Management' },
      'shipping-shipments-create': { zh: '创建货件', en: 'Create Shipment' },
      'shipping-shipments-detail': { zh: '货件详情', en: 'Shipment Detail' },
      'shipping-package-specs': { zh: '装箱规格', en: 'Package Specs' },
      'logistics-providers': { zh: '物流商管理', en: 'Logistics Providers' },
      'logistics-services': { zh: '物流服务', en: 'Logistics Services' },
      'logistics-shipping-rates': { zh: '物流报价', en: 'Shipping Rates' },
      'finance-cash-ledger': { zh: '现金流水', en: 'Cash Ledger' },
      'finance-cash-ledger-audit': { zh: '现金流水操作日志', en: 'Cash Ledger Audit' },
      'finance-costing': { zh: '成本中心', en: 'Cost Center' },
      'finance-costing-snapshots': { zh: '成本快照历史', en: 'Cost Snapshot History' },
      'finance-profit': { zh: '财务总览', en: 'Finance Overview' },
      'finance-order-profit': { zh: '订单利润', en: 'Order Profit' },
      'finance-product-cost': { zh: '成本中心', en: 'Cost Center' },
      'finance-exchange-rates': { zh: '汇率管理', en: 'Exchange Rates' },
      'packaging-items': { zh: '包材管理', en: 'Packaging Items' },
      'packaging-ledger': { zh: '包材流水', en: 'Packaging Ledger' },
      'packaging-procurement-plans': { zh: '包材采购计划', en: 'Packaging Procurement Plans' },
      'packaging-procurement-orders': { zh: '包材采购单', en: 'Packaging Purchase Orders' }
    }

    const locale = localStorage.getItem('locale') || 'zh-CN'
    const isEnglish = locale === 'en-US'

    return titleMap[name]?.[isEnglish ? 'en' : 'zh'] || name
  }

  // 计算属性
  const tabCount = computed(() => tabs.value.length)

  return {
    tabs,
    activeTab,
    tabCount,
    init,
    addTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    closeLeftTabs,
    closeRightTabs,
    setActiveTab,
    clearTabs
  }
})
