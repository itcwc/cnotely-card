import Dexie from 'dexie'

const db = new Dexie('cnotelyDB')

db.version(1).stores({
  categories: '++id, slug, name, isDefault, order',
  cards: '++id, categoryId, question, answer, source, createdAt',
})

db.version(2).stores({
  categories: '++id, slug, name, isDefault, order',
  cards: '++id, categoryId, question, answer, source, createdAt, sortOrder',
}).upgrade(tx => {
  return tx.table('cards').toCollection().modify((card, ref) => {
    if (card.sortOrder === undefined) {
      card.sortOrder = ref.value.id
    }
  })
})

db.version(3).stores({
  categories: '++id, slug, name, isDefault, order',
  cards: '++id, categoryId, question, answer, source, createdAt, sortOrder, type',
}).upgrade(tx => {
  return tx.table('cards').toCollection().modify((card) => {
    if (!card.type) card.type = 'qa'
  })
})

db.version(4).stores({
  categories: '++id, slug, name, isDefault, order',
  cards: '++id, categoryId, question, answer, source, createdAt, sortOrder, type, pinned',
}).upgrade(tx => {
  return tx.table('cards').toCollection().modify((card) => {
    if (card.pinned === undefined) card.pinned = false
  })
})

db.version(5).stores({
  categories: '++id, slug, name, isDefault, order',
  cards: '++id, categoryId, question, answer, source, createdAt, sortOrder, type, pinned, windowX, windowY, windowWidth, windowHeight, windowZ, isOpen',
  apps: '++id, name, icon, url, color, gridX, gridY, categoryId, createdAt',
}).upgrade(tx => {
  return tx.table('cards').toCollection().modify((card) => {
    if (card.windowX === undefined) card.windowX = null
    if (card.windowY === undefined) card.windowY = null
    if (card.windowWidth === undefined) card.windowWidth = null
    if (card.windowHeight === undefined) card.windowHeight = null
    if (card.windowZ === undefined) card.windowZ = 0
    if (card.isOpen === undefined) card.isOpen = false
  })
})

db.version(6).stores({
  categories: '++id, slug, name, isDefault, order',
  cards: '++id, categoryId, question, answer, source, createdAt, sortOrder, type, pinned, windowX, windowY, windowWidth, windowHeight, windowZ, isOpen',
  apps: '++id, name, icon, url, color, gridX, gridY, categoryId, createdAt',
  settings: 'key',
}).upgrade(async () => {
  await db.settings.put({ key: 'desktopLayoutMode', value: 'auto' })
})

db.version(7).stores({
  categories: '++id, slug, name, isDefault, order',
  cards: '++id, categoryId, question, answer, source, createdAt, sortOrder, type, pinned, windowX, windowY, windowWidth, windowHeight, windowZ, isOpen',
  apps: '++id, name, icon, url, color, gridX, gridY, categoryId, createdAt, pinned',
  settings: 'key',
}).upgrade(async (tx) => {
  const apps = await tx.table('apps').toCollection().modify((app) => {
    if (app.pinned === undefined) app.pinned = false
  })
})

// v8: 艾宾浩斯间隔重复系统字段
db.version(8).stores({
  categories: '++id, slug, name, isDefault, order',
  cards: '++id, categoryId, question, answer, source, createdAt, sortOrder, type, pinned, windowX, windowY, windowWidth, windowHeight, windowZ, isOpen, nextReviewAt, lastReviewAt, reviewCount, interval, easeFactor',
  apps: '++id, name, icon, url, color, gridX, gridY, categoryId, createdAt, pinned',
  settings: 'key',
}).upgrade(async (tx) => {
  await tx.table('cards').toCollection().modify((card) => {
    if (card.nextReviewAt === undefined) card.nextReviewAt = 0
    if (card.lastReviewAt === undefined) card.lastReviewAt = null
    if (card.reviewCount === undefined) card.reviewCount = 0
    if (card.interval === undefined) card.interval = 0
    if (card.easeFactor === undefined) card.easeFactor = 2.5
  })
})

const seedCategories = [
  {
    slug: 'frontend',
    name: '技术前端',
    iconComp: 'Code2',
    iconColor: '#10b981',
    tag: '#技术前端',
    border: 'border-t-emerald-500',
    order: 0,
    isDefault: 0,
  },
  {
    slug: 'vocab',
    name: '核心词汇',
    iconComp: 'BookOpen',
    iconColor: '#f97316',
    tag: '#核心词汇',
    border: 'border-t-amber-500',
    order: 1,
    isDefault: 0,
  },
  {
    slug: 'notes',
    name: '随手笔记',
    iconComp: 'Pen',
    iconColor: '#8b5cf6',
    tag: '#随手笔记',
    border: 'border-t-purple-500',
    order: 2,
    isDefault: 0,
  },
  {
    slug: 'uncategorized',
    name: '未分类',
    iconComp: 'Bookmark',
    iconColor: '#C8C9CC',
    tag: '#未分类',
    border: 'border-t-slate-400',
    order: 3,
    isDefault: 1,
  },
]

const seedCards = [
  { _categorySlug: 'frontend', question: '如何在 CSS 中利用多层 box-shadow 完美优雅地模拟出卡片层叠堆起的物理厚度？', answer: '使用逗号分隔多组阴影偏移量即可。', source: 'https://developer.mozilla.org', createdAt: Date.now(), sortOrder: 100 },
  { _categorySlug: 'frontend', question: 'Tailwind CSS 的 perspective 属性如何开启 3D 空间？', answer: '外层包裹 perspective-1000，内层开启 transform-style-3d', source: 'https://tailwindcss.com', createdAt: Date.now(), sortOrder: 200 },
  { _categorySlug: 'frontend', question: 'IndexedDB 的最大存储容量是多少？', answer: '一般来说由浏览器和硬盘决定，通常无固定上限限制。', source: '', createdAt: Date.now(), sortOrder: 300 },
  { _categorySlug: 'vocab', question: 'ephemeral', answer: 'adj. 朝生暮死、转瞬即逝的', source: 'https://ldoceonline.com', createdAt: Date.now(), sortOrder: 400 },
  { _categorySlug: 'vocab', question: 'serendipity', answer: 'n. 缘分、不期而遇的小确幸', source: 'https://ldoceonline.com', createdAt: Date.now(), sortOrder: 500 },
  { _categorySlug: 'notes', question: '今晚去超市记得买咖啡豆和全脂牛奶。📢', answer: '未设置反面内容', source: '', createdAt: Date.now(), sortOrder: 600 },
  { _categorySlug: 'notes', question: '看完了《设计心理学》，需要整理一份拟物化心流笔记。', answer: '未设置反面内容', source: '', createdAt: Date.now(), sortOrder: 700 },
  {
    _categorySlug: 'frontend',
    type: 'article',
    sortOrder: 800,
    question: `# cnotely的产品哲学：为什么我们需要记忆卡片牌桌？

## 一、无序画布的终结

市面上绝大多数白板和无限画布软件，最终都会变成垃圾场。因为人类的心理是贪婪的，没有边界的容纳意味着没有克制的思考。cnotely 反其道而行之，借用了《空当接龙》这个风靡了数十年的桌面游戏隐喻。

在空当接龙里，你只有4个暂存区（Free Cells）和4个目标回收牌堆。这意味着每一次挪动卡片、每一次归档，都是一次思维在物理阻尼感约束下的审判。

## 二、长文本的"折叠报纸"隐喻

短灵感是轻量的，长文章是沉重的。在我们的扑克牌网格系统里，长文章如果做成和普通卡片一样大，信息根本无法透出；如果做成巨型卡片，又会像巨石一样砸碎画布。因此，我们创造了**「纵向双倍高报纸卡」**。

它占用两个槽位，底部带有自然的纸张渐变淡出（Fade-out）。它不破坏牌阵，当你需要深度研读它时，点击"阅读全文"，右侧的沉浸式黄昏纸张阅读器就会像丝绸般滑出，给你最纯粹的阅读体验。

## 三、物理控制感的回归

人类对空间的记忆远超过对纯文本的记忆。当你把一张卡片从画布的左上角拖到右下角的"技术前端"牌堆时，你的手指、你的眼睛、你的大脑都在参与一次空间编码。

这不是简单的数据移动，这是一次**物理仪式**。就像你在书桌上把一本参考书从"待读"堆移到"已读"堆一样，那个动作本身就是记忆的一部分。

> 提示：双击卡片正面即可完成翻转，拖拽到牌堆即可归档。

\`\`\`js
// cnotely 的核心理念
const philosophy = {
  constraint: '物理约束带来思维清晰',
  metaphor: '空当接龙 = 信息管理',
  ritual: '每一次拖拽都是一次记忆编码',
}
\`\`\``,
    answer: '',
    source: '',
    createdAt: Date.now(),
  },
]

const seedApps = [
  {
    name: '复习工作台',
    icon: 'lucide:RotateCwSquare',
    url: '/review',
    color: '#1e293b',
    gridX: 0,
    gridY: 0,
    pinned: true,
    createdAt: Date.now()
  },
  {
    name: 'GitHub',
    icon: 'https://github.githubassets.com/favicons/favicon.svg',
    url: 'https://github.com',
    color: '#ffffff',
    gridX: 1,
    gridY: 0,
    createdAt: Date.now()
  },

  {
    name: 'Google',
    icon: 'https://www.google.com/images/branding/product/ico/googleg_lodp.ico',
    url: 'https://google.com',
    color: '#ffffff',
    gridX: 2,
    gridY: 0,
    createdAt: Date.now()
  },

  {
    name: 'YouTube',
    icon: 'https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png',
    url: 'https://youtube.com',
    color: '#ffffff',
    gridX: 0,
    gridY: 1,
    createdAt: Date.now()
  },

  {
    name: 'Notion',
    icon: 'https://www.notion.so/images/logo-ios.png',
    url: 'https://notion.so',
    color: '#ffffff',
    gridX: 1,
    gridY: 1,
    createdAt: Date.now()
  }
]

export async function seedDatabase() {
  const count = await db.categories.count()
  if (count > 0) return

  // 插入分类后读取实际分配的 ID（auto-increment 不归零，ID 可能与预设不同）
  const catIds = await db.categories.bulkAdd(seedCategories, { allKeys: true })

  // slug → 实际 ID 映射
  const slugToId = {}
  seedCategories.forEach((cat, i) => {
    slugToId[cat.slug] = catIds[i]
  })

  // 动态替换卡片 categoryId
  const cardsWithRealIds = seedCards.map((card) => {
    const slug = card._categorySlug
    return {
      ...card,
      _categorySlug: undefined,
      categoryId: slug ? slugToId[slug] : card.categoryId,
    }
  })

  await db.cards.bulkAdd(cardsWithRealIds)
  await db.apps.bulkAdd(seedApps)
}

db.version(9).stores({
  categories: '++id, slug, name, isDefault, order',
  cards: '++id, categoryId, question, answer, source, createdAt, sortOrder, type, pinned, windowX, windowY, windowWidth, windowHeight, windowZ, isOpen, nextReviewAt, lastReviewAt, reviewCount, interval, easeFactor',
  apps: '++id, name, icon, url, color, gridX, gridY, categoryId, createdAt, pinned, deleted',
  settings: 'key',
})

export { db }
