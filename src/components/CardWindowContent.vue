<template>
  <div
    class="card-content h-full flex flex-col"
    :style="{ perspective: settings.flipPerspective + 'px' }"
    :class="isDark ? 'card-dark' : 'card-light'"
  >
    <!-- 卡片不存在 -->
    <div v-if="!card" class="flex-1 flex items-center justify-center text-slate-400">
      <p>卡片不存在或已删除</p>
    </div>

    <!-- 文章卡（不翻转，纯阅读） -->
    <div v-else-if="card.type === 'article'" class="flex-1 flex flex-col overflow-hidden" :style="cardBgStyle">
      <div class="flex-1 overflow-y-auto p-4">
        <div class="text-xs mb-2 font-medium" :style="cardTagStyle">{{ card.tag }}</div>
        <div class="prose max-w-none" :class="isDark ? 'prose-dark' : 'prose-slate'" v-html="articleHtml"></div>
      </div>
      <div class="h-10 flex items-center justify-between px-4 shrink-0">
        <div class="flex items-center gap-2 text-xs opacity-60">
          <span v-if="card.source" class="flex items-center gap-1">
            <Link :size="12" />
            <a :href="card.source" target="_blank" class="hover:text-blue-500 transition-colors truncate max-w-[150px]">{{ displaySource }}</a>
          </span>
        </div>
        <window-actions :show-actions="showActions" :card-id="cardId" :is-dark="isDark" @toggle="showActions = !showActions" @edit="emit('edit', cardId)" @delete="emit('delete', cardId)" />
      </div>
    </div>

    <!-- 记忆卡：3D 翻转 -->
    <template v-else>
      <div
        class="flip-inner relative w-full flex-1"
        :class="[
          settings.flip3d ? 'transform-style-3d' : '',
          isFlipped ? 'is-flipped' : '',
        ]"
        :style="{ transition: `transform ${settings.flipSpeed}ms cubic-bezier(0.4,0,0.2,1)` }"
      >
        <!-- ====== 正面：问题 ====== -->
        <div
          class="flip-face absolute inset-0 flex flex-col"
          :class="settings.flip3d ? 'backface-hidden' : ''"
          :style="[cardBgStyle, flipFrontStyle]"
        >
          <div class="flex items-center px-4 pt-3 pb-1.5 shrink-0">
            <span class="text-xs font-medium" :style="cardTagStyle">{{ card.tag }}</span>
          </div>
          <div
            class="flex-1 px-4 py-1 overflow-y-auto"
            @click="handleContentClick"
            @scroll="scrollTop = $event.target.scrollTop"
          >
            <div class="prose max-w-none" :class="isDark ? 'prose-dark' : 'prose-slate'" v-html="questionHtml"></div>
          </div>
          <div class="h-10 flex items-center justify-between px-4 shrink-0">
            <div class="flex items-center gap-2 text-xs">
              <span v-if="card.source" class="flex items-center gap-1 opacity-60">
                <Link :size="12" />
                <a :href="card.source" target="_blank" class="hover:text-blue-500 transition-colors truncate max-w-[120px]">{{ displaySource }}</a>
              </span>
              <span :class="isDark ? 'text-slate-400' : 'text-slate-500'" class="flex items-center gap-1">
                <RefreshCw :size="11" /> 点击翻转
              </span>
            </div>
            <window-actions :show-actions="showActions" :card-id="cardId" :is-front="true" :is-dark="isDark" @toggle="showActions = !showActions" @edit="emit('edit', cardId)" @delete="emit('delete', cardId)" />
          </div>
        </div>

        <!-- ====== 背面：答案 ====== -->
        <div
          class="flip-face absolute inset-0 flex flex-col"
          :class="settings.flip3d ? 'backface-hidden rotate-y-180' : ''"
          :style="[flipBackStyle, backFaceStyle]"
        >
          <div class="flex items-center px-4 pt-3 pb-1.5 shrink-0">
            <span class="text-xs font-medium text-emerald-400">#答案</span>
          </div>
          <div
            class="flex-1 px-4 py-1 overflow-y-auto"
            @click="handleContentClick"
            @scroll="scrollTop = $event.target.scrollTop"
          >
            <div class="text-sm leading-relaxed prose-answer max-w-none" v-html="answerHtml"></div>
          </div>
          <div class="h-10 flex items-center justify-between px-4 shrink-0">
            <div class="flex items-center gap-2 text-xs text-slate-300">
              <span v-if="card.source" class="flex items-center gap-1">
                <Link :size="12" />
                <a :href="card.source" target="_blank" class="hover:text-blue-400 transition-colors truncate max-w-[120px]">{{ displaySource }}</a>
              </span>
              <span class="text-slate-400 flex items-center gap-1">
                <RefreshCw :size="11" /> 点击翻回
              </span>
            </div>
            <window-actions :show-actions="showActions" :card-id="cardId" :is-front="false" :is-dark="true" @toggle="showActions = !showActions" @edit="emit('edit', cardId)" @delete="emit('delete', cardId)" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, h } from 'vue'
import { Link, SquarePen, Trash2, MoreHorizontal, RefreshCw } from 'lucide-vue-next'
import { Marked } from 'marked'
import { useCardStore } from '../composables/useCardStore'
import { useSettings } from '../composables/useSettings'

const props = defineProps({
  cardId: { type: String, required: true },
  isActive: { type: Boolean, default: true },
})

const emit = defineEmits(['edit', 'delete', 'close', 'flip'])

const { allCards } = useCardStore()
const { settings } = useSettings()

const isDark = computed(() => settings.value.theme === 'dark')

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

// 扁平模式下的面层样式
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

// 背面统一背景色（通过 CSS 变量保证与主题一致）
const backFaceStyle = computed(() => ({
  backgroundColor: isDark.value ? 'var(--card-back-bg, #1e2636)' : 'var(--card-back-bg, #1a2332)',
}))

// 颜色名称 → 调色板色值（与 DesktopView 保持一致）
const COLOR_PALETTE_MAP = {
  emerald: '#10b981',
  amber:   '#f59e0b',
  purple:  '#8b5cf6',
  rose:    '#f43f5e',
  sky:     '#0ea5e9',
  violet:  '#7c3aed',
  teal:    '#14b8a6',
  orange:  '#f97316',
  cyan:    '#06b6d4',
  pink:    '#ec4899',
  lime:    '#84cc16',
  blue:    '#3b82f6',
  slate:   '#64748b',
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
  if (!card.value) return null
  if (card.value.iconColor) {
    // 有自定义 iconColor：深色模式下稍加强对比
    const alpha = isDark.value ? 0.25 : 0.2
    const rgba = hexToRgba(card.value.iconColor, alpha)
    return rgba ? { backgroundColor: rgba } : null
  }
  // 无 iconColor：用调色板颜色生成统一色调背景
  const hex = COLOR_PALETTE_MAP[cardColorKey.value] || COLOR_PALETTE_MAP.emerald
  const alpha = isDark.value ? 0.18 : 0.12
  const rgba = hexToRgba(hex, alpha)
  return rgba ? { backgroundColor: rgba } : null
})

// cardBgClass 不再使用（已全部走 cardBgStyle inline style）
const cardBgClass = computed(() => '')

const cardTagStyle = computed(() => {
  if (!card.value || !card.value.iconColor) return {}
  return { color: card.value.iconColor }
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

<script>
// 内联窗口操作按钮组件（避免引入额外依赖）
const WindowActions = {
  props: ['showActions', 'cardId', 'isFront', 'isDark'],
  emits: ['toggle', 'edit', 'delete'],
  setup(props, { emit }) {
    return () => {
      // 背面（深色）：亮色图标
      // 正面深色模式：也需要偏亮的图标
      // 正面浅色模式：深色低透明度图标
      const isBack = props.isFront === false
      const dark = isBack || props.isDark

      if (props.showActions) {
        return h('div', { class: 'flex items-center gap-1' }, [
          h('button', {
            class: 'p-1.5 rounded-md transition-colors ' + (dark ? 'text-slate-200 hover:bg-white/10' : 'opacity-60 hover:bg-black/10'),
            onClick: (e) => { e.stopPropagation(); emit('edit') }
          }, [h(SquarePen, { size: 13 })]),
          h('button', {
            class: 'p-1.5 rounded-md transition-colors ' + (dark ? 'text-rose-300 hover:bg-rose-900/30' : 'text-rose-600 hover:bg-rose-100'),
            onClick: (e) => { e.stopPropagation(); emit('delete') }
          }, [h(Trash2, { size: 13 })]),
        ])
      }
      return h('button', {
        class: 'p-1.5 rounded-md transition-colors ' + (dark ? 'text-slate-300 hover:bg-white/10' : 'opacity-40 hover:bg-black/10'),
        onClick: (e) => { e.stopPropagation(); emit('toggle') }
      }, [h(MoreHorizontal, { size: 14 })])
    }
  }
}
</script>

<style scoped>
.card-content {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ===== 3D 翻转核心 ===== */
.flip-inner {
  transform: rotateY(0deg);
}
.flip-inner.transform-style-3d.is-flipped {
  transform: rotateY(180deg);
}

/* ===== 扁平模式：仅容器保持，面层 opacity 切换即可 ===== */
.flip-face {
  /* 两个面层都占满 */
}

/* ===== Markdown 排版（浅色 / 默认）===== */
.prose :deep(h1) {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 0.75rem;
}
.prose :deep(h2) {
  font-size: 1.15rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.prose :deep(p) {
  font-size: 0.95rem;
  color: #424245;
  line-height: 1.65;
  margin-bottom: 0.75rem;
}
.prose :deep(code) {
  background: #f0f0f2;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #1d1d1f;
}
.prose :deep(pre) {
  background: #1d1d1f;
  color: #f5f5f7;
  padding: 0.75rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.8rem;
}
.prose :deep(ul), .prose :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
  color: #424245;
}
.prose :deep(strong) {
  font-weight: 700;
  color: #1d1d1f;
}
.prose :deep(a) {
  color: #2563eb;
}
.prose :deep(blockquote) {
  border-left: 3px solid rgba(0, 0, 0, 0.15);
  padding-left: 0.75rem;
  color: #5a5e64;
  margin-bottom: 0.5rem;
}

/* ===== Markdown 排版（深色）===== */
.prose-dark :deep(h1) {
  font-size: 1.35rem;
  font-weight: 700;
  color: #f0f3f8;
  margin-bottom: 0.75rem;
}
.prose-dark :deep(h2) {
  font-size: 1.15rem;
  font-weight: 600;
  color: #e8ecf2;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.prose-dark :deep(p) {
  font-size: 0.95rem;
  color: #c8d0db;
  line-height: 1.65;
  margin-bottom: 0.75rem;
}
.prose-dark :deep(code) {
  background: rgba(255, 255, 255, 0.12);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #e8ecf2;
}
.prose-dark :deep(pre) {
  background: rgba(0, 0, 0, 0.35);
  color: #d4d9e1;
  padding: 0.75rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.8rem;
}
.prose-dark :deep(ul), .prose-dark :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
  color: #c8d0db;
}
.prose-dark :deep(strong) {
  font-weight: 700;
  color: #f0f3f8;
}
.prose-dark :deep(a) {
  color: #6daffe;
}
.prose-dark :deep(blockquote) {
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  padding-left: 0.75rem;
  color: #a8b2c1;
  margin-bottom: 0.5rem;
}

/* ===== 背面答案样式（深色底，亮色文字确保可读）===== */
.prose-answer :deep(p) {
  color: #dce1e8;
  line-height: 1.7;
  margin-bottom: 0.5rem;
}
.prose-answer :deep(h1),
.prose-answer :deep(h2),
.prose-answer :deep(h3) {
  color: #f0f3f8;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.prose-answer :deep(ul),
.prose-answer :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
  color: #dce1e8;
}
.prose-answer :deep(li) {
  color: #dce1e8;
}
.prose-answer :deep(code) {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #e8ecf2;
}
.prose-answer :deep(pre) {
  background: rgba(255, 255, 255, 0.1);
  color: #d4d9e1;
  padding: 0.75rem;
  border-radius: 8px;
  overflow-x: auto;
}
.prose-answer :deep(strong) {
  color: #f0f3f8;
}
.prose-answer :deep(a) {
  color: #7eb8ff;
}
.prose-answer :deep(blockquote) {
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  padding-left: 0.75rem;
  color: #c4cdd8;
  margin-bottom: 0.5rem;
}
.prose-answer :deep(hr) {
  border-color: rgba(255, 255, 255, 0.1);
  margin: 0.75rem 0;
}

/* ===== 滚动条（浅色）===== */
.card-light :deep(::-webkit-scrollbar) {
  width: 5px;
}
.card-light :deep(::-webkit-scrollbar-track) {
  background: transparent;
}
.card-light :deep(::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
}
.card-light :deep(::-webkit-scrollbar-thumb:hover) {
  background: rgba(0, 0, 0, 0.25);
}

/* ===== 滚动条（深色）===== */
.card-dark :deep(::-webkit-scrollbar) {
  width: 5px;
}
.card-dark :deep(::-webkit-scrollbar-track) {
  background: transparent;
}
.card-dark :deep(::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 10px;
}
.card-dark :deep(::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.22);
}
</style>
