import { computed } from 'vue'
import { useI18nStore } from '@/modules/common/stores/i18nStore'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

export const useI18n = () => {
  const i18nStore = useI18nStore()
  const localeStore = useLocaleStore()

  const ready = computed(() => !i18nStore.loading && i18nStore.loadedLocale === localeStore.locale)

  return {
    t: i18nStore.t,
    ready
  }
}
