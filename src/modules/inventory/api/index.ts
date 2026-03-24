import request from '@/utils/request'
import type {
  Warehouse,
  InventoryBalance,
  InventoryLot,
  InventoryMovement,
  WarehouseListParams,
  BalanceListParams,
  InventoryLotListParams,
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
    url: '/api/v1/inventory/warehouses',
    method: 'get',
    params
  })
}

export function getWarehouseDetail(id: number) {
  return request<ApiResponse<Warehouse>>({
    url: `/api/v1/inventory/warehouses/${id}`,
    method: 'get'
  })
}

export function createWarehouse(data: CreateWarehouseParams) {
  return request<ApiResponse<Warehouse>>({
    url: '/api/v1/inventory/warehouses',
    method: 'post',
    data
  })
}

export function updateWarehouse(id: number, data: Partial<CreateWarehouseParams>) {
  return request<ApiResponse<Warehouse>>({
    url: `/api/v1/inventory/warehouses/${id}`,
    method: 'put',
    data
  })
}

export function deleteWarehouse(id: number) {
  return request<ApiResponse<{ message: string }>>({
    url: `/api/v1/inventory/warehouses/${id}`,
    method: 'delete'
  })
}

export function getActiveWarehouses() {
  return request<ApiResponse<Warehouse[]>>({
    url: '/api/v1/inventory/warehouses/active',
    method: 'get'
  })
}

// ============================================
// Balance APIs
// ============================================

export function getBalanceList(params: BalanceListParams) {
  return request<ApiResponse<PaginatedResponse<InventoryBalance>>>({
    url: '/api/v1/inventory/balances',
    method: 'get',
    params
  })
}

export function getInventoryLotList(params: InventoryLotListParams) {
  return request<ApiResponse<PaginatedResponse<InventoryLot>>>({
    url: '/api/v1/inventory/lots',
    method: 'get',
    params
  })
}

export function getProductBalances(productId: number) {
  return request<ApiResponse<PaginatedResponse<InventoryBalance>>>({
    url: `/api/v1/inventory/balances`,
    method: 'get',
    params: {
      product_id: productId,
      page: 1,
      page_size: 100
    }
  })
}

// ============================================
// Movement APIs
// ============================================

export function getMovementList(params: MovementListParams) {
  return request<ApiResponse<PaginatedResponse<InventoryMovement>>>({
    url: '/api/v1/inventory/movements',
    method: 'get',
    params
  })
}

export function getMovementDetail(id: number) {
  return request<ApiResponse<InventoryMovement>>({
    url: `/api/v1/inventory/movements/${id}`,
    method: 'get'
  })
}

export function recordStockTake(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/stock-take',
    method: 'post',
    data
  })
}

export function recordManualAdjustment(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/manual-adjustment',
    method: 'post',
    data
  })
}

export function recordDamageWriteOff(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/damage-write-off',
    method: 'post',
    data
  })
}

export function recordTransfer(data: CreateTransferParams) {
  return request<ApiResponse<any>>({
    url: '/api/v1/inventory/movements/transfer',
    method: 'post',
    data
  })
}

// ============================================
// 库存状态流转 APIs
// ============================================

// 组装完成: 原料库存 → 待出库存
export function recordAssemblyComplete(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/assembly-complete',
    method: 'post',
    data
  })
}

