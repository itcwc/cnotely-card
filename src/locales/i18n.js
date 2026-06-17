import { ref, computed } from 'vue'
import zhCN from './zh-CN/index.js'
import en from './en/index.js'

const locales = { 'zh-CN': zhCN, en }
const localeOrder = ['zh-CN', 'en']

const currentLocale = ref('zh-CN')
const messages = ref(locales['zh-CN'])

function setLocale(lang) {
  if (locales[lang]) {
    currentLocale.value = lang
    messages.value = locales[lang]
    try {
      localStorage.setItem('cnotely-locale', lang)
    } catch {}
  }
}

// 启动时恢复：localStorage → 浏览器语言 → 默认 zh-CN
try {
  const saved = localStorage.getItem('cnotely-locale')
  if (saved && locales[saved]) {
    setLocale(saved)
  } else {
    // 首次访问，检测浏览器语言
    const lang = (navigator.language || '').toLowerCase()
    setLocale(lang.startsWith('zh') ? 'zh-CN' : 'en')
  }
} catch {}

// 模板中使用：$t('key.subkey')
// 支持嵌套路径和 {n} 插值
function t(key, params = {}) {
  const keys = key.split('.')
  let val = messages.value
  for (const k of keys) {
    if (val == null) return key
    val = val[k]
  }
  // null/undefined → key not found; plain object → intermediate node; array/number/boolean → valid leaf
  if (val == null) return key
  if (typeof val === 'object' && !Array.isArray(val)) return key
  if (typeof val !== 'string') return val
  return val.replace(/\{(\w+)\}/g, (_, m) =>
    params[m] !== undefined ? params[m] : `{${m}}`
  )
}

// 组合式 API：const { t, locale } = useI18n()
export function useI18n() {
  return {
    t,
    locale: currentLocale,
    setLocale,
    locales: localeOrder,
  }
}

// 全局挂载（main.js 中调用 installI18n(app)）
export function installI18n(app) {
  app.config.globalProperties.$t = t
  app.provide('i18n', { t, locale: currentLocale, setLocale, locales: localeOrder })
}
