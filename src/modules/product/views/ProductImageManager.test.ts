import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import ProductImageManager from '@/modules/product/views/ProductImageManager.vue'
import { useI18nStore } from '@/modules/common/stores/i18nStore'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { getProductImageList } from '@/modules/product/api/images'

const confirmMock = vi.hoisted(() => vi.fn())
const guardHolder = vi.hoisted(() => ({ guard: null as null | (() => Promise<boolean> | boolean) }))

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn() },
  ElMessageBox: { confirm: confirmMock }
}))

vi.mock('@/modules/product/api/products', () => ({
  getProductDetail: vi.fn().mockResolvedValue({ success: true, data: { seller_sku: 'P-001', title: '测试产品', asin: 'B001' } }),
}))

vi.mock('@/modules/product/api/images', () => ({
  getProductImageList: vi.fn().mockResolvedValue({ success: true, data: [] }),
  saveProductImageOrder: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '10' } }),
  useRouter: () => ({ push: vi.fn() }),
  onBeforeRouteLeave: (guard: () => Promise<boolean> | boolean) => {
    guardHolder.guard = guard
  }
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const DraggableStub = defineComponent({ template: '<div><slot /><slot name="footer" /></div>' })
const Stub = defineComponent({ template: '<div><slot /></div>' })
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('ProductImageManager', () => {
  it('loads images for current sku', async () => {
    setActivePinia(createPinia())
    const i18nStore = useI18nStore()
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')
    i18nStore.setLabels({
      'product.images.title': '图片管理'
    })

    const wrapper = shallowMount(ProductImageManager, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-button': Stub,
          'el-upload': Stub,
          'el-image': Stub,
          'el-tag': Stub,
          'el-alert': Stub,
          draggable: DraggableStub
        }
      }
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('图片管理')
  })

  it('renders 10 slots', async () => {
    setActivePinia(createPinia())
    const i18nStore = useI18nStore()
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')
    i18nStore.setLabels({
      'product.images.title': '图片管理'
    })

    const wrapper = shallowMount(ProductImageManager, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-button': Stub,
          'el-upload': Stub,
          'el-image': Stub,
          'el-tag': Stub,
          'el-alert': Stub,
          draggable: DraggableStub
        }
      }
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('[data-testid="image-slot"]').length).toBe(10)
  })

  it('renders image management summary metrics', async () => {
    const mockedGetProductImageList = vi.mocked(getProductImageList)
    mockedGetProductImageList.mockResolvedValueOnce({ success: true, data: ['/uploads/a.png', '/uploads/b.png'] })
    setActivePinia(createPinia())
    const i18nStore = useI18nStore()
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')
    i18nStore.setLabels({
      'product.images.title': '图片管理',
      'product.images.metricTotal': '已上传',
      'product.images.metricRemaining': '剩余槽位',
      'product.images.metricPrimary': '当前主图',
      'product.images.metricChanges': '待保存变更'
    })

    const wrapper = shallowMount(ProductImageManager, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-button': Stub,
          'el-upload': Stub,
          'el-image': Stub,
          'el-tag': Stub,
          'el-alert': Stub,
          draggable: DraggableStub
        }
      }
    })

    await flushPromises()
    const metrics = wrapper.findAll('[data-testid="summary-metric"]')
    expect(metrics).toHaveLength(4)
    expect(wrapper.text()).toContain('已上传')
    expect(wrapper.text()).toContain('剩余槽位')
    expect(wrapper.text()).toContain('当前主图')
    expect(wrapper.text()).toContain('待保存变更')
  })

  it('prompts when leaving with unsaved changes', async () => {
    confirmMock.mockResolvedValue(undefined)
    const mockedGetProductImageList = vi.mocked(getProductImageList)
    mockedGetProductImageList.mockResolvedValueOnce({ success: true, data: ['/uploads/a.png'] })
    setActivePinia(createPinia())
    const i18nStore = useI18nStore()
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')
    i18nStore.setLabels({
      'product.images.title': '图片管理',
      'product.images.leaveConfirm': '有未保存的图片更改，确认离开？',
      'product.images.warning': '提示'
    })

    const wrapper = shallowMount(ProductImageManager, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-button': Stub,
          'el-upload': Stub,
          'el-image': Stub,
          'el-tag': Stub,
          'el-alert': Stub,
          draggable: DraggableStub
        }
      }
    })

    await flushPromises()
    const vm = wrapper.vm as any
    vm.removeImage(0)
    await wrapper.vm.$nextTick()

    expect(vm.dirty).toBe(true)

    expect(guardHolder.guard).toBeTypeOf('function')
    const result = await guardHolder.guard?.()
    expect(confirmMock).toHaveBeenCalled()
    expect(result).toBe(true)
  })
})
