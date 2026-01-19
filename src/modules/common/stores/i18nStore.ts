import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getFieldLabels } from '@/modules/common/api/fieldLabels'

const STORAGE_PREFIX = 'i18n_labels_'

export const useI18nStore = defineStore('i18n', () => {
  const labels = ref<Record<string, string>>({})
  const loadedLocale = ref('')
  const loading = ref(false)
  const pendingLocale = ref('')

  const loadFromCache = (locale: string) => {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${locale}`)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Record<string, string>
    } catch {
      return null
    }
  }

  const saveToCache = (locale: string, data: Record<string, string>) => {
    localStorage.setItem(`${STORAGE_PREFIX}${locale}` , JSON.stringify(data))
  }

  const setLabels = (value: Record<string, string>) => {
    labels.value = value
  }

  const ensureLoaded = async (locale: string) => {
    if (!locale) return
    if (loading.value) {
      pendingLocale.value = locale
      return
    }
    if (loadedLocale.value === locale && Object.keys(labels.value).length) return

    const cached = loadFromCache(locale)
    if (cached) {
      labels.value = cached
      loadedLocale.value = locale
    }

    loading.value = true
    try {
      const res = await getFieldLabels(locale)
      if (res.success) {
        labels.value = res.data.labels || {}
        loadedLocale.value = locale
        saveToCache(locale, labels.value)
      }
    } finally {
      loading.value = false
      const nextLocale = pendingLocale.value
      pendingLocale.value = ''
      if (nextLocale && nextLocale !== loadedLocale.value) {
        ensureLoaded(nextLocale)
      }
    }
  }

  const t = (key: string) => labels.value[key] || key

  return {
    labels,
    loadedLocale,
    loading,
    ensureLoaded,
    setLabels,
    t
  }
})
