import { ref, computed } from 'vue'
import { db } from '../db'
import { nextZIndex } from './useZIndex'
import { useSettings } from './useSettings'
import { useI18n } from '../locales/i18n.js'

const { t } = useI18n()

const apps = ref([])
const categories = ref([])
const allCards = ref([])
const openWindows = ref([])
const activeWindowId = ref(null)
const selectedIconId = ref(null)

async function loadCategories() {
  categories.value = await db.categories.orderBy('order').toArray()
}

async function loadAllCards() {
  const cats = categories.value.length ? categories.value : await db.categories.orderBy('order').toArray()
  const cards = await db.cards.orderBy('sortOrder').toArray()
  allCards.value = cards
    .filter((card) => card.categoryId !== -1)
    .map((card) => {
      let cat = card.categoryId ? cats.find((c) => c.id === card.categoryId) : cats.find((c) => c.isDefault)
      if (!cat) cat = {}
      return {
        id: String(card.id),
        categoryId: card.categoryId,
        type: card.type || 'qa',
        tag: cat.tag || t('seed.tags.uncategorized'),
        border: hexToBorder[cat.iconColor] || cat.border || 'border-t-slate-400',
        iconColor: cat.iconColor || null,
        q: card.question,
        a: card.answer,
        source: card.source || '',
        customColor: cat.customColor || null,
        createdAt: card.createdAt,
        pinned: card.pinned || false,
      windowX: card.windowX,
      windowY: card.windowY,
      windowWidth: card.windowWidth,
      windowHeight: card.windowHeight,
      windowZ: card.windowZ || 0,
      isOpen: card.isOpen || false,
      nextReviewAt: card.nextReviewAt ?? 0,
      lastReviewAt: card.lastReviewAt ?? null,
      reviewCount: card.reviewCount ?? 0,
      interval: card.interval ?? 0,
      easeFactor: card.easeFactor ?? 2.5,
    }
  })
}

async function loadApps() {
  const appsData = await db.apps.toArray()
  appsData.sort((a, b) => {
    if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
      return a.sortOrder - b.sortOrder
    }
    return (a.createdAt || 0) - (b.createdAt || 0)
  })
  apps.value = appsData.filter(app => !app.deleted).map((app) => ({
    id: String(app.id),
    name: app.name,
    icon: app.icon,
    url: app.url,
    color: app.color,
    gridX: app.gridX,
    gridY: app.gridY,
    categoryId: app.categoryId,
    createdAt: app.createdAt,
    pinned: app.pinned || false,
  }))
}

async function createApp(appData) {
  const existingApps = await db.apps.toArray()
  const maxGridX = Math.max(...existingApps.map((a) => a.gridX || 0), 0)
  const maxGridY = Math.max(...existingApps.map((a) => a.gridY || 0), 0)
  
  let gridX = 0
  let gridY = maxGridY + 1
  if (existingApps.filter((a) => a.gridY === maxGridY).length < 4) {
    gridY = maxGridY
    gridX = maxGridX + 1
  }

  const id = await db.apps.add({
    name: appData.name,
    icon: appData.icon || '🔗',
    url: appData.url,
    color: appData.color || '#64748b',
    gridX,
    gridY,
    categoryId: appData.categoryId || null,
    createdAt: Date.now(),
  })
  await loadApps()
  return id
}

async function updateApp(id, appData) {
  await db.apps.update(Number(id), appData)
  await loadApps()
}

async function deleteApp(id) {
  const app = apps.value.find((a) => a.id === id)
  if (app?.pinned) return
  await db.apps.update(Number(id), { deleted: true })
  await loadApps()
}

async function restoreApp(id) {
  await db.apps.update(Number(id), { deleted: false })
  await loadApps()
}

async function permanentlyDeleteApp(id) {
  await db.apps.delete(Number(id))
  await loadApps()
}

async function loadDeletedApps() {
  return await db.apps.filter(app => app.deleted === true).toArray()
}

// desktopLayoutMode 与 useSettings 同步
const { settings: layoutSettings, set: setLayoutSetting } = useSettings()
const desktopLayoutMode = computed(() => layoutSettings.value.layoutMode || 'auto')

async function setDesktopLayoutMode(mode) {
  setLayoutSetting('layoutMode', mode)
  if (mode === 'auto') {
    await autoArrangeApps()
  }
}

async function updateAppPosition(appId, gridX, gridY) {
  await db.apps.update(Number(appId), { gridX, gridY })
  const index = apps.value.findIndex((a) => a.id === appId)
  if (index !== -1) {
    apps.value[index] = { ...apps.value[index], gridX, gridY }
  }
}

async function autoArrangeApps() {
  const sortedApps = [...apps.value].sort((a, b) => {
    if (a.gridY !== b.gridY) return a.gridY - b.gridY
    return a.gridX - b.gridX
  })
  
  const maxRows = 8
  for (let i = 0; i < sortedApps.length; i++) {
    const gridY = i % maxRows
    const gridX = Math.floor(i / maxRows)
    await db.apps.update(Number(sortedApps[i].id), { gridX, gridY })
    const idx = apps.value.findIndex((a) => a.id === sortedApps[i].id)
    if (idx !== -1) {
      apps.value[idx] = { ...apps.value[idx], gridX, gridY }
    }
  }
}

function openCardWindow(cardId) {
  const card = allCards.value.find((c) => c.id === cardId)
  if (!card) return

  const existingWindow = openWindows.value.find((w) => w.id === `card-${cardId}`)
  if (existingWindow) {
    focusWindow(existingWindow.id)
    return
  }

  const windowData = {
    id: `card-${cardId}`,
    type: 'card',
    cardId: cardId,
    title: card.type === 'article' ? `📄 ${t('desktop.cardTypes.article')}` : `🃏 ${t('desktop.cardTypes.memory')}`,
    x: card.windowX || 100 + (openWindows.value.length * 30),
    y: card.windowY || 100 + (openWindows.value.length * 30),
    width: card.windowWidth || (card.type === 'article' ? (layoutSettings.value.articleWidth ?? 350) : (layoutSettings.value.cardWidth ?? 310)),
    height: card.windowHeight || (card.type === 'article' ? 380 : (layoutSettings.value.cardHeight ?? 220)),
    z: nextZIndex(),
  }
  openWindows.value.push(windowData)
  activeWindowId.value = windowData.id
}

function closeWindow(windowId) {
  const index = openWindows.value.findIndex((w) => w.id === windowId)
  if (index !== -1) {
    openWindows.value.splice(index, 1)
  }
  if (activeWindowId.value === windowId) {
    activeWindowId.value = openWindows.value.length > 0 ? openWindows.value[openWindows.value.length - 1].id : null
  }
}

function minimizeWindow(windowId) {
  closeWindow(windowId)
}

function focusWindow(windowId) {
  const window = openWindows.value.find((w) => w.id === windowId)
  if (window) {
    window.z = nextZIndex()
    activeWindowId.value = windowId
  }
}

async function updateWindowPosition(windowId, position) {
  const window = openWindows.value.find((w) => w.id === windowId)
  if (window && window.type === 'card') {
    const cardId = window.cardId
    await db.cards.update(Number(cardId), {
      windowX: position.x,
      windowY: position.y,
    })
    const card = allCards.value.find((c) => c.id === cardId)
    if (card) {
      card.windowX = position.x
      card.windowY = position.y
    }
  }
}

async function updateWindowSize(windowId, size) {
  const window = openWindows.value.find((w) => w.id === windowId)
  if (window && window.type === 'card') {
    const cardId = window.cardId
    await db.cards.update(Number(cardId), {
      windowWidth: size.width,
      windowHeight: size.height,
    })
    const card = allCards.value.find((c) => c.id === cardId)
    if (card) {
      card.windowWidth = size.width
      card.windowHeight = size.height
    }
  }
}

async function createCard(cardData) {
  const maxOrder = await db.cards.orderBy('sortOrder').last()
  const sortOrder = maxOrder ? maxOrder.sortOrder + 100 : 100
  const id = await db.cards.add({
    categoryId: cardData.categoryId || null,
    question: cardData.q || '',
    answer: cardData.a || '',
    source: cardData.source || '',
    type: cardData.type || 'qa',
    createdAt: Date.now(),
    sortOrder,
    windowX: 150,
    windowY: 100,
    windowWidth: cardData.type === 'article' ? 350 : 310,
    windowHeight: cardData.type === 'article' ? 380 : 220,
    windowZ: 0,
    isOpen: false,
  })
  await loadAllCards()
  return String(id)
}

async function updateCard(cardId, cardData) {
  await db.cards.update(Number(cardId), cardData)
  await loadAllCards()
}

async function deleteCard(cardId) {
  // 先关窗口，再删数据，避免"卡片不存在"闪现
  closeWindow(`card-${cardId}`)
  await db.cards.update(Number(cardId), { categoryId: -1 })
  await loadAllCards()
}

function selectIcon(iconId) {
  selectedIconId.value = iconId
}

function clearSelection() {
  selectedIconId.value = null
}

async function initDesktop() {
  await loadCategories()
  await loadAllCards()
  await loadApps()
  await ensureReviewIcon()
}

async function ensureReviewIcon() {
  const reviewApp = apps.value.find((a) => a.url === '/review')
  if (reviewApp) {
    if (!reviewApp.pinned) {
      await db.apps.update(Number(reviewApp.id), { pinned: true })
      reviewApp.pinned = true
    }
    return
  }
  const id = await db.apps.add({
    name: t('desktop.reviewWorkbench'),
    icon: 'lucide:RotateCwSquare',
    url: '/review',
    color: '#1e293b',
    gridX: 0,
    gridY: 0,
    pinned: true,
    createdAt: Date.now(),
  })
  await loadApps()
}

const PALETTE_MAP = {
  emerald: { border: 'border-t-emerald-500' },
  amber: { border: 'border-t-amber-500' },
  purple: { border: 'border-t-purple-500' },
  rose: { border: 'border-t-rose-500' },
  sky: { border: 'border-t-sky-500' },
  violet: { border: 'border-t-violet-500' },
  teal: { border: 'border-t-teal-500' },
  orange: { border: 'border-t-orange-500' },
  cyan: { border: 'border-t-cyan-500' },
  pink: { border: 'border-t-pink-500' },
  lime: { border: 'border-t-lime-500' },
  blue: { border: 'border-t-blue-500' },
}

const hexToBorder = {
  '#3b82f6': 'border-t-blue-500',
  '#8b5cf6': 'border-t-violet-500',
  '#10b981': 'border-t-emerald-500',
  '#f59e0b': 'border-t-amber-500',
  '#ec4899': 'border-t-pink-500',
  '#6366f1': 'border-t-violet-500',
  '#f97316': 'border-t-orange-500',
  '#64748b': 'border-t-sky-500',
  '#14b8a6': 'border-t-teal-500',
  '#ef4444': 'border-t-rose-500',
  '#a855f7': 'border-t-purple-500',
  '#38bdf8': 'border-t-sky-500',
  '#e11d48': 'border-t-rose-500',
  '#1e293b': 'border-t-blue-500',
  '#C8C9CC': 'border-t-slate-400',
}

async function createCategory(name, colorName, customColor, iconComp, iconColor) {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u4e00-\u9fff-]/g, '') || 'cat-' + Date.now()
  const maxOrder = categories.value.length ? Math.max(...categories.value.map((c) => c.order)) : 0
  const palette = PALETTE_MAP[colorName] || PALETTE_MAP.emerald

  await db.categories.add({
    slug,
    name,
    iconComp: iconComp || null,
    iconColor: iconColor || null,
    tag: '#' + name,
    border: hexToBorder[iconColor] || palette.border || 'border-t-slate-400',
    order: maxOrder + 1,
    isDefault: 0,
    customColor: customColor || null,
  })
  await loadCategories()
}

async function deleteCategory(slug) {
  const cat = categories.value.find((c) => c.slug === slug)
  if (!cat || cat.isDefault) return

  const defaultCat = categories.value.find((c) => c.isDefault)
  if (defaultCat) {
    await db.cards.where('categoryId').equals(cat.id).modify({ categoryId: defaultCat.id })
  }

  await db.categories.delete(cat.id)
  await loadCategories()
  await loadAllCards()
}

async function updateCategory(id, updates) {
  await db.categories.update(id, updates)
  await loadCategories()
}

// 艾宾浩斯 SM-2 间隔重复算法
// quality: 0 = 没记住(重置), 1 = 已掌握(推进)
const MIN_EASE = 1.3
const FORGET_INTERVAL = 10 * 60 * 1000 // 没记住时 10 分钟后重现

function calcNextReview(card, quality) {
  let { reviewCount, interval, easeFactor } = card
  const s = layoutSettings.value
  const initialInterval = s.initialInterval ?? 1
  const baseEaseFactor = s.easeFactor ?? 2.5
  const minIntervalMult = s.minIntervalMult ?? 1

  // 使用设置中的 easeFactor 作为初始值
  if (interval === 0 && easeFactor === 2.5) {
    easeFactor = baseEaseFactor
  }

  if (quality === 0) {
    // 没记住：重置进度
    reviewCount = 0
    interval = 0
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2)
    return {
      nextReviewAt: Date.now() + FORGET_INTERVAL,
      reviewCount,
      interval,
      easeFactor,
    }
  }

  // 已掌握：按 SM-2 推进间隔，最小间隔受 minIntervalMult 约束
  if (reviewCount === 0) {
    interval = initialInterval
  } else if (reviewCount === 1) {
    interval = Math.ceil(initialInterval * 6 * minIntervalMult)
  } else {
    interval = Math.round(interval * easeFactor * minIntervalMult)
  }

  reviewCount++
  easeFactor = Math.max(MIN_EASE, easeFactor + (0.1 - (2 - quality) * 0.08))

  return {
    nextReviewAt: Date.now() + interval * 24 * 60 * 60 * 1000,
    reviewCount,
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100,
  }
}

async function reviewCard(cardId, quality) {
  const card = allCards.value.find((c) => c.id === cardId)
  if (!card) return

  const result = calcNextReview(card, quality)

  await db.cards.update(Number(cardId), {
    nextReviewAt: result.nextReviewAt,
    lastReviewAt: Date.now(),
    reviewCount: result.reviewCount,
    interval: result.interval,
    easeFactor: result.easeFactor,
  })

  // 同步内存
  card.nextReviewAt = result.nextReviewAt
  card.lastReviewAt = Date.now()
  card.reviewCount = result.reviewCount
  card.interval = result.interval
  card.easeFactor = result.easeFactor
}

const reviewDeck = computed(() => {
  const now = Date.now()
  return allCards.value.filter(
    (card) =>
      (card.type === 'qa' || card.type === 'article') && card.nextReviewAt <= now
  )
})

export function useCardStore() {
  return {
    apps,
    categories,
    allCards,
    reviewDeck,
    openWindows,
    activeWindowId,
    selectedIconId,
    desktopLayoutMode,
    loadCategories,
    loadAllCards,
    loadApps,
    createApp,
    updateApp,
    deleteApp,
    restoreApp,
    permanentlyDeleteApp,
    loadDeletedApps,
    createCard,
    updateCard,
    deleteCard,
    reviewCard,
    openCardWindow,
    closeWindow,
    minimizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    selectIcon,
    clearSelection,
    initDesktop,
    createCategory,
    deleteCategory,
    updateCategory,
    setDesktopLayoutMode,
    updateAppPosition,
    autoArrangeApps,
  }
}
