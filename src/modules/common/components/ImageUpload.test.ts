import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ImageUpload from './ImageUpload.vue'

const mockUploadImage = vi.fn()
const mockSuccess = vi.fn()
const mockError = vi.fn()
const mockClose = vi.fn()

vi.mock('../api/upload', () => ({
  uploadImage: (...args: any[]) => mockUploadImage(...args)
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<any>('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: (...args: any[]) => mockSuccess(...args),
      error: (...args: any[]) => mockError(...args)
    },
    ElLoading: {
      service: () => ({
        close: mockClose
      })
    }
  }
})

const Stub = defineComponent({
  template: '<div><slot /></div>'
})

describe('ImageUpload', () => {
  beforeEach(() => {
    mockUploadImage.mockReset()
    mockSuccess.mockReset()
    mockError.mockReset()
    mockClose.mockReset()
  })

  it('writes response.data.url back to model value after upload', async () => {
    mockUploadImage.mockResolvedValue({
      success: true,
      data: {
        url: '/uploads/products/UPL2026031413001234.png'
      }
    })

    const wrapper = mount(ImageUpload, {
      props: {
        modelValue: '',
        subDir: 'products'
      },
      global: {
        stubs: {
          'el-upload': Stub,
          'el-button': Stub,
          'el-icon': Stub
        }
      }
    })

    const file = new File(['x'], 'demo.png', { type: 'image/png' })
    const result = await (wrapper.vm as any).beforeUpload(file)

    expect(result).toBe(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['/uploads/products/UPL2026031413001234.png'])
    expect(mockSuccess).toHaveBeenCalled()
  })
})
