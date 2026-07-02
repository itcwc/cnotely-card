/**
 * IndexedDB provider — 独立 Web 环境下的默认存储
 * 直接代理 Dexie 的 settings table，接口兼容
 */
import { db } from '../../db'

export const indexeddbProvider = {
  async get(key) {
    return db.settings.get(key)
  },

  async put(item) {
    return db.settings.put(item)
  },

  async toArray() {
    return db.settings.toArray()
  },

  async clear() {
    return db.settings.clear()
  },

  async bulkAdd(items) {
    return db.settings.bulkAdd(items)
  },
}
