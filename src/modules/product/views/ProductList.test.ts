import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import ProductList from '@/modules/product/views/ProductList.vue'
import { useI18nStore } from '@/modules/common/stores/i18nStore'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

vi.mock('@/modules/product/api', () => ({
  getSkuList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  createSku: vi.fn(),
  updateSku: vi.fn(),
  deleteSku: vi.fn(),
  getSkuAuditLogs: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } })
}))

vi.mock('@/modules/common/composables/useAuditLogFormatter', () => ({
  useAuditLogFormatter: () => ({ formatAuditSummary: () => '' })
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

describe('ProductList', () => {
  it('uses i18n labels for header text', async () => {
    setActivePinia(createPinia())
    const i18nStore = useI18nStore()
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')
    i18nStore.setLabels({
      'product.list.skuManagement': 'SKU 管理测试'
    })

    const wrapper = shallowMount(ProductList, {
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
          'el-image': Stub,
          'el-input-number': Stub,
          'el-divider': Stub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          'ImageUpload': Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('SKU 管理测试')
  })
})
