import { ref, watch } from 'vue'
import { db } from '../db'

const SETTINGS_KEY = 'appSettings'

// Dexie settings 表引用（用于存储大体积数据如 customWallpaper）
const settingsTable = db.settings

let _lastPersistedCw = undefined // 避免重复写 IndexedDB

const defaults = {
  // 外观
  theme: 'light',
  wallpaperIndex: 0,
  customWallpaper: null,
  blurStrength: 25,
  barOpacity: 50,
  reduceMotion: false,
  dockZoom: true,

  // 桌面
  layoutMode: 'auto',
  iconGap: 100,
  showIconLabels: true,
  trashDirectDelete: false,

  // 卡片
  defaultCardType: 'qa',
  flipSpeed: 500,
  flip3d: true,
  flipPerspective: 1000,
  cardWidth: 310,
  cardHeight: 220,
  articleWidth: 350,

  // 复习
  reviewTheme: 'system',
  locale: 'en',
  initialInterval: 1,
  easeFactor: 2.5,
  minIntervalMult: 1.3,
  autoNextCard: true,
  showEbbinghaus: true,
  shuffleCards: false,

  // 番茄钟
  focusDuration: 25,
  shortBreak: 5,
  longBreakCycle: 4,
  longBreakDuration: 20,
  pomodoroSound: true,
  desktopNotify: true,
  autoStartPomodoro: false,
}

function coerceValue(key, val) {
  const d = defaults[key]
  if (d === undefined || val === undefined || val === null) return val
  if (typeof d === 'boolean' && typeof val !== 'boolean') return !!val
  if (typeof d === 'number' && typeof val !== 'number') return Number(val) || d
  return val
}

let _loaded = false
let _loading = null
let watchCleanup = null

const settings = ref({ ...defaults })

function get(key) {
  if (key) return settings.value[key]
  return settings.value
}

function set(key, value) {
  settings.value[key] = coerceValue(key, value)
}

function setBulk(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (k in defaults) {
      settings.value[k] = coerceValue(k, v)
    }
  }
}

async function persist() {
  try {
    const data = { ...settings.value }
    // 自定义壁纸 base64 体积太大，不适合 localStorage，单独存 IndexedDB
    const cw = data.customWallpaper
    delete data.customWallpaper
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data))

    // 只在壁纸数据变化时写 IndexedDB，避免频繁无意义写入
    if (cw !== _lastPersistedCw) {
      _lastPersistedCw = cw
      if (cw) {
        await settingsTable.put({ key: 'customWallpaper', value: cw })
      } else {
        await settingsTable.delete('customWallpaper')
      }
    }
  } catch (e) {
    console.error('[useSettings persist] ERROR:', e)
  }
}

async function init() {
  if (_loaded) return
  if (_loading) return _loading
  _loading = (async () => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) {
        const row = JSON.parse(raw)
        // 兼容旧格式 { value: {...} } 和新格式 flat {...}
        const values = row?.value ?? row
        if (values && typeof values === 'object') {
          for (const [k, v] of Object.entries(values)) {
            settings.value[k] = coerceValue(k, v)
          }
        }
      }
    } catch (e) {
      console.error('[useSettings init] parse error:', e)
    }
    // 从 IndexedDB 恢复自定义壁纸（避免 base64 撑爆 localStorage）
    try {
      const cwRow = await settingsTable.get('customWallpaper')
      if (cwRow && cwRow.value) {
        settings.value.customWallpaper = cwRow.value
        _lastPersistedCw = cwRow.value
      } else if (settings.value.customWallpaper) {
        // 迁移：localStorage 中有旧的自定义壁纸数据，写入 IndexedDB
        await settingsTable.put({ key: 'customWallpaper', value: settings.value.customWallpaper })
        _lastPersistedCw = settings.value.customWallpaper
      }
    } catch (e) {
      console.error('[useSettings init] wallpaper load error:', e)
    }
    // locale 以 localStorage 为准（i18n.js 也存这里），修复默认值变更后老数据缺失导致切回英文
    try {
      const savedLocale = localStorage.getItem('cnotely-locale')
      if (savedLocale) {
        settings.value.locale = savedLocale
      }
    } catch {}
    _loaded = true
    _loading = null
    console.log('[useSettings init] layoutMode after load:', settings.value.layoutMode)

    if (!watchCleanup) {
      watchCleanup = watch(
        () => ({ ...settings.value }),
        (nv) => { console.log('[useSettings watch] changed, layoutMode:', nv.layoutMode); persist() },

        { deep: true, flush: 'post' }
      )
    }
  })()
  return _loading
}

// 桌面壁纸
const wallpaperPresets = [
  {
    url: 'https://images.unsplash.com/photo-1511300636408-a63a89df3482?auto=format&fit=crop&w=200&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=1920&q=80',
    title: '经典山景',
  },
  {
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80',
    title: '流体渐变',
  },
  {
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=200&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80',
    title: '渐变紫粉',
  },
  {
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=200&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80',
    title: '极光绿',
  },
  {
    url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=200&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=1920&q=80',
    title: '浩瀚星空',
  },
]

function getActiveWallpaperUrl() {
  const idx = settings.value.wallpaperIndex
  if (idx === -1 && settings.value.customWallpaper) {
    return settings.value.customWallpaper
  }
  const i = Math.max(0, Math.min(idx, wallpaperPresets.length - 1))
  return wallpaperPresets[i].fullUrl
}

// ====== 数据操作 ======

async function exportAllData() {
  const [categories, cards, apps, settingRows] = await Promise.all([
    db.categories.toArray(),
    db.cards.toArray(),
    db.apps.toArray(),
    settingsTable.toArray(),
  ])
  return {
    version: 1,
    exportedAt: Date.now(),
    categories,
    cards,
    apps,
    settings: settingRows,
  }
}

async function importAllData(data) {
  if (!data || !data.categories || !data.cards) {
    throw new Error('无效的数据格式')
  }
  await db.categories.clear()
  await db.cards.clear()
  await db.apps.clear()
  await settingsTable.clear()

  if (data.categories.length) {
    await db.categories.bulkAdd(data.categories)
  }
  if (data.cards.length) {
    await db.cards.bulkAdd(data.cards)
  }
  if (data.apps.length) {
    await db.apps.bulkAdd(data.apps)
  }
  if (data.settings && data.settings.length) {
    for (const s of data.settings) {
      await settingsTable.put(s)
    }
  }
  _loaded = false
  _loading = null
  await init()
}

async function clearAllCards() {
  await db.cards.clear()
  await db.apps.clear()
}

async function resetToFactory() {
  // 保存当前语言设置，重置后恢复
  let currentLocale = 'en'
  try {
    currentLocale = localStorage.getItem('cnotely-locale') || 'en'
  } catch {}

  await db.cards.clear()
  await db.apps.clear()
  await settingsTable.clear()
  await db.categories.clear()
  _loaded = false
  _loading = null
  // 重新初始化 — 传入当前语言生成对应种子数据
  const { seedDatabase } = await import('../db')
  await seedDatabase(currentLocale)
  // 重置 settings 为默认值，但保留当前语言
  settings.value = { ...defaults, locale: currentLocale }
  _loaded = true
  await persist()
}

async function getStorageStats() {
  const [cardCount, appCount, catCount, settingRows] = await Promise.all([
    db.cards.count(),
    db.apps.count(),
    db.categories.count(),
    settingsTable.toArray(),
  ])

  let pomodoroStats = { todayCount: 0, totalCount: 0, totalMinutes: 0 }
  const ps = settingRows.find((r) => r.key === 'pomodoroStats')
  if (ps && ps.value) {
    pomodoroStats = {
      todayCount: ps.value.todayCount || 0,
      totalCount: ps.value.totalCount || 0,
      totalMinutes: ps.value.totalMinutes || 0,
    }
  }

  const reviewCount = await db.cards
    .filter((c) => c.reviewCount > 0)
    .count()

  // 估算存储大小
  const allData = await exportAllData()
  const estimatedSize = new Blob([JSON.stringify(allData)]).size

  return {
    cardCount,
    appCount,
    catCount,
    reviewCount,
    totalCompletions: pomodoroStats.totalCount || 0,
    totalFocusMinutes: pomodoroStats.totalMinutes || 0,
    estimatedSize,
  }
}

// 启动时自动加载
init()

export function useSettings() {
  return {
    settings,
    get,
    set,
    setBulk,
    init,
    persist,
    wallpaperPresets,
    getActiveWallpaperUrl,
    exportAllData,
    importAllData,
    clearAllCards,
    resetToFactory,
    getStorageStats,
    defaults,
  }
}
