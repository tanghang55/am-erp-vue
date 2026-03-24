import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import ProductGroupDetail from '@/modules/product/views/ProductGroupDetail.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

vi.mock('@/modules/product/api/groups', () => ({
  getProductGroupDetail: vi.fn().mockResolvedValue({
    data: {
      id: 1,
      parent_asin: 'PARENT-ASIN-001',
      title: '测试归组',
      marketplace: 'US',
      brand: 'Brand',
      category: 'Category',
      status: 'ACTIVE',
      child_count: 2,
      active_child_count: 1,
      inactive_child_count: 1,
      gmt_modified: '2026-03-10 10:00:00',
      children: []
    }
  }),
  updateProductGroup: vi.fn(),
  attachProductGroupChildren: vi.fn(),
  detachProductGroupChild: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: '1' }
  }),
  useRouter: () => ({
    push: vi.fn()
  })
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

describe('ProductGroupDetail', () => {
  it('renders grouping detail header and summary cards', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(ProductGroupDetail, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-page-header': Stub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-dialog': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-tag': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          'el-image': Stub,
          ProductPickerDialog: Stub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('产品归组详情')
    expect(wrapper.text()).toContain('子体总数')
    expect(wrapper.text()).toContain('归组信息')
  })
})
