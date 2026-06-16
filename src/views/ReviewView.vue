<template>
  <div class="review-bg h-screen flex flex-col text-slate-200 antialiased overflow-hidden select-none">

    <header class="macos-menubar absolute top-0 left-0 right-0 h-7 flex items-center justify-between px-4 z-50">
      <div class="flex items-center gap-4">
        <router-link to="/" class="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors">
          <ArrowLeft :size="12" />
          <span class="text-xs">返回画布</span>
        </router-link>
        <span class="text-xs font-semibold text-white/90 tracking-tight flex items-center gap-1"><Zap :size="12" class="text-amber-400" /> {{ activeCategoryName }}</span>
        <span class="text-xs text-white/50 font-mono">{{ Math.min(currentIndex + 1, sessionDeck.length) }} / {{ sessionDeck.length }}</span>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="showResetConfirm = true"
          class="text-xs text-white/40 hover:text-rose-400 transition-colors flex items-center gap-1"
          title="重置当前分类所有卡片的学习进度"
        >
          <RotateCcw :size="12" /> 重置进度
        </button>
        <div class="flex items-center gap-1.5 text-[10px] text-white/40">
          <kbd class="px-1 py-0.5 bg-white/10 rounded text-white/50 font-mono">Space</kbd>翻面
          <kbd class="px-1 py-0.5 bg-white/10 rounded text-white/50 font-mono">1</kbd>没记住
          <kbd class="px-1 py-0.5 bg-white/10 rounded text-white/50 font-mono">2</kbd>已掌握
        </div>
        <span class="text-xs text-white/80 font-medium">{{ currentDate }}</span>
        <span class="text-xs text-white/80 font-medium">{{ currentTime }}</span>
      </div>
    </header>

    <div class="flex-1 flex relative overflow-hidden" style="padding-top: 28px;">

      <!-- Sidebar -->
      <aside
        class="sidebar-panel flex flex-col border-r border-slate-800/60 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 ease-in-out z-10 shrink-0"
        :class="sidebarCollapsed ? 'w-12' : 'w-60'"
      >
        <!-- Collapse toggle -->
        <div class="flex items-center justify-between px-2 h-8 border-b border-slate-800/40 shrink-0">
          <button @click="sidebarCollapsed = !sidebarCollapsed" class="w-7 h-6 flex items-center justify-center rounded hover:bg-slate-700/60 transition-colors text-slate-500 hover:text-slate-300">
            <PanelLeftClose v-if="!sidebarCollapsed" :size="14" />
            <PanelLeftOpen v-else :size="14" />
          </button>
          <span v-if="!sidebarCollapsed" class="text-[10px] font-bold text-slate-500 tracking-wider uppercase">复习牌组</span>
        </div>

        <!-- Card groups (visible when expanded) -->
        <div v-if="!sidebarCollapsed" class="flex-1 overflow-y-auto p-2 space-y-2">
          <!-- All cards -->
          <div
            class="bg-slate-800/40 border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-slate-800/60"
            :class="activeCategoryId === null ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-slate-700/30'"
            @click="switchCategory(null)"
          >
            <div class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs shrink-0 bg-indigo-600">
              <Layers :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold text-slate-300 truncate">全部卡片</h3>
              <p class="text-[11px] text-slate-500 font-medium mt-0.5">共 {{ deck.length }} 张</p>
            </div>
            <div v-if="activeCategoryId === null" class="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
              <Check :size="11" class="text-white" />
            </div>
          </div>
          <div
            v-for="group in cardGroups"
            :key="group.categoryId"
            class="bg-slate-800/40 border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-slate-800/60"
            :class="activeCategoryId === group.categoryId ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-slate-700/30'"
            @click="switchCategory(group.categoryId)"
          >
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
              :style="{ backgroundColor: group.color || '#64748b' }"
            >
              <component v-if="group.iconComp && iconComponents[group.iconComp]" :is="iconComponents[group.iconComp]" :size="16" />
              <HelpCircle v-else :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold text-slate-300 truncate">{{ group.name }}</h3>
              <p class="text-[11px] text-slate-500 font-medium mt-0.5">剩余 {{ group.remaining }} 张</p>
            </div>
            <div v-if="activeCategoryId === group.categoryId" class="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
              <Check :size="11" class="text-white" />
            </div>
            <ChevronRight v-else :size="14" class="text-slate-600 shrink-0" />
          </div>
        </div>

        <!-- Collapsed: mini group indicators -->
        <div v-else class="flex-1 overflow-y-auto py-2 flex flex-col items-center gap-2">
          <div
            class="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0 cursor-pointer transition-all"
            :class="activeCategoryId === null ? 'ring-1 ring-indigo-400' : ''"
            :style="{ backgroundColor: activeCategoryId === null ? '#4f46e5' : '#475569' }"
            title="全部卡片"
            @click="switchCategory(null)"
          >
            <Layers :size="10" />
          </div>
          <div
            v-for="group in cardGroups"
            :key="group.categoryId"
            class="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0 cursor-pointer transition-all"
            :class="activeCategoryId === group.categoryId ? 'ring-1 ring-indigo-400 scale-110' : ''"
            :style="{ backgroundColor: group.color || '#64748b' }"
            :title="group.name + ' - 剩余' + group.remaining + '张'"
            @click="switchCategory(group.categoryId)"
          >
            {{ group.remaining }}
          </div>
        </div>

        <!-- Pomodoro timer (always visible) -->
        <div class="shrink-0 border-t border-slate-800/40 transition-all duration-300" :class="sidebarCollapsed ? 'p-1.5' : 'p-3'">
          <div v-if="!sidebarCollapsed" class="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
            <div class="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
              <div class="flex items-center gap-1.5">
                <Timer :size="12" class="text-amber-400" />
                <span>番茄专注钟</span>
              </div>
              <span class="text-[10px] text-slate-500">今日 {{ todayCount }} 个 · 累计 {{ totalMinutes }} 分钟</span>
            </div>
            <!-- Progress bar -->
            <div class="w-full h-1 bg-slate-700/50 rounded-full mb-2 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000 ease-linear"
                :class="pomodoroRunning ? 'bg-amber-400' : 'bg-slate-600'"
                :style="{ width: progressPercent + '%' }"
              />
            </div>
            <div class="font-mono text-xl font-bold text-white tracking-wider mb-2 text-center" :class="{ 'text-amber-400': pomodoroRunning && pomodoroSeconds < 60 }">
              {{ pomodoroDisplay }}
            </div>
            <div class="flex gap-1.5">
              <button
                @click="togglePomodoro"
                class="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                :class="pomodoroRunning ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-indigo-600 text-white hover:bg-indigo-700'"
              >
                {{ pomodoroRunning ? '暂停' : (pomodoroSeconds < POMODORO_TOTAL ? '继续' : '开始专注') }}
              </button>
              <button
                v-if="pomodoroRunning || pomodoroSeconds < POMODORO_TOTAL"
                @click="resetPomodoro"
                class="px-2 py-1.5 bg-slate-700/60 text-slate-400 rounded-lg text-xs hover:bg-slate-700 hover:text-slate-300 transition-colors"
              >
                <RotateCcw :size="12" />
              </button>
            </div>
          </div>

          <!-- Collapsed: mini timer -->
          <div v-else class="flex flex-col items-center gap-1">
            <div class="font-mono text-[10px] font-bold text-center" :class="pomodoroRunning ? 'text-amber-400' : 'text-slate-500'">
              {{ pomodoroDisplayMini }}
            </div>
            <button
              @click="togglePomodoro"
              class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              :class="pomodoroRunning ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-slate-700/60 text-slate-500 hover:text-slate-300'"
            >
              <Pause v-if="pomodoroRunning" :size="10" />
              <Play v-else :size="10" />
            </button>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 flex flex-col items-center justify-center p-6 relative">

        <!-- QA Card (3D flip) -->
        <div v-if="!isComplete && !isArticleCard" class="relative" :style="{ ...cardSize, perspective: settings.flipPerspective + 'px' }">

          <div
            :class="[
              'absolute inset-0 w-full h-full cursor-pointer z-30',
              settings.flip3d ? 'transform-style-3d' : '',
              flipContainerClass,
              slideDirection,
            ]"
            :style="{ transition: `transform ${settings.flipSpeed}ms cubic-bezier(0.4,0,0.2,1)` }"
            @click="flipCurrentCard"
          >
            <div
              :class="[
                'absolute inset-0 bg-slate-900 border border-slate-800 rounded-[10px] p-6 shadow-2xl shadow-black/80 flex flex-col justify-between border-t-5',
                settings.flip3d ? 'backface-hidden' : '',
              ]"
              :style="[currentCard.iconColor ? { borderTopColor: currentCard.iconColor } : {}, flipFrontStyle]"
            >
              <div class="flex-1 flex flex-col overflow-hidden">
                <div class="flex justify-between items-center text-xs text-slate-500 mb-3 shrink-0">
                  <span class="flex items-center gap-1"><HelpCircle :size="14" class="text-blue-400" /> {{ currentCard.tag || '#未归类' }}</span>
                  <span :class="ebbinghausColorClass">艾宾浩斯判定：{{ ebbinghausStatus.text }}</span>
                </div>
                <div class="prose prose-slate prose-invert max-w-none flex-1 overflow-y-auto pr-1 review-scroll" :style="{ '--category-color': currentCard.iconColor || '#cbd5e1' }" v-html="questionHtml"></div>
              </div>
              <div class="text-center text-xs text-slate-500 font-medium animate-bounce pt-3 shrink-0">
                <Lightbulb :size="14" class="inline text-amber-400 align-middle" /> 点击卡片或按 <span class="text-slate-400 font-bold">空格键</span> 揭晓答案
              </div>
            </div>

            <div
              :class="[
                'absolute inset-0 bg-slate-900 border border-slate-800 rounded-[10px] p-6 shadow-2xl shadow-black/80 flex flex-col justify-between border-t-5',
                settings.flip3d ? 'backface-hidden rotate-y-180' : '',
              ]"
              :style="[currentCard.iconColor ? { borderTopColor: currentCard.iconColor } : { borderTopColor: '#10b981' }, flipBackStyle]"
            >
              <div class="flex-1 flex flex-col overflow-hidden">
                <div class="flex justify-between items-center text-xs text-slate-500 mb-3 shrink-0">
                  <span class="flex items-center gap-1"><CheckCircle2 :size="14" class="text-emerald-400" /> ANSWER</span>
                  <span v-if="currentCard.source" class="text-slate-400 flex items-center gap-1"><Link :size="12" /> {{ displaySource }}</span>
                </div>
                <div class="prose-answer max-w-none flex-1 overflow-y-auto pr-1 review-scroll" v-html="answerHtml"></div>
              </div>
              <div class="text-center text-xs text-slate-500 font-medium pt-2 shrink-0">
                再次点击可翻回正面
              </div>
            </div>
          </div>

          <div
            :class="[
              'absolute inset-0 w-full h-full bg-slate-900/60 border border-slate-800/80 rounded-[10px] pointer-events-none transition-all duration-300 shadow-xl z-20',
              shadow1Class,
            ]"
          />
          <div
            :class="[
              'absolute inset-0 w-full h-full bg-slate-900/30 border border-slate-800/40 rounded-[10px] pointer-events-none transition-all duration-300 z-10',
              shadow2Class,
            ]"
          />

          <!-- Drag resize handle -->
          <div class="review-resize-handle" @mousedown.stop="startResize"></div>
        </div>

        <!-- Article Card (no flip, scrollable) -->
        <div v-else-if="!isComplete && isArticleCard" class="relative" :style="cardSize">
          <div
            :class="[
              'absolute inset-0 bg-slate-900 border border-slate-800 rounded-[10px] p-6 shadow-2xl shadow-black/80 flex flex-col border-t-5 transition-transform duration-500',
              slideDirection,
            ]"
            :style="currentCard.iconColor ? { borderTopColor: currentCard.iconColor } : {}"
          >
            <div class="flex justify-between items-center text-xs text-slate-500 mb-4 shrink-0">
              <span class="flex items-center gap-1"><FileText :size="14" class="text-amber-400" /> {{ currentCard.tag || '#未归类' }}</span>
              <span v-if="currentCard.source" class="text-slate-400 flex items-center gap-1"><Link :size="12" /> {{ displaySource }}</span>
            </div>
            <div class="prose prose-slate prose-invert max-w-none text-sm leading-relaxed overflow-y-auto flex-1 pr-2 review-scroll" v-html="articleHtml"></div>
          </div>

          <!-- Drag resize handle -->
          <div class="review-resize-handle" @mousedown.stop="startResize"></div>
        </div>

        <div v-else class="relative w-[440px] h-[300px]">
          <div class="absolute inset-0 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center">
            <div class="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <PartyPopper :size="28" />
            </div>
            <h3 class="text-lg font-bold text-white">太棒了！今日复习已全部完成</h3>
            <p class="text-xs text-slate-500 mt-2">共复习 {{ sessionDeck.length }} 张卡片，知识已入库。<template v-if="nextDueInfo">下一批卡片 {{ nextDueInfo }} 到达。</template></p>
          </div>
        </div>

        <div
          v-if="!isComplete"
          :class="[
            'mt-14 flex items-center gap-6 z-10 transition-all duration-300',
            { 'opacity-0 pointer-events-none': isComplete },
          ]"
        >
          <button
            @click="handleCardReview('left')"
            class="group flex flex-col items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 px-8 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-rose-950/20 active:scale-95"
          >
            <div class="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <X :size="24" />
            </div>
            <span class="text-xs font-bold text-rose-400 tracking-wider">没记住 (1)</span>
            <span class="text-[10px] text-rose-600 font-medium">{{ forgetLabel }}</span>
          </button>

          <button
            @click="handleCardReview('right')"
            class="group flex flex-col items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 px-8 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-emerald-950/20 active:scale-95"
          >
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Check :size="24" />
            </div>
            <span class="text-xs font-bold text-emerald-400 tracking-wider">已掌握 (2)</span>
            <span class="text-[10px] text-emerald-600 font-medium">{{ masterLabel }}</span>
          </button>
        </div>

      </main>
    </div>

    <Transition name="reset-fade">
      <div
        v-if="showResetConfirm"
        class="fixed inset-0 z-[9999] flex items-center justify-center"
        @click.self="showResetConfirm = false"
      >
        <div class="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl w-[360px]">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle :size="20" class="text-rose-400" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">重置学习进度</h3>
              <p class="text-xs text-slate-400 mt-0.5">此操作不可撤销</p>
            </div>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed mb-5">
            将重置当前分类下全部 <span class="text-rose-400 font-bold">{{ sessionDeck.length }}</span> 张卡片的学习进度（复习次数、间隔、难度系数），所有卡片将变为新卡片状态重新开始。
          </p>
          <div class="flex gap-2 justify-end">
            <button
              @click="showResetConfirm = false"
              class="px-4 py-2 text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click.stop="confirmResetProgress"
              class="px-4 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors"
            >
              确认重置
            </button>
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
import { ArrowLeft, HelpCircle, CheckCircle2, Link, X, Check, PartyPopper, Zap, Lightbulb, Timer, RotateCcw, Play, Pause, PanelLeftClose, PanelLeftOpen, ChevronRight, Globe, BookOpen, MessageSquare, Camera, Music, Code2, Pen, Mail, Search, MapPin, Calendar, Cloud, ShoppingCart, Video, Bookmark, Terminal, Layers, FileText, AlertTriangle } from 'lucide-vue-next'
import { useCardStore } from '../composables/useCardStore'
import { useSettings } from '../composables/useSettings'
import { db } from '../db'
import { usePomodoro } from '../composables/usePomodoro'

const markedInstance = new Marked({ breaks: true, gfm: true })

const iconComponents = { Globe, BookOpen, MessageSquare, Camera, Music, Code2, Pen, Mail, Search, MapPin, Calendar, Cloud, ShoppingCart, Video, Bookmark, Terminal }

const router = useRouter()
const { reviewDeck, categories, allCards, initDesktop, updateCard, reviewCard, loadAllCards } = useCardStore()
const { settings } = useSettings()

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
  sessionDeck.value = [...filteredDeck.value]
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
const activeCategoryId = ref(null) // null = 全部
const customWidth = ref(null) // null = use card default
const customHeight = ref(null)
const showResetConfirm = ref(false)
const sessionDeck = ref([])

// Pomodoro - 由 usePomodoro 组合式函数管理
const {
  POMODORO_TOTAL,
  pomodoroSeconds,
  pomodoroRunning,
  pomodoroDisplay,
  pomodoroDisplayMini,
  progressPercent,
  todayCount,
  totalCount,
  totalMinutes,
  loadStats,
  togglePomodoro,
  resetPomodoro,
  cleanup: cleanupPomodoro,
} = usePomodoro()

// Card groups by category (sidebar: always show all categories from full deck)
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

const isArticleCard = computed(() => {
  return currentCard.value.type === 'article'
})

const articleHtml = computed(() => {
  if (!isArticleCard.value) return ''
  return markedInstance.parse(currentCard.value.q || '')
})

const questionHtml = computed(() => {
  return markedInstance.parse(currentCard.value.q || '')
})

const answerHtml = computed(() => {
  return markedInstance.parse(currentCard.value.a || '未设置答案')
})

const cardSize = computed(() => {
  const w = customWidth.value || currentCard.value.windowWidth || (isArticleCard.value ? 350 : 310)
  const h = customHeight.value || currentCard.value.windowHeight || (isArticleCard.value ? 380 : 220)
  return { width: `${w}px`, height: `${h}px` }
})

// 翻转动画样式（连接设置）
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

// 艾宾浩斯判定状态
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

const ebbinghausColorClass = computed(() => {
  const status = ebbinghausStatus.value
  if (status.type === 'new') return 'text-blue-400'
  if (status.type === 'overdue') return 'text-rose-400'
  if (status.type === 'today') return 'text-amber-400'
  return 'text-emerald-400'
})

// 评分按钮动态文本
const forgetLabel = computed(() => {
  return '10分钟后重现'
})

const masterLabel = computed(() => {
  const card = currentCard.value
  // 模拟计算下次间隔
  let interval
  if (card.reviewCount === 0) interval = 1
  else if (card.reviewCount === 1) interval = 6
  else interval = Math.round((card.interval || 0) * (card.easeFactor || 2.5))
  if (interval <= 0) interval = 1
  return `${interval}天后再次复习`
})

// 下一张待复习卡片的倒计时
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
  return currentIndex.value > 0
    ? 'translate-y-0 scale-100'
    : 'translate-y-3 scale-96'
})

const shadow2Class = computed(() => {
  if (currentIndex.value >= sessionDeck.value.length - 1) {
    return 'opacity-0 translate-y-6 scale-92'
  }
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
    // Sync to database
    if (currentCard.value.id && customWidth.value && customHeight.value) {
      updateCard(currentCard.value.id, {
        windowWidth: customWidth.value,
        windowHeight: customHeight.value,
      })
    }
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function flipCurrentCard() {
  if (isComplete.value || isArticleCard.value) return
  isFlipped.value = !isFlipped.value
}

function handleCardReview(direction) {
  if (isComplete.value) return

  const quality = direction === 'left' ? 0 : 1

  if (currentCard.value.id) {
    reviewCard(currentCard.value.id, quality)
  }

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
    await db.cards
      .where('id')
      .anyOf(targetIds.map(Number))
      .modify({
        reviewCount: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewAt: 0,
      })
    await loadAllCards()
  }
  showResetConfirm.value = false
  startSession()
}

function handleKeydown(e) {
  if (isComplete.value) return

  if (e.code === 'Space') {
    e.preventDefault()
    if (!isArticleCard.value) flipCurrentCard()
  } else if (e.key === '1') {
    handleCardReview('left')
  } else if (e.key === '2') {
    handleCardReview('right')
  }
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
  if (deck.value.length === 0) {
    isComplete.value = true
    return
  }
  startSession()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (clockTimer) clearInterval(clockTimer)
  cleanupPomodoro()
})
</script>

<style scoped>
.macos-menubar {
  background: rgba(30, 30, 30, 0.75);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
}

.sidebar-panel {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.3) transparent;
}

/* Markdown prose styles (dark theme) */
.prose :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 1rem;
}

.prose :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.prose :deep(p) {
  font-size: 1rem;
  color: var(--category-color, #cbd5e1);
  line-height: 1.7;
  margin-bottom: 1rem;
}

.prose :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--category-color, #cbd5e1);
}

.prose :deep(pre) {
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.prose :deep(ul), .prose :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
  color: var(--category-color, #cbd5e1);
}

.prose :deep(strong) {
  color: #f1f5f9;
}

/* Answer side styles */
.prose-answer :deep(p) {
  color: #94a3b8;
  line-height: 1.7;
  margin-bottom: 0.5rem;
}

.prose-answer :deep(h1),
.prose-answer :deep(h2),
.prose-answer :deep(h3) {
  color: #cbd5e1;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.prose-answer :deep(ul),
.prose-answer :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
  color: #94a3b8;
}

.prose-answer :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #cbd5e1;
}

.prose-answer :deep(pre) {
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.prose-answer :deep(strong) {
  color: #cbd5e1;
}

/* Scrollbar styles */
.review-scroll::-webkit-scrollbar {
  width: 5px;
}

.review-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.review-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.review-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.35);
}

/* Drag resize handle */
.review-resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 40;
}

.review-resize-handle::before {
  content: '';
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-right: 1.5px solid rgba(255, 255, 255, 0.25);
  border-bottom: 1.5px solid rgba(255, 255, 255, 0.25);
}

.reset-fade-enter-active,
.reset-fade-leave-active {
  transition: opacity 0.2s ease;
}

.reset-fade-enter-from,
.reset-fade-leave-to {
  opacity: 0;
}
</style>
