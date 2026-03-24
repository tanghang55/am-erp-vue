import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import WarehouseList from '@/modules/inventory/views/WarehouseList.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

vi.mock('@/modules/inventory/api', () => ({
  getWarehouseList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  createWarehouse: vi.fn(),
  updateWarehouse: vi.fn(),
  deleteWarehouse: vi.fn()
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ inheritAttrs: false, template: '<div><slot /></div>' })
const TableStub = defineComponent({ inheritAttrs: false, template: '<div><slot /></div>' })
const DropdownStub = defineComponent({ template: '<div><slot /><slot name="dropdown" /></div>' })
const ColumnStub = defineComponent({
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: {} }) : null)
  }
})

describe('WarehouseList', () => {
  it('renders chinese header without summary cards', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(WarehouseList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-tag': Stub,
          'el-button': Stub,
          'el-dropdown': DropdownStub,
          'el-dropdown-menu': Stub,
          'el-dropdown-item': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-dialog': Stub,
          'el-pagination': Stub,
          'el-icon': Stub,
          'el-radio-group': Stub,
          'el-radio': Stub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub
        },
        directives: {
          loading: {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('仓库管理')
    expect(wrapper.findAll('[data-testid="warehouse-summary-card"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('查看详情')
  })
})
