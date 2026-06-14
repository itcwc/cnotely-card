<template>
  <div class="card-content h-full flex flex-col transition-colors duration-300" :class="isFlipped ? 'bg-slate-900' : cardBgClass" :style="!isFlipped ? cardBgStyle : null">
    <div v-if="card" class="flex-1 flex flex-col overflow-hidden">
      <div v-if="card.type === 'article'" class="flex-1 overflow-y-auto p-4">
        <div class="text-xs mb-2 font-medium" :style="cardTagStyle">{{ card.tag }}</div>
        <div class="prose prose-slate max-w-none" v-html="articleHtml"></div>
      </div>

      <template v-else>
        <div
          class="flex-1 p-4 flex flex-col justify-start overflow-y-auto"
          @click="handleContentClick"
          @scroll="scrollTop = $event.target.scrollTop"
        >
          <div v-if="!isFlipped">
            <div class="text-xs mb-2 font-medium" :style="cardTagStyle">{{ card.tag }}</div>
            <div class="prose prose-slate max-w-none" v-html="questionHtml"></div>
            <div class="mt-3 text-xs opacity-40 flex items-center gap-1">
              <span>点击翻转</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div v-else>
            <div class="text-xs mb-2 font-medium" :style="cardTagStyle">#答案</div>
            <div class="text-base leading-relaxed prose-answer max-w-none" v-html="answerHtml"></div>
            <div class="mt-3 text-xs text-white/40">点击翻回问题</div>
          </div>
        </div>
      </template>

      <div :class="['h-10 flex items-center justify-between px-4 transition-colors duration-300', isFlipped ? 'bg-slate-900' : '']">
        <div :class="['flex items-center gap-2 text-xs', isFlipped ? 'text-slate-400' : 'opacity-60']">
          <span v-if="card.source" class="flex items-center gap-1">
            <Link :size="12" />
            <a :href="card.source" target="_blank" class="hover:text-blue-500 transition-colors truncate max-w-[150px]">{{ displaySource }}</a>
          </span>
        </div>
        <div class="flex items-center gap-1">
          <template v-if="showActions">
            <button
              @click="emit('edit', cardId)"
              :class="['p-1.5 rounded-md transition-colors', isFlipped ? 'text-slate-400 hover:bg-slate-700' : 'opacity-60 hover:bg-black/10']"
            >
              <SquarePen :size="13" />
            </button>
            <button
              @click="emit('delete', cardId)"
              :class="['p-1.5 rounded-md transition-colors', isFlipped ? 'text-rose-400 hover:bg-rose-900/30' : 'text-rose-600 hover:bg-rose-100']"
            >
              <Trash2 :size="13" />
            </button>
          </template>
          <button
            v-else
            @click="showActions = true"
            :class="['p-1.5 rounded-md transition-colors', isFlipped ? 'text-slate-400 hover:bg-slate-700' : 'opacity-40 hover:bg-black/10']"
          >
            <MoreHorizontal :size="14" />
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="flex-1 flex items-center justify-center text-slate-400">
      <p>卡片不存在或已删除</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Link, SquarePen, Trash2, X, MoreHorizontal } from 'lucide-vue-next'
import { Marked } from 'marked'
import { useCardStore } from '../composables/useCardStore'

const props = defineProps({
  cardId: { type: String, required: true },
  isActive: { type: Boolean, default: true },
})

const emit = defineEmits(['edit', 'delete', 'close', 'flip'])

const { allCards } = useCardStore()
const isFlipped = ref(false)
const showActions = ref(false)
const scrollTop = ref(0)
watch(isFlipped, (val) => emit('flip', val), { immediate: true })
watch(() => props.isActive, (val) => { if (!val) showActions.value = false })

function handleContentClick(e) {
  const el = e.currentTarget
  if (Math.abs(el.scrollTop - scrollTop.value) > 5) return
  isFlipped.value = !isFlipped.value
}
const markedInstance = new Marked({ breaks: true, gfm: true })

const card = computed(() => allCards.value.find((c) => c.id === props.cardId))

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-800' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-800' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-800' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-800' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-800' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-800' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-800' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-800' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-800' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-800' },
  lime: { bg: 'bg-lime-50', text: 'text-lime-800' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-800' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-800' },
}

const cardColorKey = computed(() => {
  if (!card.value) return 'emerald'
  const border = card.value.border || ''
  const match = border.match(/border-t-(\w+)-/)
  return match ? match[1] : 'emerald'
})

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return null
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const cardBgStyle = computed(() => {
  if (!card.value || !card.value.iconColor) return null
  const rgba = hexToRgba(card.value.iconColor, 0.1)
  return rgba ? { backgroundColor: rgba } : null
})

const cardBgClass = computed(() => {
  if (cardBgStyle.value) return ''
  const colorKey = cardColorKey.value
  return COLOR_MAP[colorKey]?.bg || 'bg-emerald-50'
})

const cardTagStyle = computed(() => {
  if (!card.value || !card.value.iconColor) return {}  
  return { color: card.value.iconColor }
})

const cardTextClass = computed(() => {
  const colorKey = cardColorKey.value
  return COLOR_MAP[colorKey]?.text || 'text-emerald-800'
})

const articleHtml = computed(() => {
  if (!card.value || card.value.type !== 'article') return ''
  return markedInstance.parse(card.value.q || '')
})

const questionHtml = computed(() => {
  if (!card.value) return ''
  return markedInstance.parse(card.value.q || '')
})

const answerHtml = computed(() => {
  if (!card.value) return ''
  return markedInstance.parse(card.value.a || '未设置答案')
})

const displaySource = computed(() => {
  if (!card.value?.source) return ''
  try {
    const url = new URL(card.value.source)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return card.value.source
  }
})
</script>

<style scoped>
.card-content {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.prose :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 1rem;
}

.prose :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.prose :deep(p) {
  font-size: 1rem;
  color: #424245;
  line-height: 1.7;
  margin-bottom: 1rem;
}

.prose :deep(code) {
  background: #f5f5f7;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #1d1d1f;
}

.prose :deep(pre) {
  background: #1d1d1f;
  color: #f5f5f7;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.prose :deep(ul), .prose :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
  color: #424245;
}

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

.card-content :deep(::-webkit-scrollbar) {
  width: 5px;
}

.card-content :deep(::-webkit-scrollbar-track) {
  background: transparent;
}

.card-content :deep(::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
}

.card-content :deep(::-webkit-scrollbar-thumb:hover) {
  background: rgba(0, 0, 0, 0.25);
}

.card-content.bg-slate-900 :deep(::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.2);
}

.card-content.bg-slate-900 :deep(::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.35);
}
</style>
