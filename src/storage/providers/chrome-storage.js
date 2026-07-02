/**
 * chrome.storage.local provider — 扩展环境下的存储
 * 将 Dexie settings table 的 key-value 模型映射到 chrome.storage.local
 * 命名空间：cnote:setting:<key>
 */

const NS = 'cnote:setting:'

function nsKey(key) {
  return `${NS}${key}`
}

function storage() {
  // 每次调用时重新检测，避免模块加载时检测通过、运行时 API 不可用的竞态
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    return chrome.storage.local
  }
  throw new Error('[cnotely] chrome.storage.local is not available in this context')
}

export const chromeStorageProvider = {
  async get(key) {
    const fullKey = nsKey(key)
    const result = await storage().get(fullKey)
    const value = result[fullKey]
    if (value === undefined) return undefined
    return { key, value }
  },

  async put(item) {
    const fullKey = nsKey(item.key)
    await storage().set({ [fullKey]: item.value })
  },

  async toArray() {
    const all = await storage().get(null)
    const rows = []
    for (const [k, v] of Object.entries(all)) {
      if (k.startsWith(NS)) {
        rows.push({ key: k.slice(NS.length), value: v })
      }
    }
    return rows
  },

  async clear() {
    const all = await storage().get(null)
    const keysToRemove = Object.keys(all).filter((k) => k.startsWith(NS))
    if (keysToRemove.length) {
      await storage().remove(keysToRemove)
    }
  },

  async bulkAdd(items) {
    const obj = {}
    for (const item of items) {
      obj[nsKey(item.key)] = item.value
    }
    if (Object.keys(obj).length) {
      await storage().set(obj)
    }
  },
}
