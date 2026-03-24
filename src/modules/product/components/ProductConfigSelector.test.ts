import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ProductConfigSelector from '@/modules/product/components/ProductConfigSelector.vue'

vi.mock('@/modules/product/api/configs', () => ({
  getProductConfigList: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [{ id: 1, config_type: 'BRAND', item_code: 'BRD001', item_name: '测试品牌', status: 'ACTIVE', sort: 1 }]
    }
  })
}))

const Stub = defineComponent({
  template: '<div><slot /></div>'
})

describe('ProductConfigSelector', () => {
  it('renders selected config item name and code', async () => {
    const wrapper = shallowMount(ProductConfigSelector, {
      props: {
        modelValue: 1,
        configType: 'BRAND',
        title: '选择品牌'
      },
      global: {
        stubs: {
          'el-input': Stub,
          'el-button': Stub,
          ProductConfigPickerDialog: Stub
        }
      }
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('测试品牌（BRD001）')
  })
})
