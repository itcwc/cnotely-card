/**
 * 存储适配器 — 自动检测运行环境，路由到正确的 provider
 *
 * 扩展环境（chrome-extension://）→ chrome.storage.local
 * 独立 Web 环境（http://localhost / https://）→ IndexedDB (Dexie)
 *
 * 暴露的 settingsTable 接口与 Dexie 的 db.settings 完全兼容：
 *   get(key)     → Promise<{key, value} | undefined>
 *   put(item)    → Promise<void>
 *   toArray()    → Promise<Array<{key, value}>>
 *   clear()      → Promise<void>
 *   bulkAdd([])  → Promise<void>
 */

import { indexeddbProvider } from './providers/indexeddb'
import { chromeStorageProvider } from './providers/chrome-storage'

function detectEnvironment() {
  // chrome.storage 只在扩展上下文可用
  // 必须实际调用一次 .get() 才能确认 API 真正可用（仅检测属性存在不够）
  try {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      chrome.storage.local.get(null)
      return 'extension'
    }
  } catch {
    // 调用失败 → 不是真正的扩展上下文，降级到 web
  }
  return 'web'
}

const isExtension = detectEnvironment()

const provider = isExtension ? chromeStorageProvider : indexeddbProvider

if (isExtension) {
  console.log('[cnotely] storage: chrome.storage.local (extension mode)')
} else {
  console.log('[cnotely] storage: IndexedDB (web mode)')
}

/**
 * settingsTable — 供 useSettings / useCardStore 等使用
 * 接口与 Dexie 的 db.settings 一致，可直接替换
 */
export const settingsTable = {
  get: (key) => provider.get(key),
  put: (item) => provider.put(item),
  toArray: () => provider.toArray(),
  clear: () => provider.clear(),
  bulkAdd: (items) => provider.bulkAdd(items),
}

export { isExtension }
