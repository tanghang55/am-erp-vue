import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuditLogFormatter } from './useAuditLogFormatter'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import type { AuditLog } from '@/modules/system/types'

vi.mock('@/modules/common/api/fieldLabels', () => ({
  getFieldLabels: vi.fn().mockResolvedValue({
    success: true,
    data: {
      labels: {}
    }
  })
}))

describe('useAuditLogFormatter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('formats purchase order audit logs with human readable actions and fields', () => {
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const { formatAuditSummary, formatAuditChanges } = useAuditLogFormatter()
    const row: AuditLog = {
      id: 1,
      module: 'Procurement',
      action: 'UPDATE',
      entity_type: 'PurchaseOrder',
      entity_id: '88',
      username: 'tester',
      created_at: '2026-03-14 10:00:00',
      updated_at: '2026-03-14 10:00:00',
      changes: JSON.stringify({
        before: {
          supplier_name: '供应商A',
          items: [
            {
              seller_sku: 'SKU-1',
              product_title: '测试产品1',
              qty_ordered: 1,
              qty_received: 0,
              unit_cost: 10,
              subtotal: 10
            }
          ]
        },
        after: {
          supplier_name: '供应商B',
          items: [
            {
              seller_sku: 'SKU-1',
              product_title: '测试产品1',
              qty_ordered: 2,
              qty_received: 0,
              unit_cost: 10,
              subtotal: 20
            }
          ]
        }
      })
    }

    expect(formatAuditSummary(row)).toContain('编辑采购单')

    const changes = formatAuditChanges(row)
    expect(changes).toContain('供应商')
    expect(changes).toContain('SKU-1')
    expect(changes).toContain('采购 2')
    expect(changes).not.toContain('supplier_name')
    expect(changes).not.toContain('qty_ordered')
  })

  it('formats purchase order item diffs without showing unchanged item fields', () => {
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const { formatAuditChanges } = useAuditLogFormatter()
    const row: AuditLog = {
      id: 2,
      module: 'Procurement',
      action: 'UPDATE',
      entity_type: 'PurchaseOrder',
      entity_id: '89',
      username: 'tester',
      created_at: '2026-03-15 10:00:00',
      updated_at: '2026-03-15 10:00:00',
      changes: JSON.stringify({
        before: {
          items: [
            {
              seller_sku: 'SKU-1',
              product_title: '测试产品1',
              qty_ordered: 1
            }
          ]
        },
        after: {
          items: [
            {
              seller_sku: 'SKU-1',
              product_title: '测试产品1',
              qty_ordered: 2
            }
          ]
        }
      })
    }

    const changes = formatAuditChanges(row)
    expect(changes).toContain('SKU-1')
    expect(changes).toContain('采购 2')
    expect(changes).not.toContain('收货 0')
    expect(changes).not.toContain('单价 0')
    expect(changes).not.toContain('小计 0')
  })

  it('formats shipment audit logs with human readable action and receipt fields', () => {
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const { formatAuditSummary, formatAuditChanges } = useAuditLogFormatter()
    const row: AuditLog = {
      id: 3,
      module: 'Shipment',
      action: 'RECEIVE',
      entity_type: 'Shipment',
      entity_id: '12',
      username: 'tester',
      created_at: '2026-03-22 18:00:00',
      updated_at: '2026-03-22 18:00:00',
      changes: JSON.stringify({
        before: {
          receipt_status: 'PENDING',
          received_quantity_total: 0,
          remaining_quantity_total: 6
        },
        after: {
          receipt_status: 'PARTIAL',
          received_quantity_total: 2,
          remaining_quantity_total: 4
        }
      })
    }

    expect(formatAuditSummary(row)).toContain('平台上架')

    const changes = formatAuditChanges(row)
    expect(changes).toContain('接收状态')
    expect(changes).toContain('已接收数量')
    expect(changes).toContain('待接收数量')
    expect(changes).not.toContain('receipt_status')
    expect(changes).not.toContain('received_quantity_total')
  })
})
