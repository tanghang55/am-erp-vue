import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import SupplierList from '@/modules/supplier/views/SupplierList.vue'

vi.mock('@/modules/supplier/api', () => ({
  getSupplierList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  getSupplierDetail: vi.fn().mockResolvedValue({ success: true, data: {} }),
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  deleteSupplier: vi.fn(),
  createSupplierContact: vi.fn(),
  updateSupplierContact: vi.fn(),
  deleteSupplierContact: vi.fn(),
  createSupplierAccount: vi.fn(),
  updateSupplierAccount: vi.fn(),
  deleteSupplierAccount: vi.fn(),
  createSupplierTag: vi.fn(),
  updateSupplierTag: vi.fn(),
  deleteSupplierTag: vi.fn()
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ template: '<div><slot /></div>' })
const TableStub = defineComponent({ template: '<div><slot /></div>' })
const ColumnStub = defineComponent({
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: {} }) : null)
  }
})

describe('SupplierList', () => {
  it('renders expanded section labels', async () => {
    const wrapper = shallowMount(SupplierList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-tag': Stub,
          'el-button': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-dialog': Stub,
          'el-divider': Stub,
          'el-pagination': Stub,
          'el-icon': Stub,
          'el-radio-group': Stub,
          'el-radio': Stub,
          'el-switch': Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Contacts')
    expect(wrapper.text()).toContain('Accounts')
    expect(wrapper.text()).toContain('Tags')
  })
})
