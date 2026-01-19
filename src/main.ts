import './assets/main.css'

import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { useI18nStore } from '@/modules/common/stores/i18nStore'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)

const localeStore = useLocaleStore(pinia)
const i18nStore = useI18nStore(pinia)
void i18nStore.ensureLoaded(localeStore.locale)
watch(
  () => localeStore.locale,
  (value) => {
    void i18nStore.ensureLoaded(value)
  }
)

app.mount('#app')
