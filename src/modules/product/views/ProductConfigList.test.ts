import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import ProductConfigList from '@/modules/product/views/ProductConfigList.vue'

vi.mock('@/modules/product/api/configs', () => ({
  getProductConfigList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  createProductConfig: vi.fn(),
  updateProductConfig: vi.fn(),
  deleteProductConfig: vi.fn(),
  getProductCategoryTree: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createProductCategory: vi.fn(),
  updateProductCategory: vi.fn(),
  deleteProductCategory: vi.fn()
}))

const CardStub = defineComponent({
  template: '<div><slot name="header" /><slot /></div>'
})

const Stub = defineComponent({
  template: '<div><slot /></div>'
})

const NoSlotStub = defineComponent({
  template: '<div />'
})

describe('ProductConfigList', () => {
  it('renders product config header and category rule summary', async () => {
    setActivePinia(createPinia())

    const wrapper = shallowMount(ProductConfigList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-dialog': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-input': Stub,
          'el-input-number': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-alert': Stub,
          'el-tag': Stub,
          'el-tooltip': Stub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('产品配置')
    expect(wrapper.text()).toContain('配置工作台')
    expect(wrapper.text()).toContain('销售状态')
    expect(wrapper.text()).toContain('可手动维护一级、二级、三级节点')
  })
})
