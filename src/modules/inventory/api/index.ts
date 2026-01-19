import request from '@/utils/request'
import type {
  Warehouse,
  InventoryBalance,
  InventoryMovement,
  WarehouseListParams,
  BalanceListParams,
  MovementListParams,
  CreateWarehouseParams,
  CreateMovementParams,
  CreateTransferParams
} from '../types'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'

// ============================================
// Warehouse APIs
// ============================================

export function getWarehouseList(params: WarehouseListParams) {
  return request<ApiResponse<PaginatedResponse<Warehouse>>>({
    url: '/api/inventory/warehouses',
    method: 'get',
    params
  })
}

export function getWarehouseDetail(id: number) {
  return request<ApiResponse<Warehouse>>({
    url: `/api/inventory/warehouses/${id}`,
    method: 'get'
  })
}

export function createWarehouse(data: CreateWarehouseParams) {
  return request<ApiResponse<Warehouse>>({
    url: '/api/inventory/warehouses',
    method: 'post',
    data
  })
}

export function updateWarehouse(id: number, data: Partial<CreateWarehouseParams>) {
  return request<ApiResponse<Warehouse>>({
    url: `/api/inventory/warehouses/${id}`,
    method: 'put',
    data
  })
}

export function deleteWarehouse(id: number) {
  return request<ApiResponse<{ message: string }>>({
    url: `/api/inventory/warehouses/${id}`,
    method: 'delete'
  })
}

export function getActiveWarehouses() {
  return request<ApiResponse<Warehouse[]>>({
    url: '/api/inventory/warehouses/active',
    method: 'get'
  })
}

// ============================================
// Balance APIs
// ============================================

export function getBalanceList(params: BalanceListParams) {
  return request<ApiResponse<PaginatedResponse<InventoryBalance>>>({
    url: '/api/inventory/balances',
    method: 'get',
    params
  })
}

export function getBalanceDetail(id: number) {
  return request<ApiResponse<InventoryBalance>>({
    url: `/api/inventory/balances/${id}`,
    method: 'get'
  })
}

export function getSkuBalances(skuId: number) {
  return request<ApiResponse<InventoryBalance[]>>({
    url: `/api/inventory/balances/sku/${skuId}`,
    method: 'get'
  })
}

export function getWarehouseSummary(warehouseId: number) {
  return request<ApiResponse<any>>({
    url: `/api/inventory/balances/warehouse/${warehouseId}/summary`,
    method: 'get'
  })
}

// ============================================
// Movement APIs
// ============================================

export function getMovementList(params: MovementListParams) {
  return request<ApiResponse<PaginatedResponse<InventoryMovement>>>({
    url: '/api/inventory/movements',
    method: 'get',
    params
  })
}

export function getMovementDetail(id: number) {
  return request<ApiResponse<InventoryMovement>>({
    url: `/api/inventory/movements/${id}`,
    method: 'get'
  })
}

export function recordPurchaseReceipt(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/inventory/movements/purchase-receipt',
    method: 'post',
    data
  })
}

export function recordSalesShipment(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/inventory/movements/sales-shipment',
    method: 'post',
    data
  })
}

export function recordStockTake(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/inventory/movements/stock-take',
    method: 'post',
    data
  })
}

export function recordManualAdjustment(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/inventory/movements/manual-adjustment',
    method: 'post',
    data
  })
}

export function recordDamageWriteOff(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/inventory/movements/damage-write-off',
    method: 'post',
    data
  })
}

export function recordReturnReceipt(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/inventory/movements/return-receipt',
    method: 'post',
    data
  })
}

export function recordTransfer(data: CreateTransferParams) {
  return request<ApiResponse<any>>({
    url: '/api/inventory/movements/transfer',
    method: 'post',
    data
  })
}
