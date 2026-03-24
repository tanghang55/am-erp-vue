import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PurchaseOrderList from './PurchaseOrderList.vue'

const { mockGetPurchaseOrderList } = vi.hoisted(() => ({
  mockGetPurchaseOrderList: vi.fn().mockResolvedValue({
    data: {
      data: [],
      total: 0
    }
  })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('../api', () => ({
  getPurchaseOrderList: mockGetPurchaseOrderList,
  submitPurchaseOrder: vi.fn(),
  markPurchaseOrderShipped: vi.fn(),
  receivePurchaseOrder: vi.fn(),
  deletePurchaseOrder: vi.fn(),
  closePurchaseOrder: vi.fn()
}))

const Stub = defineComponent({
  template: '<div><slot /><slot name="header" /><slot name="default" /></div>'
})

const NoSlotStub = defineComponent({
  template: '<div />'
})

describe('PurchaseOrderList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockGetPurchaseOrderList.mockClear()
    mockGetPurchaseOrderList.mockResolvedValue({
      data: {
        data: [],
        total: 0
      }
    })
  })

  it('loads first page with default page size 10', async () => {
    shallowMount(PurchaseOrderList, {
      global: {
        stubs: {
          'el-card': Stub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-input-number': Stub,
          'el-divider': Stub,
          WarehouseSelector: Stub,
          SupplierSelector: Stub
        }
      }
    })

    await Promise.resolve()

    expect(mockGetPurchaseOrderList).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        page_size: 10
      })
    )
  })

  it('passes supplier and marketplace filters when searching', async () => {
    const wrapper = shallowMount(PurchaseOrderList, {
      global: {
        stubs: {
          'el-card': Stub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-input-number': Stub,
          'el-divider': Stub,
          WarehouseSelector: Stub,
          SupplierSelector: Stub
        }
      }
    })

    await Promise.resolve()
    mockGetPurchaseOrderList.mockClear()

    const vm = wrapper.vm as unknown as {
      searchForm: {
        supplier_id?: number | null
        marketplace?: string
      }
      handleSearch: () => void
    }

    vm.searchForm.supplier_id = 8
    vm.searchForm.marketplace = 'US'
    vm.handleSearch()
    await Promise.resolve()

    expect(mockGetPurchaseOrderList).toHaveBeenCalledWith(
      expect.objectContaining({
        supplier_id: 8,
        marketplace: 'US'
      })
    )
  })
})
