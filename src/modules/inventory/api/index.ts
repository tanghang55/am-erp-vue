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

export function getBalanceDetail(id: number) {
  return request<ApiResponse<InventoryBalance>>({
    url: `/api/inventory/balances/${id}`,
    method: 'get'
  })
}

export function getSkuBalances(skuId: number) {
  return request<ApiResponse<PaginatedResponse<InventoryBalance>>>({
    url: `/api/v1/inventory/balances`,
    method: 'get',
    params: {
      sku_id: skuId,
      page: 1,
      page_size: 100
    }
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

export function recordPurchaseReceipt(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/purchase-receipt',
    method: 'post',
    data
  })
}

export function recordSalesShipment(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/sales-shipment',
    method: 'post',
    data
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

export function recordReturnReceipt(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/return-receipt',
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

// 供应商发货 → 采购在途
export function recordPurchaseShip(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/purchase-ship',
    method: 'post',
    data
  })
}

// 到仓收货: 采购在途 → 待检
export function recordWarehouseReceive(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/warehouse-receive',
    method: 'post',
    data
  })
}

// 质检通过: 待检 → 原料库存
export function recordInspectionPass(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/inspection-pass',
    method: 'post',
    data
  })
}

// 质检不合格: 待检 → 损坏
export function recordInspectionFail(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/inspection-fail',
    method: 'post',
    data
  })
}

// 组装完成: 原料库存 → 待出库存
export function recordAssemblyComplete(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/assembly-complete',
    method: 'post',
    data
  })
}

// 物流发货: 待出库存 → 物流在途
export function recordLogisticsShip(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/logistics-ship',
    method: 'post',
    data
  })
}

// 平台上架: 物流在途 → 可售库存
export function recordPlatformReceive(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/platform-receive',
    method: 'post',
    data
  })
}

// 退货入库 → 退货库存
export function recordReturnReceive(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/return-receive',
    method: 'post',
    data
  })
}

// 退货质检
export interface ReturnInspectParams {
  sku_id: number
  warehouse_id: number
  pass_quantity: number
  fail_quantity: number
  remark?: string
  operator_id?: number
  reference_type?: string
  reference_number?: string
}

export function recordReturnInspect(data: ReturnInspectParams) {
  return request<ApiResponse<any>>({
    url: '/api/v1/inventory/movements/return-inspect',
    method: 'post',
    data
  })
}
