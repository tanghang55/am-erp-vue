import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'locale'
const DEFAULT_LOCALE = 'zh-CN'

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<string>(localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCALE)

  const isEnglish = computed(() => locale.value === 'en-US')

  const setLocale = (value: string) => {
    locale.value = value
    localStorage.setItem(STORAGE_KEY, value)
  }

  return {
    locale,
    isEnglish,
    setLocale
  }
})
