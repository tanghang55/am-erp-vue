import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getFieldLabels } from '@/modules/common/api/fieldLabels'

export const useFieldLabelStore = defineStore('fieldLabels', () => {
  const labels = ref<Record<string, string>>({})
  const loadedLocale = ref<string>('')
  const loading = ref(false)
  const pendingLocale = ref<string>('')

  const ensureLoaded = async (locale: string) => {
    if (loading.value) {
      pendingLocale.value = locale
      return
    }
    if (loadedLocale.value === locale && Object.keys(labels.value).length) return

    loading.value = true
    try {
      const res = await getFieldLabels(locale)
      if (res.success) {
        labels.value = res.data.labels || {}
        loadedLocale.value = locale
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

  const getLabel = (key: string) => {
    const normalizedKey = key.trim().toLowerCase()
    return labels.value[normalizedKey] || labels.value[key] || key
  }

  return {
    labels,
    loadedLocale,
    loading,
    ensureLoaded,
    getLabel
  }
})
