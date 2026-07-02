import { ref } from 'vue'
import zhCN from './zh-CN/index.js'
import en from './en/index.js'

const locales = { 'zh-CN': zhCN, en }
const localeOrder = ['zh-CN', 'en']

const currentLocale = ref('en')
const messages = ref(locales['en'])

// 检测是否在 Chrome 扩展环境
const inExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local

function setLocale(lang) {
  if (locales[lang]) {
    currentLocale.value = lang
    messages.value = locales[lang]
    try {
      localStorage.setItem('cnotely-locale', lang)
    } catch {}
    // 扩展环境：同步语言到 chrome.storage（note-plugin 用 selectedLanguage 键）
    if (inExtension) {
      const extLang = lang === 'zh-CN' ? 'zh' : lang
      chrome.storage.local.set({ selectedLanguage: extLang })
    }
  }
}

// 启动时恢复语言
try {
  // 扩展环境优先从 chrome.storage 读取（与 note-plugin 共享）
  if (inExtension) {
    chrome.storage.local.get('selectedLanguage').then((res) => {
      if (res.selectedLanguage) {
        // 映射 note-plugin 的值格式
        const mapped = res.selectedLanguage === 'zh' ? 'zh-CN' : res.selectedLanguage
        if (locales[mapped]) setLocale(mapped)
        return
      }
      // fallback to localStorage
      const saved = localStorage.getItem('cnotely-locale')
      if (saved && locales[saved]) setLocale(saved)
    })
  } else {
    const saved = localStorage.getItem('cnotely-locale')
    if (saved && locales[saved]) setLocale(saved)
  }
  // 无 saved 时保持初始默认值 'en'
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
