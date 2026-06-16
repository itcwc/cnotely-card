<template>
  <Transition name="editor">
    <div v-if="visible" class="editor-overlay">
      <div :style="{ transformOrigin: editorOrigin }" :class="['editor-sheet', fullscreen ? 'editor-sheet--fullscreen' : '', panel === 'back' ? 'editor-sheet--dark' : '']">

        <header :class="['editor-header', panel === 'back' ? 'editor-header--dark' : '']">
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <button @click="closeEditor" :class="['editor-btn editor-btn--ghost', panel === 'back' ? 'editor-btn--dark' : '']">
              <ChevronLeft :size="16" />
              <span>收起</span>
            </button>
            <hr :class="['editor-divider', panel === 'back' ? 'editor-divider--dark' : '']" />

            <div class="flex items-center gap-2 flex-1 min-w-0">
              <div class="relative" ref="categoryDropdownRef">
                <button
                  @click="showCategoryDropdown = !showCategoryDropdown"
                  :class="['editor-cat-btn', panel === 'back' ? 'editor-cat-btn--dark' : '']"
                >
                  <div v-if="selectedCategoryId" class="editor-cat-icon" :style="{ background: selectedCategoryColor || '#64748b' }">
                    <component v-if="selectedCategoryIcon" :is="selectedCategoryIcon" :size="12" class="text-white" />
                  </div>
                  <span>{{ selectedCategoryLabel }}</span>
                  <ChevronDown :size="10" class="ml-0.5" />
                </button>
                <Tag :size="12" :class="['absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none', panel === 'back' ? 'text-blue-400' : 'text-blue-500']" />
                <div
                  v-if="showCategoryDropdown"
                  :class="['editor-dropdown', panel === 'back' ? 'editor-dropdown--dark' : '']"
                >
                  <button
                    @click="editCategoryId = null; showCategoryDropdown = false"
                    :class="['editor-dropdown-item', panel === 'back' ? 'editor-dropdown-item--dark' : '', editCategoryId === null ? 'editor-dropdown-item--active' : '']"
                  >
                    <div class="editor-cat-icon" :style="{ background: '#C8C9CC' }">
                      <Bookmark :size="12" class="text-white" />
                    </div>
                    <span>未归类</span>
                  </button>
                  <button
                    v-for="cat in categories"
                    :key="cat.id"
                    @click="editCategoryId = cat.id; showCategoryDropdown = false"
                    :class="['editor-dropdown-item', panel === 'back' ? 'editor-dropdown-item--dark' : '', editCategoryId === cat.id ? 'editor-dropdown-item--active' : '']"
                  >
                    <div class="editor-cat-icon" :style="{ background: cat.iconColor || '#64748b' }">
                      <component v-if="cat.iconComp && iconComponents[cat.iconComp]" :is="iconComponents[cat.iconComp]" :size="12" class="text-white" />
                    </div>
                    <span>{{ cat.name }}</span>
                  </button>
                </div>
              </div>
              <div :class="['editor-source-input', panel === 'back' ? 'editor-source-input--dark' : '']">
                <Link :size="12" :class="['shrink-0', panel === 'back' ? 'text-slate-500' : 'text-slate-400']" />
                <input
                  v-model="editSource"
                  type="url"
                  placeholder="输入来源链接..."
                  :class="['flex-1 min-w-0 text-xs font-medium bg-transparent outline-none truncate', panel === 'back' ? 'text-slate-300 placeholder:text-slate-600' : 'text-slate-500 placeholder:text-slate-300']"
                />
                <a v-if="editSource" :href="editSource" target="_blank" :class="['shrink-0 transition-colors', panel === 'back' ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600']" title="在新标签页打开"><ExternalLink :size="12" /></a>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              v-if="cardType !== 'article'"
              @click="panel = panel === 'front' ? 'back' : 'front'"
              :class="['editor-btn editor-btn--panel', panel === 'front' ? '' : 'editor-btn--panel-active']"
            >
              <RotateCw :size="14" />
              <span>{{ panel === 'front' ? '编辑背面' : '编辑正面' }}</span>
            </button>
            <span :class="['text-xs font-mono', panel === 'back' ? 'text-slate-500' : 'text-slate-400']">字数: {{ panel === 'front' ? frontCharCount : backCharCount }}</span>
            <button @click="saveEditor" :class="['editor-btn editor-btn--save', panel === 'back' ? 'editor-btn--save-dark' : '']">
              <Save :size="14" />
              <span>保存</span>
            </button>
            <button @click="fullscreen = !fullscreen" :class="['editor-btn editor-btn--icon', panel === 'back' ? 'editor-btn--dark' : '']" :title="fullscreen ? '退出全屏 (Esc)' : '全屏编辑'">
              <Minimize v-if="fullscreen" :size="16" />
              <Maximize v-else :size="16" />
            </button>
          </div>
        </header>

        <div v-if="panel === 'front'" class="flex-1 flex overflow-hidden">
          <div class="editor-panel-left">
            <div class="editor-panel-titlebar">
              <span class="flex items-center gap-1"><PenLine :size="11" /> 编辑{{ cardType === 'article' ? '内容' : '问题' }}</span>
              <span class="font-mono text-blue-500">markdown</span>
            </div>
            <div class="editor-toolbar">
              <button @click="insertMarkdown('front', 'bold')" title="加粗 (Ctrl+B)" class="editor-tool-btn"><Bold :size="15" /></button>
              <button @click="insertMarkdown('front', 'italic')" title="斜体 (Ctrl+I)" class="editor-tool-btn"><Italic :size="15" /></button>
              <button @click="insertMarkdown('front', 'strikethrough')" title="删除线" class="editor-tool-btn"><Strikethrough :size="15" /></button>
              <button @click="insertMarkdown('front', 'ul')" title="无序列表" class="editor-tool-btn"><List :size="15" /></button>
              <button @click="insertMarkdown('front', 'ol')" title="有序列表" class="editor-tool-btn"><ListOrdered :size="15" /></button>
              <div class="editor-toolbar-sep" />
              <button @click="insertMarkdown('front', 'h1')" title="一级标题" class="editor-tool-btn"><Heading1 :size="15" /></button>
              <button @click="insertMarkdown('front', 'h2')" title="二级标题" class="editor-tool-btn"><Heading2 :size="15" /></button>
              <button @click="insertMarkdown('front', 'h3')" title="三级标题" class="editor-tool-btn"><Heading3 :size="15" /></button>
              <div class="editor-toolbar-sep" />
              <button @click="insertMarkdown('front', 'image')" title="插入图片" class="editor-tool-btn"><ImageIcon :size="15" /></button>
            </div>
            <div class="flex-1 p-5 flex gap-3 font-mono text-sm leading-relaxed overflow-hidden">
              <div class="text-slate-300 text-right select-none pr-1 text-xs pt-0.5">
                <div v-for="n in frontLineCount" :key="n">{{ n }}</div>
              </div>
              <textarea
                ref="frontTextareaRef"
                v-model="editQuestion"
                @scroll="syncFrontScroll"
                class="flex-1 bg-transparent border-none outline-none resize-none text-slate-800 custom-scrollbar overflow-y-auto focus:ring-0 p-0"
              />
            </div>
          </div>

          <div class="editor-panel-right">
            <div class="editor-panel-titlebar">
              <span class="flex items-center gap-1"><Eye :size="11" /> 实时预览</span>
              <span class="text-emerald-500 font-medium flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>渲染中</span>
              </span>
            </div>
            <div
              ref="frontPreviewRef"
              class="flex-1 p-8 overflow-y-auto custom-scrollbar markdown-preview select-text"
              v-html="frontHtml"
            />
          </div>
        </div>

        <div v-else class="flex-1 flex overflow-hidden">
          <div class="editor-panel-left editor-panel-left--dark">
            <div class="editor-panel-titlebar editor-panel-titlebar--dark">
              <span>💡 编辑答案</span>
              <span class="font-mono text-emerald-500">markdown</span>
            </div>
            <div class="editor-toolbar editor-toolbar--dark">
              <button @click="insertMarkdown('back', 'bold')" title="加粗" class="editor-tool-btn editor-tool-btn--dark"><Bold :size="15" /></button>
              <button @click="insertMarkdown('back', 'italic')" title="斜体" class="editor-tool-btn editor-tool-btn--dark"><Italic :size="15" /></button>
              <button @click="insertMarkdown('back', 'strikethrough')" title="删除线" class="editor-tool-btn editor-tool-btn--dark"><Strikethrough :size="15" /></button>
              <div class="editor-toolbar-sep editor-toolbar-sep--dark" />
              <button @click="insertMarkdown('back', 'h1')" title="一级标题" class="editor-tool-btn editor-tool-btn--dark"><Heading1 :size="15" /></button>
              <button @click="insertMarkdown('back', 'h2')" title="二级标题" class="editor-tool-btn editor-tool-btn--dark"><Heading2 :size="15" /></button>
              <button @click="insertMarkdown('back', 'h3')" title="三级标题" class="editor-tool-btn editor-tool-btn--dark"><Heading3 :size="15" /></button>
              <div class="editor-toolbar-sep editor-toolbar-sep--dark" />
              <button @click="insertMarkdown('back', 'image')" title="插入图片" class="editor-tool-btn editor-tool-btn--dark"><ImageIcon :size="15" /></button>
              <div class="editor-toolbar-sep editor-toolbar-sep--dark" />
              <button @click="insertMarkdown('back', 'ul')" title="无序列表" class="editor-tool-btn editor-tool-btn--dark"><List :size="15" /></button>
              <button @click="insertMarkdown('back', 'ol')" title="有序列表" class="editor-tool-btn editor-tool-btn--dark"><ListOrdered :size="15" /></button>
            </div>
            <div class="flex-1 p-5 flex gap-3 font-mono text-sm leading-relaxed overflow-hidden">
              <div class="text-slate-600 text-right select-none pr-1 text-xs pt-0.5">
                <div v-for="n in backLineCount" :key="n">{{ n }}</div>
              </div>
              <textarea
                ref="backTextareaRef"
                v-model="editAnswer"
                @scroll="syncBackScroll"
                class="flex-1 bg-transparent border-none outline-none resize-none text-slate-200 custom-scrollbar overflow-y-auto focus:ring-0 p-0"
              />
            </div>
          </div>

          <div class="editor-panel-right editor-panel-right--dark">
            <div class="editor-panel-titlebar editor-panel-titlebar--dark">
              <span class="flex items-center gap-1"><Eye :size="11" /> 实时预览</span>
              <span class="text-emerald-500 font-medium flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>渲染中</span>
              </span>
            </div>
            <div
              ref="backPreviewRef"
              class="flex-1 p-8 overflow-y-auto custom-scrollbar markdown-preview markdown-preview-dark select-text"
              v-html="backHtml"
            />
          </div>
        </div>

        <footer :class="['editor-footer', panel === 'back' ? 'editor-footer--dark' : '']">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1"><FileText :size="14" /> 语法格式：Markdown</span>
          </div>
          <div class="flex items-center gap-2">
            <span>快捷键：</span>
            <kbd :class="['editor-kbd', panel === 'back' ? 'editor-kbd--dark' : '']">Ctrl + S</kbd> 保存
            <kbd :class="['editor-kbd', panel === 'back' ? 'editor-kbd--dark' : '']">Esc</kbd> <span v-if="fullscreen">退出全屏</span><span v-else>收起</span>
            <kbd v-if="cardType !== 'article'" :class="['editor-kbd', panel === 'back' ? 'editor-kbd--dark' : '']">Tab</kbd>
            <span v-if="cardType !== 'article'">切换面板</span>
          </div>
        </footer>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronDown, Tag, Link, Save, RotateCw, Maximize, Minimize, ExternalLink, FileText, Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, ImageIcon, Eye, PenLine, List, ListOrdered, Globe, BookOpen, MessageSquare, Camera, Music, Code2, Pen, Mail, Search, MapPin, Calendar, Cloud, ShoppingCart, Video, Bookmark, Terminal } from 'lucide-vue-next'
import { Marked } from 'marked'
import { useCardStore } from '../composables/useCardStore'
import { db } from '../db'

const props = defineProps({
  cardId: { type: String, default: null },
})

const emit = defineEmits(['close', 'save'])

const { categories, loadAllCards } = useCardStore()

const iconComponents = { Globe, BookOpen, MessageSquare, Camera, Music, Code2, Pen, Mail, Search, MapPin, Calendar, Cloud, ShoppingCart, Video, Bookmark, Terminal }

const markedInstance = new Marked({ breaks: true, gfm: true })

const visible = ref(false)
const panel = ref('front')
const fullscreen = ref(false)
const editQuestion = ref('')
const editAnswer = ref('')
const editSource = ref('')
const editCategoryId = ref(null)
const cardType = ref('qa')
const editorOrigin = ref('center center')
const showCategoryDropdown = ref(false)
const categoryDropdownRef = ref(null)

const selectedCategoryLabel = computed(() => {
  if (editCategoryId.value === null) return '未归类'
  const cat = categories.value.find((c) => c.id === editCategoryId.value)
  return cat ? cat.name : '未归类'
})

const selectedCategoryId = computed(() => editCategoryId.value)

const selectedCategoryIcon = computed(() => {
  if (editCategoryId.value === null) return null
  const cat = categories.value.find((c) => c.id === editCategoryId.value)
  return cat?.iconComp ? iconComponents[cat.iconComp] : null
})

const selectedCategoryColor = computed(() => {
  if (editCategoryId.value === null) return null
  const cat = categories.value.find((c) => c.id === editCategoryId.value)
  return cat?.iconColor || null
})

const frontTextareaRef = ref(null)
const backTextareaRef = ref(null)
const frontPreviewRef = ref(null)
const backPreviewRef = ref(null)

const frontHtml = computed(() => markedInstance.parse(editQuestion.value || ''))
const backHtml = computed(() => markedInstance.parse(editAnswer.value || ''))

const frontCharCount = computed(() => editQuestion.value.length)
const backCharCount = computed(() => editAnswer.value.length)
const frontLineCount = computed(() => Math.max(editQuestion.value.split('\n').length, 1))
const backLineCount = computed(() => Math.max(editAnswer.value.split('\n').length, 1))

watch(() => props.cardId, async (newId) => {
  if (newId) {
    const card = await db.cards.get(Number(newId))
    if (card) {
      editQuestion.value = card.question || ''
      editAnswer.value = card.answer || ''
      editSource.value = card.source || ''
      editCategoryId.value = card.categoryId || null
      cardType.value = card.type || 'qa'
      panel.value = 'front'
      fullscreen.value = false
      visible.value = true
    }
  } else {
    visible.value = false
  }
}, { immediate: true })

async function saveEditor() {
  if (!props.cardId) return
  await db.cards.update(Number(props.cardId), {
    question: editQuestion.value,
    answer: editAnswer.value,
    source: editSource.value,
    categoryId: editCategoryId.value,
  })
  await loadAllCards()
  emit('save', {
    question: editQuestion.value,
    answer: editAnswer.value,
    source: editSource.value,
    categoryId: editCategoryId.value,
  })
}

async function closeEditor() {
  await saveEditor()
  visible.value = false
  emit('close')
}

function insertMarkdown(targetPanel, type) {
  const source = targetPanel === 'front' ? editQuestion : editAnswer
  const taRef = targetPanel === 'front' ? frontTextareaRef : backTextareaRef
  const ta = taRef.value
  if (!ta) return

  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = source.value.substring(start, end)
  const before = source.value.substring(0, start)
  const after = source.value.substring(end)

  let insert = ''
  let cursorOffset = 0

  switch (type) {
    case 'bold':
      insert = `**${selected || '粗体文本'}**`
      cursorOffset = selected ? insert.length : 2
      break
    case 'italic':
      insert = `*${selected || '斜体文本'}*`
      cursorOffset = selected ? insert.length : 1
      break
    case 'strikethrough':
      insert = `~~${selected || '删除线文本'}~~`
      cursorOffset = selected ? insert.length : 2
      break
    case 'h1':
      insert = `# ${selected || '一级标题'}`
      cursorOffset = selected ? insert.length : 2
      break
    case 'h2':
      insert = `## ${selected || '二级标题'}`
      cursorOffset = selected ? insert.length : 3
      break
    case 'h3':
      insert = `### ${selected || '三级标题'}`
      cursorOffset = selected ? insert.length : 4
      break
    case 'image':
      insert = `![${selected || '图片描述'}](https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder&image_size=landscape_16_9)`
      cursorOffset = selected ? insert.length : 2
      break
    case 'ul':
      insert = `- ${selected || '列表项'}`
      cursorOffset = selected ? insert.length : 2
      break
    case 'ol':
      insert = `1. ${selected || '列表项'}`
      cursorOffset = selected ? insert.length : 3
      break
  }

  const needNewline = ['h1', 'h2', 'h3', 'ul', 'ol'].includes(type) && start > 0 && before[start - 1] !== '\n'
  const prefix = needNewline ? '\n' : ''

  source.value = before + prefix + insert + after

  nextTick(() => {
    const newPos = start + prefix.length + cursorOffset
    ta.focus()
    ta.setSelectionRange(newPos, newPos)
  })
}

function syncFrontScroll() {
  if (frontTextareaRef.value && frontPreviewRef.value) {
    const ratio = frontTextareaRef.value.scrollTop / (frontTextareaRef.value.scrollHeight - frontTextareaRef.value.clientHeight || 1)
    frontPreviewRef.value.scrollTop = ratio * (frontPreviewRef.value.scrollHeight - frontPreviewRef.value.clientHeight)
  }
}

function syncBackScroll() {
  if (backTextareaRef.value && backPreviewRef.value) {
    const ratio = backTextareaRef.value.scrollTop / (backTextareaRef.value.scrollHeight - backTextareaRef.value.clientHeight || 1)
    backPreviewRef.value.scrollTop = ratio * (backPreviewRef.value.scrollHeight - backPreviewRef.value.clientHeight)
  }
}

function handleKeydown(e) {
  if (!visible.value) return
  if (e.key === 'Escape') {
    if (fullscreen.value) {
      fullscreen.value = false
    } else {
      closeEditor()
    }
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveEditor()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault()
    insertMarkdown(panel.value, 'bold')
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault()
    insertMarkdown(panel.value, 'italic')
    return
  }
  if (e.key === 'Tab' && !e.shiftKey && cardType.value !== 'article') {
    const ta = panel.value === 'front' ? frontTextareaRef.value : backTextareaRef.value
    if (document.activeElement !== ta) {
      e.preventDefault()
      panel.value = panel.value === 'front' ? 'back' : 'front'
    }
  }
}

function handleClickOutside(e) {
  if (categoryDropdownRef.value && !categoryDropdownRef.value.contains(e.target)) {
    showCategoryDropdown.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside, true)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<style scoped>
/* ===== 遮罩层 ===== */
.editor-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* ===== 主体弹窗 ===== */
.editor-sheet {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.15s ease;
  width: 94vw;
  height: 90vh;
  border-radius: 16px;
  /* 亮色版磨砂玻璃 */
  background: var(--editor-main);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--border-subtle);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04),
    inset 0 -0.5px 0 rgba(0, 0, 0, 0.03);
}

.editor-sheet--fullscreen {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

/* 暗色版主体 */
.editor-sheet--dark {
  background: var(--editor-dark-main);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.2),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.05),
    inset 0 -0.5px 0 rgba(0, 0, 0, 0.2);
}

/* ===== Header ===== */
.editor-header {
  height: 56px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  shrink: 0;
  border-bottom: 0.5px solid var(--border-subtle);
  background: var(--editor-header);
}

.editor-header--dark {
  border-bottom-color: rgba(255, 255, 255, 0.06);
  background: var(--editor-dark-header);
}

/* ===== 按钮（通用） ===== */
.editor-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s ease;
  cursor: pointer;
  border: none;
  outline: none;
  background: transparent;
}

/* 幽灵按钮（收起、全屏等） */
.editor-btn--ghost {
  color: #5a5e64;
}
.editor-btn--ghost:hover {
  color: #1a1a2e;
  background: rgba(0, 0, 0, 0.04);
}

.editor-btn--dark {
  color: #94a3b8;
}
.editor-btn--dark:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.08);
}

/* 面板切换按钮 */
.editor-btn--panel {
  background: rgba(0, 0, 0, 0.05);
  color: #424245;
}
.editor-btn--panel:hover {
  background: rgba(0, 0, 0, 0.08);
}
.editor-btn--panel-active {
  background: #2563eb;
  color: #ffffff;
}
.editor-btn--panel-active:hover {
  background: #1d4ed8;
}

/* 保存按钮 */
.editor-btn--save {
  background: #1a1a2e;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.editor-btn--save:hover {
  background: #0f172a;
}
.editor-btn--save-dark {
  background: #059669;
}
.editor-btn--save-dark:hover {
  background: #047857;
}

/* 图标按钮 */
.editor-btn--icon {
  padding: 6px;
}

/* ===== 分隔线 ===== */
.editor-divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
}
.editor-divider--dark {
  background: rgba(255, 255, 255, 0.1);
}

/* ===== 分类下拉按钮 ===== */
.editor-cat-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 16px 4px 28px;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  border: none;
  background: rgba(59, 130, 246, 0.08);
  color: #1d4ed8;
  transition: all 0.15s ease;
}
.editor-cat-btn:hover {
  background: rgba(59, 130, 246, 0.14);
}
.editor-cat-btn--dark {
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
}
.editor-cat-btn--dark:hover {
  background: rgba(59, 130, 246, 0.2);
}

/* ===== 分类下拉菜单 ===== */
.editor-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  padding: 4px;
  border-radius: 12px;
  z-index: 50;
  min-width: 140px;
  /* 磨砂浮层 */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.04);
}
.editor-dropdown--dark {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.2);
}

.editor-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 6px 12px;
  font-size: 12px;
  color: #4e535c;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}
.editor-dropdown-item:hover {
  background: rgba(0, 0, 0, 0.04);
}
.editor-dropdown-item--active {
  background: rgba(59, 130, 246, 0.08);
  color: #1d4ed8;
}
.editor-dropdown-item--dark {
  color: #cbd5e1;
}
.editor-dropdown-item--dark:hover {
  background: rgba(255, 255, 255, 0.06);
}
.editor-dropdown-item--dark.editor-dropdown-item--active {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
}

/* ===== 来源链接输入区 ===== */
.editor-source-input {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  flex: 1;
  min-width: 0;
  max-width: 320px;
  background: rgba(0, 0, 0, 0.03);
  transition: all 0.15s ease;
}
.editor-source-input:focus-within {
  background: rgba(0, 0, 0, 0.05);
}
.editor-source-input--dark {
  background: rgba(255, 255, 255, 0.05);
}
.editor-source-input--dark:focus-within {
  background: rgba(255, 255, 255, 0.08);
}

/* ===== 左侧面板（编辑器） ===== */
.editor-panel-left {
  width: 50%;
  border-right: 0.5px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  background: var(--editor-panel);
}
.editor-panel-left--dark {
  border-right-color: rgba(255, 255, 255, 0.06);
  background: var(--editor-dark-panel);
}

/* ===== 右侧面板（预览区） ===== */
.editor-panel-right {
  width: 50%;
  display: flex;
  flex-direction: column;
  background: var(--editor-panel2);
}
.editor-panel-right--dark {
  background: var(--editor-dark-panel2);
}

/* ===== 标题栏 ===== */
.editor-panel-titlebar {
  height: 32px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 0.5px solid var(--border-subtle);
  background: var(--editor-titlebar);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-transform: uppercase;
}
.editor-panel-titlebar--dark {
  border-bottom-color: rgba(255, 255, 255, 0.06);
  background: var(--editor-dark-titlebar);
  color: #64748b;
}

/* ===== 工具栏 ===== */
.editor-toolbar {
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 2px;
  border-bottom: 0.5px solid var(--border-subtle);
  background: var(--editor-toolbar);
}
.editor-toolbar--dark {
  border-bottom-color: rgba(255, 255, 255, 0.06);
  background: var(--editor-dark-toolbar);
}

/* 工具栏按钮 */
.editor-tool-btn {
  padding: 5px;
  border-radius: 6px;
  color: #94a3b8;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.editor-tool-btn:hover {
  color: #374151;
  background: rgba(0, 0, 0, 0.04);
}
.editor-tool-btn--dark {
  color: #64748b;
}
.editor-tool-btn--dark:hover {
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.06);
}

/* 工具栏分隔线 */
.editor-toolbar-sep {
  width: 1px;
  height: 16px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 6px;
}
.editor-toolbar-sep--dark {
  background: rgba(255, 255, 255, 0.08);
}

/* ===== Footer ===== */
.editor-footer {
  height: 36px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  shrink: 0;
  border-top: 0.5px solid var(--border-subtle);
  background: var(--editor-footer);
  color: var(--text-muted);
}
.editor-footer--dark {
  border-top-color: rgba(255, 255, 255, 0.06);
  background: var(--editor-dark-footer);
  color: #64748b;
}

/* ===== kbd 快捷键 ===== */
.editor-kbd {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.03);
  color: #4e535c;
  border: none;
  line-height: 1.4;
}
.editor-kbd--dark {
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
}

/* ===== 分类图标 ===== */
.editor-cat-icon {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ===== 过渡动画 ===== */
.editor-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.editor-enter-active > div {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.editor-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}
.editor-leave-active > div {
  transition: transform 0.3s cubic-bezier(0.4, 0, 1, 1), border-radius 0.3s cubic-bezier(0.4, 0, 1, 1);
}
.editor-enter-from {
  opacity: 0;
}
.editor-enter-from > div {
  transform: scale(0.15);
  border-radius: 12px;
}
.editor-leave-to {
  opacity: 0;
}
.editor-leave-to > div {
  transform: scale(0.15);
  border-radius: 12px;
}
</style>
