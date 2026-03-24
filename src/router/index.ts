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
          path: 'integrations/authorizations',
          name: 'integration-authorizations',
          component: () => import('@/modules/identity/views/IntegrationAuthorizationList.vue')
        },
        {
          path: 'system/audit-logs',
          name: 'system-audit-logs',
          component: () => import('@/modules/system/views/AuditLogList.vue')
        },
        {
          path: 'system/monitor',
          name: 'system-monitor',
          component: () => import('@/modules/system/views/SystemMonitor.vue')
        },
        {
          path: 'system/config-center',
          name: 'system-config-center',
          component: () => import('@/modules/system/views/ConfigCenter.vue')
        },
        {
          path: 'system/field-labels',
          name: 'system-field-labels',
          component: () => import('@/modules/system/views/FieldLabelList.vue')
        },
        {
          path: 'system/menus',
          name: 'system-menus',
          component: () => import('@/modules/system/views/MenuList.vue')
        },
        {
          path: 'product/list',
          name: 'product-skus',
          component: () => import('@/modules/product/views/ProductList.vue')
        },
        {
          path: 'product/config',
          name: 'product-config',
          component: () => import('@/modules/product/views/ProductConfigList.vue')
        },
        {
          path: 'product/images/:id',
          name: 'product-images',
          component: () => import('@/modules/product/views/ProductImageManager.vue')
        },
        {
          path: 'product/groups',
          name: 'product-groups',
          component: () => import('@/modules/product/views/ProductGroupList.vue')
        },
        {
          path: 'product/groups/:id',
          name: 'product-groups-detail',
          component: () => import('@/modules/product/views/ProductGroupDetail.vue')
        },
        {
          path: 'product/combos',
          name: 'product-combos',
          component: () => import('@/modules/product/views/ProductComboList.vue')
        },
        {
          path: 'supplier/suppliers',
          name: 'supplier-suppliers',
          component: () => import('@/modules/supplier/views/SupplierList.vue')
        },
        {
          path: 'supplier/product-quotes',
          name: 'supplier-product-quotes',
          component: () => import('@/modules/supplier/views/SupplierProductQuoteList.vue')
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
          path: 'inventory/lots',
          name: 'inventory-lots',
          component: () => import('@/modules/inventory/views/InventoryLotList.vue')
        },
        {
          path: 'inventory/movements',
          name: 'inventory-movements',
          component: () => import('@/modules/inventory/views/InventoryMovementLogList.vue')
        },
        {
          path: 'inventory/adjustments',
          name: 'inventory-adjustments',
          component: () => import('@/modules/inventory/views/InventoryAdjustment.vue')
        },
        // Procurement Module Routes
        {
          path: 'procurement/purchase-orders',
          name: 'procurement-purchase-orders',
          component: () => import('@/modules/procurement/views/PurchaseOrderList.vue')
        },
        {
          path: 'procurement/replenishment',
          redirect: '/procurement/replenishment/plans'
        },
        {
          path: 'procurement/replenishment/strategies',
          name: 'procurement-replenishment-strategies',
          component: () => import('@/modules/procurement/views/ReplenishmentStrategyList.vue')
        },
        {
          path: 'procurement/replenishment/plans',
          name: 'procurement-replenishment-plans',
          component: () => import('@/modules/procurement/views/ReplenishmentPlanList.vue')
        },
        {
          path: 'procurement/purchase-orders/create',
          name: 'procurement-purchase-orders-create',
          component: () => import('@/modules/procurement/views/PurchaseOrderCreate.vue')
        },
        {
          path: 'procurement/purchase-orders/:id/edit',
          name: 'procurement-purchase-orders-edit',
          component: () => import('@/modules/procurement/views/PurchaseOrderEdit.vue')
        },
        {
          path: 'procurement/purchase-orders/:id',
          name: 'procurement-purchase-orders-detail',
          component: () => import('@/modules/procurement/views/PurchaseOrderDetail.vue')
        },
        {
          path: 'procurement/assembly',
          name: 'procurement-assembly',
          component: () => import('@/modules/procurement/views/AssemblyManagement.vue')
        },
        // Sales Module Routes
        {
          path: 'sales/orders',
          name: 'sales-orders',
          component: () => import('@/modules/sales/views/SalesOrderList.vue')
        },
        {
          path: 'sales/orders/import',
          name: 'sales-order-import',
          component: () => import('@/modules/sales/views/SalesOrderImport.vue')
        },
        {
          path: 'sales/orders/:id',
          name: 'sales-order-detail',
          component: () => import('@/modules/sales/views/SalesOrderDetail.vue')
        },
        // Shipping Module Routes
        {
          path: 'shipping/shipments',
          name: 'shipping-shipments',
          component: () => import('@/modules/shipping/views/ShipmentList.vue')
        },
        {
          path: 'shipping/shipments/create',
          name: 'shipping-shipments-create',
          component: () => import('@/modules/shipping/views/ShipmentCreate.vue')
        },
        {
          path: 'shipping/shipments/:id/edit',
          name: 'shipping-shipments-edit',
          component: () => import('@/modules/shipping/views/ShipmentCreate.vue')
        },
        {
          path: 'shipping/shipments/:id',
          name: 'shipping-shipments-detail',
          component: () => import('@/modules/shipping/views/ShipmentDetail.vue')
        },
        {
          path: 'shipping/package-specs',
          name: 'shipping-package-specs',
          component: () => import('@/modules/shipping/views/PackageSpecList.vue')
        },
        // Logistics Module Routes
        {
          path: 'logistics/providers',
          name: 'logistics-providers',
          component: () => import('@/modules/logistics/views/ProviderList.vue')
        },
        {
          path: 'logistics/services',
          name: 'logistics-services',
          component: () => import('@/modules/logistics/views/LogisticsServiceList.vue')
        },
        {
          path: 'logistics/shipping-rates',
          name: 'logistics-shipping-rates',
          component: () => import('@/modules/logistics/views/ShippingRateList.vue')
        },
        // Finance Module Routes
        {
          path: 'finance/cash-ledger',
          name: 'finance-cash-ledger',
          component: () => import('@/modules/finance/views/CashLedgerList.vue')
        },
        {
          path: 'finance/cash-ledger/audit',
          name: 'finance-cash-ledger-audit',
          component: () => import('@/modules/finance/views/CashLedgerAuditList.vue')
        },
        {
          path: 'finance/costing',
          name: 'finance-costing',
          component: () => import('@/modules/finance/views/ProductCostLedger.vue')
        },
        {
          path: 'finance/costing/snapshots',
          name: 'finance-costing-snapshots',
          component: () => import('@/modules/finance/views/CostingSnapshotHistory.vue')
        },
        {
          path: 'finance/profit',
          name: 'finance-profit',
          component: () => import('@/modules/finance/views/ProfitDashboard.vue')
        },
        {
          path: 'finance/order-profit',
          name: 'finance-order-profit',
          component: () => import('@/modules/finance/views/OrderProfitList.vue')
        },
        {
          path: 'finance/product-cost',
          name: 'finance-product-cost',
          redirect: { name: 'finance-costing' }
        },
        {
          path: 'finance/exchange-rates',
          name: 'finance-exchange-rates',
          component: () => import('@/modules/finance/views/ExchangeRateList.vue')
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
        },
        {
          path: 'packaging/procurement-plans',
          name: 'packaging-procurement-plans',
          component: () => import('@/modules/packaging/views/PackagingProcurementPlanList.vue')
        },
        {
          path: 'packaging/procurement-orders',
          name: 'packaging-procurement-orders',
          component: () => import('@/modules/packaging/views/PackagingPurchaseOrderList.vue')
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
