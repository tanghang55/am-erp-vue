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
const supplierRow = {
  id: 1,
  supplier_code: 'SUP-001',
  name: '演示供应商',
  status: 'ACTIVE',
  remark: '',
  deletable: false,
  reference_count: 2,
  delete_block_reason: '已被业务数据引用，不可删除'
}
const ColumnStub = defineComponent({
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: supplierRow }) : null)
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

    expect(wrapper.text()).toContain('联系人')
    expect(wrapper.text()).toContain('结算账户')
    expect(wrapper.text()).toContain('标签')
  })

  it('renders chinese header without summary cards', async () => {
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

    expect(wrapper.text()).toContain('供应商管理')
    expect(wrapper.findAll('[data-testid="supplier-summary-card"]')).toHaveLength(0)
  })

  it('renders delete blocked state for referenced supplier', async () => {
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
          'el-switch': Stub,
          'el-tooltip': Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('不可删除')
    expect(wrapper.text()).toContain('2 处引用')
  })
})
