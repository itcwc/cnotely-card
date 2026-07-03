import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { seedDatabase } from './db'
import { installI18n, useI18n } from './locales/i18n.js'
import { useCardStore } from './composables/useCardStore'
import './style.css'

// 初始化 Analytics
import { initAnalytics } from './utils/analytics-sdk.js';
initAnalytics({
  site: 'card-app',
  endpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT || '/api/analytics',
});

// i18n 模块在 import 时已根据 localStorage / 浏览器语言完成初始化
const { locale } = useI18n()

seedDatabase(locale.value).then(async () => {
  // ===== 来自浏览器扩展的导入请求 =====
  // URL 形如：https://card.cnotely.com/?import=1#card=<encoded JSON>
  // 由 note-plugin 投射时构造，避免跨域通信
  try {
    const hash = window.location.hash || ''
    const hashMatch = hash.match(/card=([^&]+)/)
    if (hashMatch) {
      const encoded = decodeURIComponent(hashMatch[1])
      const data = JSON.parse(encoded)
      // 清理 URL 防止刷新重复导入
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      // 写入 IndexedDB
      const { createCard, openCardWindow } = useCardStore()
      const cardId = await createCard({
        type: data.type || 'qa',
        q: data.q || '',
        a: data.a || '',
        source: data.source || '',
      })
      // 触发打开编辑窗口
      setTimeout(() => openCardWindow(cardId), 100)
    }
  } catch (err) {
    console.error('[importCard] Failed:', err)
  }

  const app = createApp(App)
  installI18n(app)
  app.use(router).mount('#app')
}).catch(err => {
  console.error('Database seed failed:', err)
  const app = createApp(App)
  installI18n(app)
  app.use(router).mount('#app')
})
