// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { uploadImage } from './upload'
import request from '@/utils/request'

vi.mock('@/utils/request', () => ({
  default: vi.fn()
}))

describe('uploadImage', () => {
  it('posts to v1 upload endpoint', () => {
    const file = new File(['x'], 'demo.png', { type: 'image/png' })
    uploadImage(file, 'products')

    expect(vi.mocked(request)).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/v1/upload/image',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }))
  })
})
