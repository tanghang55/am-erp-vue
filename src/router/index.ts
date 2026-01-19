import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/modules/identity/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/identity/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/Dashboard.vue')
        },
        {
          path: 'system/users',
          name: 'system-users',
          component: () => import('@/modules/identity/views/UserList.vue')
        },
        {
          path: 'system/audit-logs',
          name: 'system-audit-logs',
          component: () => import('@/modules/identity/views/AuditLogList.vue')
        },
        {
          path: 'system/settings',
          name: 'system-settings',
          component: () => import('@/modules/system/views/SystemSettings.vue')
        },
        {
          path: 'system/field-labels',
          name: 'system-field-labels',
          component: () => import('@/modules/system/views/FieldLabelList.vue')
        },
        {
          path: 'product/list',
          name: 'product-skus',
          component: () => import('@/modules/product/views/ProductList.vue')
        },
        {
          path: 'product/suppliers',
          name: 'product-suppliers',
          component: () => import('@/modules/product/views/SupplierList.vue')
        },
        {
          path: 'product/parents',
          name: 'product-parents',
          component: () => import('@/modules/product/views/ProductParentList.vue')
        },
        {
          path: 'product/combos',
          name: 'product-combos',
          component: () => import('@/modules/product/views/ProductComboList.vue')
        },
        // Inventory Module Routes
        {
          path: 'inventory/warehouses',
          name: 'inventory-warehouses',
          component: () => import('@/modules/inventory/views/WarehouseList.vue')
        },
        {
          path: 'inventory/balances',
          name: 'inventory-balances',
          component: () => import('@/modules/inventory/views/InventoryList.vue')
        },
        {
          path: 'inventory/movements',
          name: 'inventory-movements',
          component: () => import('@/modules/inventory/views/MovementList.vue')
        },
        {
          path: 'inventory/movements/create',
          name: 'inventory-movements-create',
          component: () => import('@/modules/inventory/views/MovementCreate.vue')
        },
        // Procurement Module Routes
        {
          path: 'procurement/purchase-orders',
          name: 'procurement-purchase-orders',
          component: () => import('@/modules/procurement/views/PurchaseOrderList.vue')
        },
        // Shipping Module Routes
        {
          path: 'shipping/shipments',
          name: 'shipping-shipments',
          component: () => import('@/modules/shipping/views/ShipmentList.vue')
        },
        // Finance Module Routes
        {
          path: 'finance/cash-ledger',
          name: 'finance-cash-ledger',
          component: () => import('@/modules/finance/views/CashLedgerList.vue')
        },
        {
          path: 'finance/costing',
          name: 'finance-costing',
          component: () => import('@/modules/finance/views/CostingSnapshotList.vue')
        },
        // Packaging Module Routes
        {
          path: 'packaging/items',
          name: 'packaging-items',
          component: () => import('@/modules/packaging/views/PackagingItemList.vue')
        },
        {
          path: 'packaging/ledger',
          name: 'packaging-ledger',
          component: () => import('@/modules/packaging/views/PackagingLedgerList.vue')
        }
        // 后续可以添加更多路由
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 需要认证的路由
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isLoggedIn) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }

  // 已登录用户访问登录页，跳转到首页
  if (to.name === 'login' && authStore.isLoggedIn) {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export default router
