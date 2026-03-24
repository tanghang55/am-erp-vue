import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getConfigCenterModule } from '@/modules/system/api/configCenter'

const DEFAULT_BASE_CURRENCY = 'USD'
const DEFAULT_EXCHANGE_RATE_SCALE = 4

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export function useFinanceBaseCurrency() {
  const router = useRouter()
  const loading = ref(false)
  const baseCurrency = ref(DEFAULT_BASE_CURRENCY)
  const exchangeRateScale = ref(DEFAULT_EXCHANGE_RATE_SCALE)

  const currencyPrefix = computed(() => `${baseCurrency.value || DEFAULT_BASE_CURRENCY} `)

  const loadFinanceConfig = async () => {
    loading.value = true
    try {
      baseCurrency.value = DEFAULT_BASE_CURRENCY
      exchangeRateScale.value = DEFAULT_EXCHANGE_RATE_SCALE
      const res = await getConfigCenterModule('finance')
      for (const group of res.data.groups || []) {
        for (const item of group.items || []) {
          if (item.config_key === 'finance.default_currency') {
            baseCurrency.value = item.value || item.default_value || DEFAULT_BASE_CURRENCY
            continue
          }
          if (item.config_key === 'finance.exchange_rate_scale') {
            const parsed = Number(item.value || item.default_value || DEFAULT_EXCHANGE_RATE_SCALE)
            exchangeRateScale.value = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 8) : DEFAULT_EXCHANGE_RATE_SCALE
          }
        }
      }
    } catch (error: unknown) {
      ElMessage.error(getErrorMessage(error, '加载本位币配置失败'))
      baseCurrency.value = DEFAULT_BASE_CURRENCY
      exchangeRateScale.value = DEFAULT_EXCHANGE_RATE_SCALE
    } finally {
      loading.value = false
    }
  }

  const loadBaseCurrency = async () => {
    await loadFinanceConfig()
  }

  const goToFinanceConfigCenter = () => {
    router.push({
      name: 'system-config-center',
      query: {
        module: 'finance'
      }
    })
  }

  return {
    loading,
    baseCurrency,
    exchangeRateScale,
    currencyPrefix,
    loadFinanceConfig,
    loadBaseCurrency,
    goToFinanceConfigCenter
  }
}
