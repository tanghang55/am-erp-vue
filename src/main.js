import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'

import App from './App.vue'

const app = createApp(App)
const i18n = createI18n({
  locale: 'en',
  messages: { en, fr }
})
app.use(ElementPlus)
app.use(i18n)
app.mount('#app')
