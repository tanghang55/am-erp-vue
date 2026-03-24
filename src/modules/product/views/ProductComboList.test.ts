import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import ProductComboList from '@/modules/product/views/ProductComboList.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

vi.mock('@/modules/product/api/combos', () => ({
  getProductComboList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  getProductComboDetail: vi.fn(),
  createProductCombo: vi.fn(),
  updateProductCombo: vi.fn(),
  deleteProductCombo: vi.fn()
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ template: '<div><slot /></div>' })
const NoSlotStub = defineComponent({ template: '<div />' })

const ProductPickerDialogStub = defineComponent({
  name: 'ProductPickerDialog',
  template: '<div class="product-picker-dialog-stub" />'
})

describe('ProductComboList', () => {
  it('renders combo archive header and search toolbar', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(ProductComboList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-tag': Stub,
          'el-dropdown': Stub,
          'el-dropdown-menu': Stub,
          'el-dropdown-item': Stub,
          'el-image': Stub,
          'el-input-number': Stub,
          ProductPickerDialog: ProductPickerDialogStub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('产品组合')
    expect(wrapper.text()).toContain('组合档案')
    expect(wrapper.text()).toContain('查询')
    expect(wrapper.text()).toContain('重置')
  })
})
