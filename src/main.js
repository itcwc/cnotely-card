import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { seedDatabase } from './db'
import { installI18n, useI18n } from './locales/i18n.js'
import './style.css'

// i18n 模块在 import 时已根据 localStorage / 浏览器语言完成初始化
const { locale } = useI18n()

seedDatabase(locale.value).then(() => {
  const app = createApp(App)
  installI18n(app)
  app.use(router).mount('#app')
}).catch(err => {
  console.error('Database seed failed:', err)
  const app = createApp(App)
  installI18n(app)
  app.use(router).mount('#app')
})
