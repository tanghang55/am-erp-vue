import type { CreateMovementParams } from '@/modules/inventory/types'
import type { Shipment } from '@/modules/shipping/types'

export type ShipmentPlatformReceiveRow = {
  shipment_item_id: number
  product_id: number
  product?: NonNullable<Shipment['items']>[number]['product']
  seller_sku?: string
  title?: string
  unit_cost: number
  currency: string
  quantity_planned: number
  quantity_received: number
  quantity_remaining: number
  receive_quantity: number
}

export function buildShipmentPlatformReceiveRows(shipment: Shipment): ShipmentPlatformReceiveRow[] {
  return (shipment.items || [])
    .map(item => {
      const quantityRemaining = Math.max(item.quantity_planned - item.quantity_received, 0)
      return {
        shipment_item_id: item.id,
        product_id: item.product_id,
        product: item.product,
        seller_sku: item.product?.seller_sku,
        title: item.product?.title,
        unit_cost: item.unit_cost,
        currency: item.currency,
        quantity_planned: item.quantity_planned,
        quantity_received: item.quantity_received,
        quantity_remaining: quantityRemaining,
        receive_quantity: quantityRemaining
      }
    })
    .filter(item => item.quantity_remaining > 0)
}

export function buildPlatformReceivePayload(
  shipment: Shipment,
  row: ShipmentPlatformReceiveRow
): CreateMovementParams {
  if (row.receive_quantity <= 0) {
    throw new Error('platform_receive_quantity_required')
  }
  if (row.receive_quantity > row.quantity_remaining) {
    throw new Error('platform_receive_quantity_exceeded')
  }

  return {
    product_id: row.product_id,
    warehouse_id: shipment.warehouse_id,
    quantity: row.receive_quantity,
    reference_type: 'SHIPMENT',
    reference_id: shipment.id,
    reference_number: shipment.shipment_number
  }
}
