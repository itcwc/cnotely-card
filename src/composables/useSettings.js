import { ref, watch } from 'vue'
import { db } from '../db'

const SETTINGS_KEY = 'appSettings'

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
  iconGap: 90,
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
    await db.settings.put({ key: SETTINGS_KEY, value: { ...settings.value } })
  } catch {
    // 静默
  }
}

let watchCleanup = null

async function init() {
  if (_loaded) return
  if (_loading) return _loading
  _loading = (async () => {
    try {
      const row = await db.settings.get(SETTINGS_KEY)
      if (row && row.value) {
        for (const [k, v] of Object.entries(row.value)) {
          settings.value[k] = coerceValue(k, v)
        }
      }
    } catch {
      // 表可能还不存在
    }
    _loaded = true
    _loading = null

    if (!watchCleanup) {
      watchCleanup = watch(
        () => ({ ...settings.value }),
        () => persist(),
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
    db.settings.toArray(),
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
  await db.settings.clear()

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
      await db.settings.put(s)
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
  await db.cards.clear()
  await db.apps.clear()
  await db.settings.clear()
  await db.categories.clear()
  _loaded = false
  _loading = null
  // 重新初始化
  const { seedDatabase } = await import('../db')
  await seedDatabase()
  // 重置 settings 为默认值
  settings.value = { ...defaults }
  _loaded = true
  await persist()
}

async function getStorageStats() {
  const [cardCount, appCount, catCount, settingRows] = await Promise.all([
    db.cards.count(),
    db.apps.count(),
    db.categories.count(),
    db.settings.toArray(),
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
