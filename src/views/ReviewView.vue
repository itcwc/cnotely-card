<template>
  <div class="review-page h-screen flex flex-col antialiased overflow-hidden select-none" :class="reviewThemeClass">

    <!-- ===== 顶部 macOS 磨砂菜单栏 ===== -->
    <header class="review-menubar absolute top-0 left-0 right-0 h-7 flex items-center justify-between px-4 z-50">
      <div class="flex items-center gap-4">
        <router-link to="/" class="flex items-center gap-1.5 review-link">
          <ArrowLeft :size="12" />
          <span class="text-xs">返回画布</span>
        </router-link>
        <span class="text-xs font-semibold tracking-tight flex items-center gap-1 review-title">
          <Zap :size="12" class="text-amber-400" /> {{ activeCategoryName }}
        </span>
        <span class="text-xs font-mono review-counter">{{ Math.min(currentIndex + 1, sessionDeck.length) }} / {{ sessionDeck.length }}</span>
      </div>
      <div class="flex items-center gap-3">
        <button @click="showResetConfirm = true" class="text-xs review-reset-btn flex items-center gap-1" title="重置当前分类所有卡片的学习进度">
          <RotateCcw :size="12" /> 重置进度
        </button>
        <div class="flex items-center gap-1.5 text-[10px] review-kbd-hints">
          <kbd class="review-kbd">Space</kbd>翻面
          <kbd class="review-kbd">1</kbd>没记住
          <kbd class="review-kbd">2</kbd>已掌握
        </div>
        <span class="text-xs font-medium review-clock">{{ currentDate }}</span>
        <span class="text-xs font-medium review-clock">{{ currentTime }}</span>
      </div>
    </header>

    <div class="flex-1 flex relative overflow-hidden" style="padding-top: 28px;">

      <!-- ===== 侧边栏 — 磨砂玻璃 ===== -->
      <aside class="review-sidebar flex flex-col border-r z-10 shrink-0 transition-all duration-300 ease-in-out"
        :class="sidebarCollapsed ? 'w-12' : 'w-60'">
        <!-- 折叠按钮 -->
        <div class="flex items-center justify-between px-2 h-8 border-b shrink-0 review-sidebar-hd">
          <button @click="sidebarCollapsed = !sidebarCollapsed" class="w-7 h-6 flex items-center justify-center rounded review-sidebar-toggle">
            <PanelLeftClose v-if="!sidebarCollapsed" :size="14" />
            <PanelLeftOpen v-else :size="14" />
          </button>
          <span v-if="!sidebarCollapsed" class="text-[10px] font-bold tracking-wider uppercase review-sidebar-title">复习牌组</span>
        </div>

        <!-- 牌组列表 -->
        <div v-if="!sidebarCollapsed" class="flex-1 overflow-y-auto p-2 space-y-2">
          <div class="review-deck-item" :class="{ 'review-deck-active': activeCategoryId === null }" @click="switchCategory(null)">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs shrink-0" style="background: var(--review-accent)">
              <Layers :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold truncate review-deck-name">全部卡片</h3>
              <p class="text-[11px] font-medium mt-0.5 review-deck-meta">共 {{ deck.length }} 张</p>
            </div>
            <div v-if="activeCategoryId === null" class="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style="background: var(--review-accent)">
              <Check :size="11" class="text-white" />
            </div>
          </div>
          <div v-for="group in cardGroups" :key="group.categoryId"
            class="review-deck-item" :class="{ 'review-deck-active': activeCategoryId === group.categoryId }"
            @click="switchCategory(group.categoryId)">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
              :style="{ backgroundColor: group.color || '#64748b' }">
              <component v-if="group.iconComp && iconComponents[group.iconComp]" :is="iconComponents[group.iconComp]" :size="16" />
              <HelpCircle v-else :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold truncate review-deck-name">{{ group.name }}</h3>
              <p class="text-[11px] font-medium mt-0.5 review-deck-meta">剩余 {{ group.remaining }} 张</p>
            </div>
            <div v-if="activeCategoryId === group.categoryId" class="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style="background: var(--review-accent)">
              <Check :size="11" class="text-white" />
            </div>
            <ChevronRight v-else :size="14" class="review-deck-arrow shrink-0" />
          </div>
        </div>

        <!-- 折叠态迷你指示器 -->
        <div v-else class="flex-1 overflow-y-auto py-2 flex flex-col items-center gap-2">
          <div class="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0 cursor-pointer transition-all"
            :style="{ backgroundColor: activeCategoryId === null ? 'var(--review-accent)' : 'var(--review-sidebar-mini-bg, #94a3b8)' }"
            title="全部卡片" @click="switchCategory(null)">
            <Layers :size="10" />
          </div>
          <div v-for="group in cardGroups" :key="group.categoryId"
            class="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0 cursor-pointer transition-all"
            :class="activeCategoryId === group.categoryId ? 'ring-1 scale-110' : ''"
            :style="{ backgroundColor: group.color || '#64748b', '--tw-ring-color': 'var(--review-accent)' }"
            :title="group.name + ' - 剩余' + group.remaining + '张'"
            @click="switchCategory(group.categoryId)">
            {{ group.remaining }}
          </div>
        </div>

        <!-- 番茄钟 -->
        <div class="shrink-0 border-t review-pomodoro-section transition-all duration-300" :class="sidebarCollapsed ? 'p-1.5' : 'p-3'">
          <div v-if="!sidebarCollapsed" class="review-pomodoro-card rounded-xl p-3 border">
            <div class="flex items-center justify-between text-xs font-bold mb-2 review-pomodoro-hd">
              <div class="flex items-center gap-1.5">
                <Timer :size="12" class="text-amber-400" />
                <span>番茄专注钟</span>
              </div>
              <span class="text-[10px] review-pomodoro-stats">今日 {{ todayCount }} 个 · 累计 {{ totalMinutes }} 分钟</span>
            </div>
            <div class="w-full h-1 rounded-full mb-2 overflow-hidden review-progress-track">
              <div class="h-full rounded-full transition-all duration-1000 ease-linear"
                :class="pomodoroRunning ? 'bg-amber-400' : 'review-progress-idle'"
                :style="{ width: progressPercent + '%' }" />
            </div>
            <div class="font-mono text-xl font-bold tracking-wider mb-2 text-center"
              :class="pomodoroRunning && pomodoroSeconds < 60 ? 'text-amber-400' : 'review-pomodoro-time'">
              {{ pomodoroDisplay }}
            </div>
            <div class="flex gap-1.5">
              <button @click="togglePomodoro" class="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                :class="pomodoroRunning ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'review-pomodoro-start'">
                {{ pomodoroRunning ? '暂停' : (pomodoroSeconds < pomodoroTotal ? '继续' : '开始专注') }}
              </button>
              <button v-if="pomodoroRunning || pomodoroSeconds < pomodoroTotal" @click="resetPomodoro"
                class="px-2 py-1.5 rounded-lg text-xs transition-colors review-pomodoro-reset">
                <RotateCcw :size="12" />
              </button>
            </div>
          </div>
          <div v-else class="flex flex-col items-center gap-1">
            <div class="font-mono text-[10px] font-bold text-center"
              :class="pomodoroRunning ? 'text-amber-400' : 'review-pomodoro-time'">
              {{ pomodoroDisplayMini }}
            </div>
            <button @click="togglePomodoro" class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              :class="pomodoroRunning ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'review-pomodoro-reset'">
              <Pause v-if="pomodoroRunning" :size="10" />
              <Play v-else :size="10" />
            </button>
          </div>
        </div>
      </aside>

      <!-- ===== 主内容区 ===== -->
      <main class="flex-1 flex flex-col items-center justify-center p-6 relative">

        <!-- QA 卡片（3D 翻转） -->
        <div v-if="!isComplete && !isArticleCard" class="relative" :style="{ ...cardSize, perspective: settings.flipPerspective + 'px' }">
          <div
            :class="['absolute inset-0 w-full h-full cursor-pointer z-30', settings.flip3d ? 'transform-style-3d' : '', flipContainerClass, slideDirection]"
            :style="{ transition: `transform ${settings.flipSpeed}ms cubic-bezier(0.4,0,0.2,1)` }"
            @click="flipCurrentCard">
            <!-- 正面 — 纸质感卡片 -->
            <div :class="['absolute inset-0 review-card-front rounded-xl flex flex-col overflow-hidden', settings.flip3d ? 'backface-hidden' : '']"
              :style="[flipFrontStyle]">
              <!-- 顶部渐变条 + 分类徽章 -->
              <div class="shrink-0 relative" :style="cardGradientStyle">
                <span class="review-category-badge" :style="{ backgroundColor: cardCategoryInfo.color }">
                  {{ cardCategoryInfo.name }}
                </span>
              </div>
              <!-- 卡片内容 — 问题 -->
              <div class="flex-1 flex flex-col overflow-hidden px-6 pt-4 pb-4">
                <div class="review-prose max-w-none flex-1 overflow-y-auto pr-1 review-scroll" :style="questionTextStyle" v-html="questionHtml"></div>
              </div>
              <!-- 底部来源链接 -->
              <div v-if="currentCard.source" class="shrink-0 flex items-center gap-1.5 px-6 pb-3 pt-1 text-[11px] review-card-footer">
                <Link :size="11" class="review-card-footer-icon shrink-0" />
                <a :href="currentCard.source" target="_blank" @click.stop class="review-card-footer-link truncate">{{ displaySource }}</a>
              </div>
            </div>
            <!-- 背面 — 深色答题面 -->
            <div :class="['absolute inset-0 review-card-back rounded-xl flex flex-col overflow-hidden', settings.flip3d ? 'backface-hidden rotate-y-180' : '']"
              :style="[flipBackStyle]">
              <!-- 顶部渐变条 + 分类徽章 -->
              <div class="shrink-0 relative" :style="cardGradientStyle">
                <span class="review-category-badge" :style="{ backgroundColor: cardCategoryInfo.color }">
                  {{ cardCategoryInfo.name }}
                </span>
              </div>
              <!-- 卡片内容 — 答案 -->
              <div class="flex-1 flex flex-col overflow-hidden px-6 pt-3 pb-4">
                <div class="review-prose-answer max-w-none flex-1 overflow-y-auto pr-1 review-scroll" :style="questionTextStyle" v-html="answerHtml"></div>
              </div>
              <!-- 底部来源链接 -->
              <div v-if="currentCard.source" class="shrink-0 flex items-center gap-1.5 px-6 pb-3 pt-1 text-[11px] review-card-footer">
                <Link :size="11" class="review-card-footer-icon shrink-0" />
                <a :href="currentCard.source" target="_blank" @click.stop class="review-card-footer-link truncate">{{ displaySource }}</a>
              </div>
            </div>
          </div>

          <!-- 卡片层叠阴影 -->
          <div :class="['absolute inset-0 w-full h-full review-card-shadow rounded-xl pointer-events-none transition-all duration-300 z-20', shadow1Class]" />
          <div :class="['absolute inset-0 w-full h-full review-card-shadow-ghost rounded-xl pointer-events-none transition-all duration-300 z-10', shadow2Class]" />

          <div class="review-resize-handle" @mousedown.stop="startResize"></div>
        </div>

        <!-- 文章卡 -->
        <div v-else-if="!isComplete && isArticleCard" class="relative" :style="cardSize">
          <div :class="['absolute inset-0 review-card-front rounded-xl flex flex-col overflow-hidden transition-transform duration-500', slideDirection]">
            <!-- 顶部渐变条 + 分类徽章 -->
            <div class="shrink-0 relative" :style="cardGradientStyle">
              <span class="review-category-badge" :style="{ backgroundColor: cardCategoryInfo.color }">
                {{ cardCategoryInfo.name }}
              </span>
            </div>
            <!-- 卡片内容 -->
            <div class="flex-1 flex flex-col overflow-hidden px-6 pt-3 pb-4">
              <div class="review-prose max-w-none text-sm leading-relaxed overflow-y-auto flex-1 pr-2 review-scroll" v-html="articleHtml"></div>
            </div>
            <!-- 底部来源链接 -->
            <div v-if="currentCard.source" class="shrink-0 flex items-center gap-1.5 px-6 pb-3 pt-1 text-[11px] review-card-footer">
              <Link :size="11" class="review-card-footer-icon shrink-0" />
              <a :href="currentCard.source" target="_blank" class="review-card-footer-link truncate">{{ displaySource }}</a>
            </div>
          </div>
          <div class="review-resize-handle" @mousedown.stop="startResize"></div>
        </div>

        <!-- 完成态 -->
        <div v-else class="relative w-[440px] h-[300px]">
          <div class="absolute inset-0 review-complete-bg rounded-3xl flex flex-col items-center justify-center p-8 text-center">
            <div class="w-14 h-14 rounded-full flex items-center justify-center mb-4 review-complete-icon">
              <PartyPopper :size="28" />
            </div>
            <h3 class="text-lg font-bold review-complete-title">太棒了！今日复习已全部完成</h3>
            <p class="text-xs mt-2 review-complete-desc">共复习 {{ sessionDeck.length }} 张卡片，知识已入库。<template v-if="nextDueInfo">下一批卡片 {{ nextDueInfo }} 到达。</template></p>
          </div>
        </div>

        <!-- 评分按钮组 -->
        <div v-if="!isComplete"
          :class="['mt-8 flex items-center gap-6 z-10 transition-all duration-300', { 'opacity-0 pointer-events-none': isComplete }]">
          <button @click="handleCardReview('left')" class="review-rate-btn review-rate-forget">
            <div class="review-rate-icon review-rate-icon-forget">
              <X :size="24" />
            </div>
            <span class="text-xs font-bold tracking-wider">没记住 (1)</span>
            <span class="text-[10px] font-medium review-rate-label">{{ forgetLabel }}</span>
          </button>
          <button @click="handleCardReview('right')" class="review-rate-btn review-rate-master">
            <div class="review-rate-icon review-rate-icon-master">
              <Check :size="24" />
            </div>
            <span class="text-xs font-bold tracking-wider">已掌握 (2)</span>
            <span class="text-[10px] font-medium review-rate-label">{{ masterLabel }}</span>
          </button>
        </div>

        <!-- 艾宾浩斯 & 翻转提示（卡片外 — 按钮下方） -->
        <div v-if="!isComplete && !isArticleCard" class="flex flex-col items-center gap-1.5 mt-4 z-10">
          <div v-if="showEbbinghaus" class="text-xs font-medium flex items-center gap-1.5 px-3 py-1 rounded-full review-ebbinghaus-strip"
            :style="ebbinghausColorStyle">
            <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: ebbinghausColorStyle.color }"></span>
            艾宾浩斯判定：{{ ebbinghausStatus.text }}
          </div>
          <div v-if="!isFlipped" class="text-[11px] review-flip-hint-out flex items-center gap-1">
            <Lightbulb :size="11" /> 点击卡片或按 <span class="font-semibold" :style="{ color: ebbinghausColorStyle.color }">空格键</span> 揭晓答案
          </div>
        </div>

      </main>
    </div>

    <!-- ===== 重置确认弹窗 ===== -->
    <Transition name="reset-fade">
      <div v-if="showResetConfirm" class="fixed inset-0 z-[9999] flex items-center justify-center" @click.self="showResetConfirm = false">
        <div class="review-dialog rounded-2xl p-6 shadow-2xl w-[360px]">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle :size="20" class="text-rose-400" />
            </div>
            <div>
              <h3 class="text-sm font-bold review-dialog-title">重置学习进度</h3>
              <p class="text-xs mt-0.5 review-dialog-desc">此操作不可撤销</p>
            </div>
          </div>
          <p class="text-xs leading-relaxed mb-5 review-dialog-body">
            将重置当前分类下全部 <span class="text-rose-400 font-bold">{{ sessionDeck.length }}</span> 张卡片的学习进度（复习次数、间隔、难度系数），所有卡片将变为新卡片状态重新开始。
          </p>
          <div class="flex gap-2 justify-end">
            <button @click="showResetConfirm = false" class="px-4 py-2 text-xs font-medium rounded-lg transition-colors review-dialog-cancel">取消</button>
            <button @click.stop="confirmResetProgress" class="px-4 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors">确认重置</button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Marked } from 'marked'
import { ArrowLeft, HelpCircle, Link, X, Check, PartyPopper, Zap, Lightbulb, Timer, RotateCcw, Play, Pause, PanelLeftClose, PanelLeftOpen, ChevronRight, Globe, BookOpen, MessageSquare, Camera, Music, Code2, Pen, Mail, Search, MapPin, Calendar, Cloud, ShoppingCart, Video, Bookmark, Terminal, Layers, AlertTriangle } from 'lucide-vue-next'
import { useCardStore } from '../composables/useCardStore'
import { useSettings } from '../composables/useSettings'
import { db } from '../db'
import { usePomodoro } from '../composables/usePomodoro'

const markedInstance = new Marked({ breaks: true, gfm: true })

const iconComponents = { Globe, BookOpen, MessageSquare, Camera, Music, Code2, Pen, Mail, Search, MapPin, Calendar, Cloud, ShoppingCart, Video, Bookmark, Terminal }

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(100,116,139,${alpha})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const router = useRouter()
const { reviewDeck, categories, allCards, initDesktop, updateCard, reviewCard, loadAllCards } = useCardStore()
const { settings } = useSettings()

// ===== 主题 =====
const reviewThemeClass = computed(() => {
  const rt = settings.value.reviewTheme || 'system'
  if (rt === 'light') return 'review-light'
  if (rt === 'dark') return 'review-dark'
  // system: 跟随桌面主题
  return settings.value.theme === 'dark' ? 'review-dark' : 'review-light'
})

const deck = computed(() => reviewDeck.value.length > 0 ? reviewDeck.value : [])

const filteredDeck = computed(() => {
  if (activeCategoryId.value === null) return deck.value
  return deck.value.filter(c => (c.categoryId || 'default') === activeCategoryId.value)
})

function switchCategory(catId) {
  if (activeCategoryId.value === catId) {
    activeCategoryId.value = null
  } else {
    activeCategoryId.value = catId
  }
  currentIndex.value = 0
  isFlipped.value = false
  slideDirection.value = ''
  customWidth.value = null
  customHeight.value = null
  isComplete.value = filteredDeck.value.length === 0
  sessionDeck.value = [...filteredDeck.value]
}

function startSession() {
  let deck = [...filteredDeck.value]
  if (shuffleCards.value) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]
    }
  }
  sessionDeck.value = deck
  currentIndex.value = 0
  isFlipped.value = false
  isComplete.value = false
  slideDirection.value = ''
}

const activeCategoryName = computed(() => {
  if (activeCategoryId.value === null) return '画布卡片复习'
  const group = cardGroups.value.find(g => g.categoryId === activeCategoryId.value)
  return group ? group.name : '画布卡片复习'
})

const currentIndex = ref(0)
const isFlipped = ref(false)
const isComplete = ref(false)
const slideDirection = ref('')
const currentTime = ref('')
const currentDate = ref('')
const sidebarCollapsed = ref(false)
const activeCategoryId = ref(null)
const customWidth = ref(null)
const customHeight = ref(null)
const showResetConfirm = ref(false)
const sessionDeck = ref([])

const {
  pomodoroTotal, pomodoroSeconds, pomodoroRunning, pomodoroDisplay, pomodoroDisplayMini,
  progressPercent, todayCount, totalCount, totalMinutes, loadStats,
  togglePomodoro, resetPomodoro, cleanup: cleanupPomodoro,
} = usePomodoro()

const cardGroups = computed(() => {
  const groupMap = new Map()
  for (const card of deck.value) {
    const catId = card.categoryId || 'default'
    if (!groupMap.has(catId)) {
      const cat = categories.value.find(c => c.id === card.categoryId)
      groupMap.set(catId, {
        categoryId: catId,
        name: cat?.name || '未分类',
        color: card.iconColor || '#64748b',
        iconComp: cat?.iconComp || null,
        remaining: 0,
      })
    }
    groupMap.get(catId).remaining++
  }
  return Array.from(groupMap.values())
})

const currentCard = computed(() => {
  if (currentIndex.value < sessionDeck.value.length) {
    return sessionDeck.value[currentIndex.value]
  }
  return { q: '', a: '', tag: '', source: '', border: '', type: 'qa', iconColor: '', windowWidth: 0, windowHeight: 0 }
})

const cardCategoryInfo = computed(() => {
  const card = currentCard.value
  const color = card.iconColor || '#64748b'
  const cat = categories.value.find(c => c.id === card.categoryId)
  const name = cat?.name || card.tag || '未分类'
  return { color, name }
})

const cardGradientStyle = computed(() => {
  const color = cardCategoryInfo.value.color
  return {
    height: '40px',
    background: `linear-gradient(to bottom, ${hexToRgba(color, 0.32)}, ${hexToRgba(color, 0.08)}, transparent 80%)`,
  }
})

const questionTextStyle = computed(() => ({
  '--ctg-color': cardCategoryInfo.value.color,
}))

const isArticleCard = computed(() => currentCard.value.type === 'article')

const articleHtml = computed(() => {
  if (!isArticleCard.value) return ''
  return markedInstance.parse(currentCard.value.q || '')
})

const questionHtml = computed(() => markedInstance.parse(currentCard.value.q || ''))
const answerHtml = computed(() => markedInstance.parse(currentCard.value.a || '未设置答案'))

const cardSize = computed(() => {
  const w = customWidth.value || currentCard.value.windowWidth || (isArticleCard.value ? 350 : 310)
  const h = customHeight.value || currentCard.value.windowHeight || (isArticleCard.value ? 380 : 220)
  return { width: `${w}px`, height: `${h}px` }
})

const flipContainerClass = computed(() => {
  if (!settings.value.flip3d) return ''
  return isFlipped.value ? 'rotate-y-180' : ''
})

const flipFrontStyle = computed(() => {
  if (settings.value.flip3d) return {}
  return {
    opacity: isFlipped.value ? 0 : 1,
    pointerEvents: isFlipped.value ? 'none' : 'auto',
    transition: `opacity ${settings.value.flipSpeed}ms cubic-bezier(0.4,0,0.2,1)`,
  }
})

const flipBackStyle = computed(() => {
  if (settings.value.flip3d) return {}
  return {
    opacity: isFlipped.value ? 1 : 0,
    pointerEvents: isFlipped.value ? 'auto' : 'none',
    transition: `opacity ${settings.value.flipSpeed}ms cubic-bezier(0.4,0,0.2,1)`,
  }
})

const displaySource = computed(() => {
  try {
    const url = new URL(currentCard.value.source)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return currentCard.value.source
  }
})

const ebbinghausStatus = computed(() => {
  const card = currentCard.value
  if (card.reviewCount === 0 && card.nextReviewAt === 0) return { text: '新卡片', type: 'new' }
  const now = Date.now()
  if (card.nextReviewAt <= now) return { text: '已逾期', type: 'overdue' }
  const diff = card.nextReviewAt - now
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
  if (days <= 0) return { text: '今天到期', type: 'today' }
  return { text: `${days}天后到期`, type: 'pending' }
})

const ebbinghausColorStyle = computed(() => {
  const type = ebbinghausStatus.value.type
  const colors = {
    new: '#60a5fa',      // blue-400
    overdue: '#f87171',  // rose-400
    today: '#fbbf24',    // amber-400
    pending: '#34d399',  // emerald-400
  }
  const color = colors[type] || '#94a3b8'
  return {
    backgroundColor: hexToRgba(color, 0.1),
    color: color,
    borderColor: hexToRgba(color, 0.25),
  }
})

const autoNextCard = computed(() => settings.value.autoNextCard ?? true)
const showEbbinghaus = computed(() => settings.value.showEbbinghaus ?? true)
const shuffleCards = computed(() => settings.value.shuffleCards ?? false)

const forgetLabel = computed(() => '10分钟后重现')

const masterLabel = computed(() => {
  const card = currentCard.value
  let interval
  if (card.reviewCount === 0) interval = 1
  else if (card.reviewCount === 1) interval = 6
  else interval = Math.round((card.interval || 0) * (card.easeFactor || 2.5))
  if (interval <= 0) interval = 1
  return `${interval}天后再次复习`
})

const nextDueInfo = computed(() => {
  const now = Date.now()
  const upcoming = allCards.value
    .filter((c) => (c.type === 'qa' || c.type === 'article') && c.nextReviewAt > now)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
  if (upcoming.length === 0) return null
  const next = upcoming[0]
  const diff = next.nextReviewAt - now
  const minutes = Math.ceil(diff / (60 * 1000))
  if (minutes < 60) return `${minutes} 分钟后`
  const hours = Math.ceil(diff / (60 * 60 * 1000))
  if (hours < 24) return `${hours} 小时后`
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
  return `${days} 天后`
})

const shadow1Class = computed(() => {
  return currentIndex.value > 0 ? 'translate-y-0 scale-100' : 'translate-y-3 scale-96'
})

const shadow2Class = computed(() => {
  if (currentIndex.value >= sessionDeck.value.length - 1) return 'opacity-0 translate-y-6 scale-92'
  return 'translate-y-6 scale-92'
})

function startResize(e) {
  const startX = e.clientX
  const startY = e.clientY
  const startWidth = customWidth.value || currentCard.value.windowWidth || (isArticleCard.value ? 350 : 310)
  const startHeight = customHeight.value || currentCard.value.windowHeight || (isArticleCard.value ? 380 : 220)

  function onMouseMove(e) {
    const newWidth = Math.max(280, Math.min(900, startWidth + (e.clientX - startX)))
    const newHeight = Math.max(200, Math.min(700, startHeight + (e.clientY - startY)))
    customWidth.value = newWidth
    customHeight.value = newHeight
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    if (currentCard.value.id && customWidth.value && customHeight.value) {
      updateCard(currentCard.value.id, { windowWidth: customWidth.value, windowHeight: customHeight.value })
    }
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function flipCurrentCard() {
  if (isComplete.value || isArticleCard.value) return
  isFlipped.value = !isFlipped.value
  if (isFlipped.value && autoNextCard.value && !isArticleCard.value) {
    clearAutoAdvance()
    autoAdvanceTimer = setTimeout(() => {
      if (isFlipped.value && !isComplete.value) handleCardReview('right')
    }, 3000)
  } else if (!isFlipped.value) {
    clearAutoAdvance()
  }
}

let autoAdvanceTimer = null
function clearAutoAdvance() {
  if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null }
}

function handleCardReview(direction) {
  if (isComplete.value) return
  const quality = direction === 'left' ? 0 : 1
  if (currentCard.value.id) reviewCard(currentCard.value.id, quality)
  slideDirection.value = direction === 'left' ? 'slide-left' : 'slide-right'
  setTimeout(() => {
    currentIndex.value++
    if (currentIndex.value < sessionDeck.value.length) {
      isFlipped.value = false
      slideDirection.value = ''
      customWidth.value = null
      customHeight.value = null
    } else {
      isComplete.value = true
    }
  }, 400)
}

async function confirmResetProgress() {
  const targetCards = activeCategoryId.value === null
    ? allCards.value.filter(c => c.type === 'qa' || c.type === 'article')
    : allCards.value.filter(c => (c.categoryId || 'default') === activeCategoryId.value && (c.type === 'qa' || c.type === 'article'))
  const targetIds = targetCards.map(c => c.id).filter(Boolean)
  if (targetIds.length > 0) {
    await db.cards.where('id').anyOf(targetIds.map(Number)).modify({
      reviewCount: 0, interval: 0, easeFactor: 2.5, nextReviewAt: 0,
    })
    await loadAllCards()
  }
  showResetConfirm.value = false
  startSession()
}

function handleKeydown(e) {
  if (isComplete.value) return
  if (e.code === 'Space') { e.preventDefault(); if (!isArticleCard.value) flipCurrentCard() }
  else if (e.key === '1') handleCardReview('left')
  else if (e.key === '2') handleCardReview('right')
}

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekday = weekdays[now.getDay()]
  currentDate.value = `${month}月${day}日 ${weekday}`
}

let clockTimer = null

onMounted(async () => {
  updateTime()
  clockTimer = setInterval(updateTime, 1000)
  window.addEventListener('keydown', handleKeydown)
  await initDesktop()
  await loadStats()
  if (deck.value.length === 0) { isComplete.value = true; return }
  startSession()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (clockTimer) clearInterval(clockTimer)
  cleanupPomodoro()
})
</script>

<style scoped>
/* ================================================================
   REVIEW PAGE — macOS 拟物化设计系统
   两种主题：.review-light  /  .review-dark
   ================================================================ */

/* ----- 公共变量 ----- */
.review-page {
  --review-accent: #6366f1;
  --review-accent-hover: #4f46e5;
  --review-accent-soft: rgba(99, 102, 241, 0.1);
  --review-radius: 14px;
  --review-transition: 0.2s cubic-bezier(0.2, 0, 0, 1);
}

/* ============ 浅色主题 ============ */
.review-light {
  --review-bg: #f1f5f9;
  --review-bg-dot: #cbd5e1;
  /* 顶栏 */
  --review-menubar-bg: rgba(255, 255, 255, 0.55);
  --review-menubar-border: rgba(0, 0, 0, 0.08);
  --review-menubar-text: #334155;
  --review-menubar-muted: #64748b;
  --review-menubar-link: #64748b;
  --review-menubar-link-hover: #1e293b;
  /* 侧边栏 */
  --review-sidebar-bg: rgba(255, 255, 255, 0.35);
  --review-sidebar-border: rgba(0, 0, 0, 0.06);
  --review-sidebar-hd-border: rgba(0, 0, 0, 0.05);
  --review-sidebar-title: #94a3b8;
  --review-sidebar-toggle: #94a3b8;
  --review-sidebar-toggle-hover-bg: rgba(0, 0, 0, 0.06);
  --review-sidebar-toggle-hover-text: #475569;
  --review-sidebar-mini-bg: #94a3b8;
  /* 牌组项 */
  --review-deck-bg: rgba(255, 255, 255, 0.4);
  --review-deck-border: rgba(0, 0, 0, 0.05);
  --review-deck-hover-bg: rgba(255, 255, 255, 0.7);
  --review-deck-active-bg: rgba(99, 102, 241, 0.06);
  --review-deck-active-border: rgba(99, 102, 241, 0.2);
  --review-deck-name: #1e293b;
  --review-deck-meta: #94a3b8;
  --review-deck-arrow: #cbd5e1;
  /* 番茄钟 */
  --review-pomodoro-section-border: rgba(0, 0, 0, 0.05);
  --review-pomodoro-card-bg: rgba(255, 255, 255, 0.5);
  --review-pomodoro-card-border: rgba(0, 0, 0, 0.05);
  --review-pomodoro-hd: #475569;
  --review-pomodoro-stats: #94a3b8;
  --review-pomodoro-time: #334155;
  --review-pomodoro-start-bg: #6366f1;
  --review-pomodoro-start-text: #fff;
  --review-pomodoro-start-hover: #4f46e5;
  --review-pomodoro-reset-bg: #f1f5f9;
  --review-pomodoro-reset-text: #94a3b8;
  --review-pomodoro-reset-hover-bg: #e2e8f0;
  --review-pomodoro-reset-hover-text: #64748b;
  --review-progress-track: #e2e8f0;
  --review-progress-idle: #cbd5e1;
  /* 卡片正面 */
  --review-card-front-bg: #ffffff;
  --review-card-front-border: rgba(0, 0, 0, 0.06);
  --review-card-front-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 2px 0 -1px #fff, 0 4px 4px -2px rgba(0,0,0,0.05), 0 8px 0 -4px #f8fafc, 0 10px 6px -4px rgba(0,0,0,0.04);
  --review-card-front-shadow-hover: 0 1px 3px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08), 0 2px 0 -1px #fff, 0 4px 4px -2px rgba(0,0,0,0.06), 0 8px 0 -4px #f8fafc, 0 10px 6px -4px rgba(0,0,0,0.04);
  --review-card-meta: #94a3b8;
  /* 卡片背面 */
  --review-card-back-bg: #1a2332;
  --review-card-back-border: rgba(0, 0, 0, 0.15);
  --review-card-back-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.2);
  --review-card-back-meta: #788296;
  --review-flip-hint: #94a3b8;
  /* 卡片阴影 */
  --review-card-shadow-bg: rgba(255,255,255,0.4);
  --review-card-shadow-border: rgba(0,0,0,0.04);
  --review-card-shadow-ghost-bg: rgba(255,255,255,0.2);
  /* 评分按钮 */
  --review-rate-forget-bg: rgba(255,255,255,0.5);
  --review-rate-forget-border: rgba(239,68,68,0.15);
  --review-rate-forget-hover-bg: rgba(239,68,68,0.06);
  --review-rate-forget-hover-border: rgba(239,68,68,0.3);
  --review-rate-master-bg: rgba(255,255,255,0.5);
  --review-rate-master-border: rgba(16,185,129,0.15);
  --review-rate-master-hover-bg: rgba(16,185,129,0.06);
  --review-rate-master-hover-border: rgba(16,185,129,0.3);
  --review-rate-label: #94a3b8;
  /* 完成态 */
  --review-complete-bg: rgba(255,255,255,0.4);
  --review-complete-border: rgba(0,0,0,0.04);
  --review-complete-icon-bg: rgba(16,185,129,0.08);
  --review-complete-icon-text: #10b981;
  --review-complete-title: #1e293b;
  --review-complete-desc: #94a3b8;
  /* 弹窗 */
  --review-dialog-bg: rgba(255,255,255,0.92);
  --review-dialog-title: #1e293b;
  --review-dialog-desc: #94a3b8;
  --review-dialog-body: #475569;
  --review-dialog-cancel-bg: #f1f5f9;
  --review-dialog-cancel-text: #64748b;
  --review-dialog-cancel-hover: #e2e8f0;
  /* prose 文字 */
  --review-prose-heading: #1e293b;
  --review-prose-text: #334155;
  --review-prose-code-bg: #f1f5f9;
  --review-prose-code-text: #db2777;
  --review-prose-pre-bg: #0f172a;
  --review-prose-pre-text: #f8fafc;
  --review-prose-strong: #1e293b;
  --review-prose-blockquote-border: #6366f1;
  --review-prose-blockquote-bg: #f8fafc;
  --review-prose-blockquote-text: #475569;
  --review-prose-answer-heading: #cbd5e1;
  --review-prose-answer-text: #94a3b8;
  --review-reset-btn: #94a3b8;
  --review-reset-btn-hover: #ef4444;
  --review-kbd-hints: #cbd5e1;
  --review-kbd-bg: rgba(0,0,0,0.04);
  --review-kbd-border: rgba(0,0,0,0.06);
  --review-kbd-text: #64748b;
}

/* ============ 深色主题 ============ */
.review-dark {
  --review-bg: #0b0f19;
  --review-bg-dot: #1e293b;
  --review-menubar-bg: rgba(15, 23, 42, 0.65);
  --review-menubar-border: rgba(255, 255, 255, 0.06);
  --review-menubar-text: #e2e8f0;
  --review-menubar-muted: #64748b;
  --review-menubar-link: rgba(255,255,255,0.4);
  --review-menubar-link-hover: rgba(255,255,255,0.7);
  --review-sidebar-bg: rgba(15, 23, 42, 0.45);
  --review-sidebar-border: rgba(255, 255, 255, 0.06);
  --review-sidebar-hd-border: rgba(255, 255, 255, 0.06);
  --review-sidebar-title: #64748b;
  --review-sidebar-toggle: #475569;
  --review-sidebar-toggle-hover-bg: rgba(255,255,255,0.08);
  --review-sidebar-toggle-hover-text: #94a3b8;
  --review-sidebar-mini-bg: #475569;
  --review-deck-bg: rgba(30, 41, 59, 0.35);
  --review-deck-border: rgba(255, 255, 255, 0.05);
  --review-deck-hover-bg: rgba(51, 65, 85, 0.5);
  --review-deck-active-bg: rgba(99, 102, 241, 0.1);
  --review-deck-active-border: rgba(99, 102, 241, 0.3);
  --review-deck-name: #e2e8f0;
  --review-deck-meta: #64748b;
  --review-deck-arrow: #334155;
  --review-pomodoro-section-border: rgba(255, 255, 255, 0.06);
  --review-pomodoro-card-bg: rgba(30, 41, 59, 0.5);
  --review-pomodoro-card-border: rgba(255, 255, 255, 0.05);
  --review-pomodoro-hd: #94a3b8;
  --review-pomodoro-stats: #64748b;
  --review-pomodoro-time: #e2e8f0;
  --review-pomodoro-start-bg: #6366f1;
  --review-pomodoro-start-text: #fff;
  --review-pomodoro-start-hover: #4f46e5;
  --review-pomodoro-reset-bg: rgba(71, 85, 105, 0.4);
  --review-pomodoro-reset-text: #64748b;
  --review-pomodoro-reset-hover-bg: rgba(71, 85, 105, 0.6);
  --review-pomodoro-reset-hover-text: #94a3b8;
  --review-progress-track: rgba(255,255,255,0.1);
  --review-progress-idle: #475569;
  --review-card-front-bg: #1e293b;
  --review-card-front-border: rgba(255, 255, 255, 0.06);
  --review-card-front-shadow: 0 1px 3px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.2);
  --review-card-front-shadow-hover: 0 1px 3px rgba(0,0,0,0.2), 0 12px 32px rgba(0,0,0,0.3);
  --review-card-meta: #64748b;
  --review-card-back-bg: #0f172a;
  --review-card-back-border: rgba(255, 255, 255, 0.06);
  --review-card-back-shadow: 0 1px 3px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.3);
  --review-card-back-meta: #64748b;
  --review-flip-hint: #64748b;
  --review-card-shadow-bg: rgba(30,41,59,0.5);
  --review-card-shadow-border: rgba(255,255,255,0.04);
  --review-card-shadow-ghost-bg: rgba(30,41,59,0.25);
  --review-rate-forget-bg: rgba(30,41,59,0.5);
  --review-rate-forget-border: rgba(239,68,68,0.15);
  --review-rate-forget-hover-bg: rgba(239,68,68,0.08);
  --review-rate-forget-hover-border: rgba(239,68,68,0.3);
  --review-rate-master-bg: rgba(30,41,59,0.5);
  --review-rate-master-border: rgba(16,185,129,0.15);
  --review-rate-master-hover-bg: rgba(16,185,129,0.08);
  --review-rate-master-hover-border: rgba(16,185,129,0.3);
  --review-rate-label: #64748b;
  --review-complete-bg: rgba(30,41,59,0.3);
  --review-complete-border: rgba(255,255,255,0.04);
  --review-complete-icon-bg: rgba(16,185,129,0.1);
  --review-complete-icon-text: #10b981;
  --review-complete-title: #e2e8f0;
  --review-complete-desc: #64748b;
  --review-dialog-bg: rgba(15,23,42,0.94);
  --review-dialog-title: #e2e8f0;
  --review-dialog-desc: #64748b;
  --review-dialog-body: #94a3b8;
  --review-dialog-cancel-bg: #1e293b;
  --review-dialog-cancel-text: #94a3b8;
  --review-dialog-cancel-hover: #334155;
  --review-prose-heading: #f1f5f9;
  --review-prose-text: #cbd5e1;
  --review-prose-code-bg: #1e293b;
  --review-prose-code-text: #f8a0c8;
  --review-prose-pre-bg: #0f172a;
  --review-prose-pre-text: #e2e8f0;
  --review-prose-strong: #f1f5f9;
  --review-prose-blockquote-border: #6366f1;
  --review-prose-blockquote-bg: #1e293b;
  --review-prose-blockquote-text: #94a3b8;
  --review-prose-answer-heading: #cbd5e1;
  --review-prose-answer-text: #94a3b8;
  --review-reset-btn: rgba(255,255,255,0.35);
  --review-reset-btn-hover: #f87171;
  --review-kbd-hints: rgba(255,255,255,0.35);
  --review-kbd-bg: rgba(255,255,255,0.08);
  --review-kbd-border: rgba(255,255,255,0.08);
  --review-kbd-text: rgba(255,255,255,0.45);
}

/* ============ 背景（网点纹理） ============ */
.review-page {
  background-color: var(--review-bg);
  background-image: radial-gradient(var(--review-bg-dot) 1px, transparent 1px);
  background-size: 32px 32px;
}

/* ============ 顶栏 — macOS 磨砂玻璃 ============ */
.review-menubar {
  background: var(--review-menubar-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid var(--review-menubar-border);
}

.review-link {
  color: var(--review-menubar-link);
  transition: color var(--review-transition);
}
.review-link:hover { color: var(--review-menubar-link-hover); }

.review-title { color: var(--review-menubar-text); }
.review-counter { color: var(--review-menubar-muted); }
.review-clock { color: var(--review-menubar-text); }

.review-reset-btn {
  color: var(--review-reset-btn);
  transition: color var(--review-transition);
}
.review-reset-btn:hover { color: var(--review-reset-btn-hover); }

.review-kbd-hints { color: var(--review-kbd-hints); }
.review-kbd {
  display: inline-block;
  padding: 1px 5px;
  background: var(--review-kbd-bg);
  border: 1px solid var(--review-kbd-border);
  border-radius: 4px;
  font-family: monospace;
  font-size: 10px;
  color: var(--review-kbd-text);
}

/* ============ 侧边栏 ============ */
.review-sidebar {
  background: var(--review-sidebar-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-color: var(--review-sidebar-border);
}

.review-sidebar-hd { border-color: var(--review-sidebar-hd-border); }

.review-sidebar-title {
  color: var(--review-sidebar-title);
  letter-spacing: 0.05em;
}

.review-sidebar-toggle {
  color: var(--review-sidebar-toggle);
  transition: all var(--review-transition);
}
.review-sidebar-toggle:hover {
  background: var(--review-sidebar-toggle-hover-bg);
  color: var(--review-sidebar-toggle-hover-text);
}

/* 牌组项 */
.review-deck-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--review-deck-bg);
  border: 1px solid var(--review-deck-border);
  border-radius: var(--review-radius);
  cursor: pointer;
  transition: all var(--review-transition);
}
.review-deck-item:hover { background: var(--review-deck-hover-bg); }
.review-deck-active {
  background: var(--review-deck-active-bg);
  border-color: var(--review-deck-active-border);
}

.review-deck-name { color: var(--review-deck-name); }
.review-deck-meta { color: var(--review-deck-meta); }
.review-deck-arrow { color: var(--review-deck-arrow); }

/* 番茄钟 */
.review-pomodoro-section { border-color: var(--review-pomodoro-section-border); }
.review-pomodoro-card {
  background: var(--review-pomodoro-card-bg);
  border-color: var(--review-pomodoro-card-border);
}
.review-pomodoro-hd { color: var(--review-pomodoro-hd); }
.review-pomodoro-stats { color: var(--review-pomodoro-stats); }
.review-pomodoro-time { color: var(--review-pomodoro-time); }

.review-pomodoro-start {
  background: var(--review-pomodoro-start-bg);
  color: var(--review-pomodoro-start-text);
}
.review-pomodoro-start:hover { background: var(--review-pomodoro-start-hover); }

.review-pomodoro-reset {
  background: var(--review-pomodoro-reset-bg);
  color: var(--review-pomodoro-reset-text);
}
.review-pomodoro-reset:hover {
  background: var(--review-pomodoro-reset-hover-bg);
  color: var(--review-pomodoro-reset-hover-text);
}

.review-progress-track { background: var(--review-progress-track); }
.review-progress-idle { background: var(--review-progress-idle); }

/* ============ 卡片正面 — 纸质感 ============ */
.review-card-front {
  background: var(--review-card-front-bg);
  border: 1px solid var(--review-card-front-border);
  box-shadow: var(--review-card-front-shadow);
  transition: box-shadow 0.3s ease;
}
.review-card-front:hover {
  box-shadow: var(--review-card-front-shadow-hover);
}

.review-card-meta { color: var(--review-card-meta); }

/* 分类徽章 — 浮动 pill badge */
.review-category-badge {
  position: absolute;
  top: 18px;
  left: 18px;
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18);
  z-index: 10;
  letter-spacing: 0.02em;
}

/* 卡片外 — 艾宾浩斯状态条 */
.review-ebbinghaus-strip {
  border: 1px solid;
}

/* 卡片外 — 翻转提示 */
.review-flip-hint-out { color: var(--review-flip-hint); }

/* 卡片底部来源链接 */
.review-card-footer-icon {
  opacity: 0.45;
  color: var(--review-card-meta);
}
.review-card-footer-link {
  opacity: 0.55;
  color: var(--review-card-meta);
  text-decoration: none;
  transition: opacity var(--review-transition);
}
.review-card-footer-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* 卡片背面 — 深色恒定 */
.review-card-back {
  background: #1a2332;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.3);
}
.review-card-back-meta { color: #788296; }

/* 卡片层叠阴影 */
.review-card-shadow {
  background: var(--review-card-shadow-bg);
  border: 1px solid var(--review-card-shadow-border);
}
.review-card-shadow-ghost {
  background: var(--review-card-shadow-ghost-bg);
  border: 1px solid var(--review-card-shadow-border);
}

/* ============ 评分按钮 ============ */
.review-rate-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 28px;
  border-radius: 18px;
  border: 1px solid;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.25s cubic-bezier(0.2,0,0,1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  cursor: pointer;
}
.review-rate-btn:active { transform: scale(0.95); }

.review-rate-forget {
  background: var(--review-rate-forget-bg);
  border-color: var(--review-rate-forget-border);
  color: #ef4444;
}
.review-rate-forget:hover {
  background: var(--review-rate-forget-hover-bg);
  border-color: var(--review-rate-forget-hover-border);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.08);
  transform: translateY(-2px);
}

.review-rate-master {
  background: var(--review-rate-master-bg);
  border-color: var(--review-rate-master-border);
  color: #10b981;
}
.review-rate-master:hover {
  background: var(--review-rate-master-hover-bg);
  border-color: var(--review-rate-master-hover-border);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.08);
  transform: translateY(-2px);
}

.review-rate-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}
.review-rate-btn:hover .review-rate-icon { transform: scale(1.1); }

.review-rate-icon-forget { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.review-rate-icon-master { background: rgba(16, 185, 129, 0.12); color: #10b981; }

.review-rate-label { color: var(--review-rate-label); }

/* ============ 完成态 ============ */
.review-complete-bg {
  background: var(--review-complete-bg);
  border: 1px dashed var(--review-complete-border);
}
.review-complete-icon {
  background: var(--review-complete-icon-bg);
  color: var(--review-complete-icon-text);
}
.review-complete-title { color: var(--review-complete-title); }
.review-complete-desc { color: var(--review-complete-desc); }

/* ============ 弹窗 ============ */
.review-dialog {
  background: var(--review-dialog-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.review-dialog-title { color: var(--review-dialog-title); }
.review-dialog-desc { color: var(--review-dialog-desc); }
.review-dialog-body { color: var(--review-dialog-body); }
.review-dialog-cancel {
  background: var(--review-dialog-cancel-bg);
  color: var(--review-dialog-cancel-text);
}
.review-dialog-cancel:hover { background: var(--review-dialog-cancel-hover); }

/* ============ Prose / Markdown ============ */
.review-prose :deep(h1) {
  font-size: 1.5rem; font-weight: 700; color: var(--ctg-color, var(--review-prose-heading)); margin-bottom: 1rem;
  border-bottom: 1px solid var(--review-sidebar-hd-border); padding-bottom: 0.5rem;
}
.review-prose :deep(h2) {
  font-size: 1.25rem; font-weight: 600; color: var(--ctg-color, var(--review-prose-heading)); margin-top: 1.5rem; margin-bottom: 0.75rem;
}
.review-prose :deep(h3) {
  font-size: 1.1rem; font-weight: 600; color: var(--ctg-color, var(--review-prose-text)); margin-top: 1.25rem; margin-bottom: 0.5rem;
}
.review-prose :deep(p) {
  font-size: 1rem; color: var(--ctg-color, var(--review-prose-text)); line-height: 1.7; margin-bottom: 1rem;
}
.review-prose :deep(ul), .review-prose :deep(ol) {
  padding-left: 1.5rem; margin-bottom: 1rem; color: var(--ctg-color, var(--review-prose-text));
}
.review-prose :deep(li) { margin-bottom: 0.25rem; }
.review-prose :deep(code) {
  background: var(--review-prose-code-bg); color: var(--review-prose-code-text);
  padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.875rem;
}
.review-prose :deep(pre) {
  background: var(--review-prose-pre-bg); color: var(--review-prose-pre-text);
  padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 1rem 0;
}
.review-prose :deep(pre code) {
  background: none; color: inherit; padding: 0; font-size: inherit;
}
.review-prose :deep(strong) { color: var(--ctg-color, var(--review-prose-strong)); }
.review-prose :deep(blockquote) {
  border-left: 4px solid var(--review-prose-blockquote-border);
  padding-left: 1rem; color: var(--review-prose-blockquote-text);
  background: var(--review-prose-blockquote-bg);
  padding: 0.5rem 1rem; border-radius: 0 8px 8px 0; margin-bottom: 1rem;
}
.review-prose :deep(a) { color: var(--review-accent); text-decoration: underline; }

/* 背面 prose */
.review-prose-answer :deep(h1),
.review-prose-answer :deep(h2),
.review-prose-answer :deep(h3) { color: var(--ctg-color, #cbd5e1); font-weight: 600; margin-bottom: 0.5rem; }
.review-prose-answer :deep(p) { color: var(--ctg-color, #94a3b8); line-height: 1.7; margin-bottom: 0.5rem; }
.review-prose-answer :deep(ul),
.review-prose-answer :deep(ol) { padding-left: 1.5rem; margin-bottom: 0.5rem; color: var(--ctg-color, #94a3b8); }
.review-prose-answer :deep(code) {
  background: rgba(255,255,255,0.1); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.875rem; color: #cbd5e1;
}
.review-prose-answer :deep(pre) {
  background: rgba(255,255,255,0.08); color: #94a3b8; padding: 1rem; border-radius: 8px; overflow-x: auto;
}
.review-prose-answer :deep(strong) { color: var(--ctg-color, #cbd5e1); }

/* ============ 滚动条 ============ */
.review-scroll::-webkit-scrollbar { width: 5px; }
.review-scroll::-webkit-scrollbar-track { background: transparent; }
.review-scroll::-webkit-scrollbar-thumb {
  background: var(--review-card-meta); opacity: 0.3; border-radius: 10px;
}

/* ============ 拖拽把手 ============ */
.review-resize-handle {
  position: absolute; bottom: 0; right: 0;
  width: 16px; height: 16px; cursor: nwse-resize; z-index: 40;
}
.review-resize-handle::before {
  content: ''; position: absolute; bottom: 4px; right: 4px;
  width: 8px; height: 8px;
  border-right: 1.5px solid var(--review-card-meta);
  border-bottom: 1.5px solid var(--review-card-meta);
}

/* ============ 弹窗过渡动画 ============ */
.reset-fade-enter-active, .reset-fade-leave-active { transition: opacity 0.2s ease; }
.reset-fade-enter-from, .reset-fade-leave-to { opacity: 0; }
</style>
