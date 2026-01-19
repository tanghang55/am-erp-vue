import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useI18nStore } from '@/modules/common/stores/i18nStore'

describe('i18nStore', () => {
  it('returns key when missing', () => {
    setActivePinia(createPinia())
    const store = useI18nStore()
    store.setLabels({})
    expect(store.t('product.list.title')).toBe('product.list.title')
  })
})
