import { describe, expect, it } from 'vitest'
import {
  buildPlatformReceivePayload,
  buildShipmentPlatformReceiveRows
} from '@/modules/shipping/utils/platformReceive'
import type { Shipment } from '@/modules/shipping/types'

const createShipment = (overrides: Partial<Shipment> = {}): Shipment => ({
  id: 1,
  shipment_number: 'SH202603090001',
  warehouse_id: 2,
  shipping_cost: 0,
  currency: 'USD',
  status: 'SHIPPED',
  receipt_status: 'PENDING',
  inventory_locked: false,
  inventory_deducted: true,
  created_at: '2026-03-09 10:00:00',
  updated_at: '2026-03-09 10:00:00',
  items: [],
  ...overrides
})

describe('platformReceive', () => {
  it('builds receivable rows from shipment remaining quantities', () => {
    const shipment = createShipment({
      items: [
        {
          id: 11,
          shipment_id: 1,
          product_id: 101,
          quantity_planned: 5,
          quantity_shipped: 5,
          quantity_received: 2,
          box_quantity: 0,
          unit_cost: 10,
          currency: 'USD',
          created_at: '',
          updated_at: ''
        },
        {
          id: 12,
          shipment_id: 1,
          product_id: 102,
          quantity_planned: 3,
          quantity_shipped: 3,
          quantity_received: 3,
          box_quantity: 0,
          unit_cost: 10,
          currency: 'USD',
          created_at: '',
          updated_at: ''
        }
      ]
    })

    const rows = buildShipmentPlatformReceiveRows(shipment)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      shipment_item_id: 11,
      product_id: 101,
      quantity_remaining: 3,
      receive_quantity: 3
    })
  })

  it('builds platform receive payload with shipment reference and warehouse id', () => {
    const shipment = createShipment({
      items: [
        {
          id: 11,
          shipment_id: 1,
          product_id: 101,
          quantity_planned: 5,
          quantity_shipped: 5,
          quantity_received: 1,
          box_quantity: 0,
          unit_cost: 10,
          currency: 'USD',
          created_at: '',
          updated_at: ''
        }
      ]
    })

    const row = buildShipmentPlatformReceiveRows(shipment)[0]
    row.receive_quantity = 2

    const payload = buildPlatformReceivePayload(shipment, row)

    expect(payload).toEqual({
      product_id: 101,
      warehouse_id: 2,
      quantity: 2,
      reference_type: 'SHIPMENT',
      reference_id: 1,
      reference_number: 'SH202603090001'
    })
  })

  it('rejects quantities greater than remaining', () => {
    const shipment = createShipment({
      items: [
        {
          id: 11,
          shipment_id: 1,
          product_id: 101,
          quantity_planned: 5,
          quantity_shipped: 5,
          quantity_received: 4,
          box_quantity: 0,
          unit_cost: 10,
          currency: 'USD',
          created_at: '',
          updated_at: ''
        }
      ]
    })

    const row = buildShipmentPlatformReceiveRows(shipment)[0]
    row.receive_quantity = 2

    expect(() => buildPlatformReceivePayload(shipment, row)).toThrow('platform_receive_quantity_exceeded')
  })

  it('rejects submit when quantity is zero', () => {
    const shipment = createShipment({
      items: [
        {
          id: 11,
          shipment_id: 1,
          product_id: 101,
          quantity_planned: 5,
          quantity_shipped: 5,
          quantity_received: 1,
          box_quantity: 0,
          unit_cost: 10,
          currency: 'USD',
          created_at: '',
          updated_at: ''
        }
      ]
    })

    const row = buildShipmentPlatformReceiveRows(shipment)[0]
    row.receive_quantity = 0

    expect(() => buildPlatformReceivePayload(shipment, row)).toThrow('platform_receive_quantity_required')
  })
})
