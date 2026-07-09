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
  // 新版 URL 形如：https://card.cnotely.com/?import=1&card=<encoded JSON>（query，避免与 hash 路由冲突）
  // 兼容旧版：#card=<encoded JSON>（hash）
  // 由 note-plugin 投射时构造，避免跨域通信
  try {
    const params = new URLSearchParams(window.location.search)
    let encoded = params.get('card')
    if (!encoded) {
      const hashMatch = (window.location.hash || '').match(/card=([^&]+)/)
      if (hashMatch) encoded = hashMatch[1]
    }
    if (encoded) {
      const data = JSON.parse(decodeURIComponent(encoded))
      // 清理 URL 防止刷新重复导入（移除 card 参数，保留其余 query）
      params.delete('card')
      const cleanSearch = params.toString()
      window.history.replaceState(
        null,
        '',
        window.location.pathname + (cleanSearch ? '?' + cleanSearch : '')
      )
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
