<template>
  <div
    ref="windowRef"
    :class="[
      'macos-window absolute flex flex-col overflow-hidden',
      isActive ? 'macos-window-active' : 'macos-window-inactive',
      isShaking ? 'shake' : '',
    ]"
    :style="windowStyle"
    @mousedown="handleFocus"
  >
    <div
      v-if="showTitlebar"
      class="macos-titlebar h-[52px] flex items-center px-4 cursor-move select-none shrink-0"
      @mousedown="startDrag"
    >
      <div class="traffic-lights flex items-center gap-2 mr-3">
        <button
          @click.stop="emit('close')"
          class="traffic-light traffic-light-close"
          title="关闭"
        >
          <svg class="traffic-light-icon" viewBox="0 0 12 12">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <button
          @click.stop="emit('minimize')"
          class="traffic-light traffic-light-minimize"
          title="最小化"
        >
          <svg class="traffic-light-icon" viewBox="0 0 12 12">
            <path d="M2 6h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <button
          @click.stop="toggleMaximize"
          class="traffic-light traffic-light-maximize"
          :title="isMaximized ? '恢复' : '最大化'"
        >
          <svg class="traffic-light-icon" viewBox="0 0 12 12">
            <path d="M3 3h6v6H3z" stroke="currentColor" stroke-width="1.2" fill="none"/>
          </svg>
        </button>
      </div>
      
      <div class="flex-1 flex items-center justify-center">
        <span class="text-[13px] font-medium text-slate-700 truncate">{{ title }}</span>
      </div>
      
      <div class="w-[52px]"></div>
    </div>

    <div
      v-if="!showTitlebar"
      :class="['h-6 select-none shrink-0 flex items-center justify-between px-2', dragBarColor, pinned ? 'cursor-default' : 'cursor-move']"
      :style="dragBarStyle"
      @mousedown="startDrag"
    >
      <button
        v-if="pinned || isActive"
        @click.stop="emit('pin-toggle')"
        @mousedown.stop
        :class="[
          'w-6 h-6 flex items-center justify-center transition-colors mt-[10px]',
          darkDragBar
            ? (pinned ? 'text-white/90' : 'text-white/50 hover:text-white/80')
            : (pinned ? 'text-black/70' : 'text-black/40 hover:text-black/70')
        ]"
        :title="pinned ? '取消固定' : '固定'"
      >
        <PinOff v-if="pinned" :size="14" />
        <Pin v-else :size="14" style="transform: rotate(45deg)" />
      </button>
      <div v-else class="w-6 mt-[10px]"></div>
      <div :class="['w-10 h-1 rounded-full', darkDragBar ? 'bg-white/20' : 'bg-black/20']"></div>
      <button
        v-if="isActive"
        @click.stop="emit('close')"
        @mousedown.stop
        :class="['w-6 h-6 flex items-center justify-center transition-colors mt-[10px]', darkDragBar ? 'text-white/40 hover:text-white/70' : 'text-black/30 hover:text-black/60']"
      >
        <X :size="22" />
      </button>
      <div v-else class="w-4"></div>
    </div>

    <div class="flex-1 overflow-hidden">
      <slot />
    </div>

    <div
      v-if="resizable && !isMaximized"
      class="macos-resize-handle"
      @mousedown.stop="startResize"
    ></div>
  </div>
</template>

<script setup>
import { Pin, PinOff, X } from 'lucide-vue-next'
import { ref, computed } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, default: '窗口' },
  x: { type: Number, default: 100 },
  y: { type: Number, default: 100 },
  width: { type: Number, default: 400 },
  height: { type: Number, default: 300 },
  minWidth: { type: Number, default: 280 },
  minHeight: { type: Number, default: 200 },
  maxWidth: { type: Number, default: 1200 },
  maxHeight: { type: Number, default: 9999 },
  resizable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: false },
  showTitlebar: { type: Boolean, default: true },
  dragBarColor: { type: String, default: 'bg-slate-300' },
  dragBarStyle: { type: Object, default: () => ({}) },
  darkDragBar: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
  flipped: { type: Boolean, default: false },
  zIndex: { type: Number, default: 1 },
})

const emit = defineEmits(['close', 'minimize', 'focus', 'update:position', 'update:size', 'dragging', 'drag-end', 'pin-toggle'])

const windowRef = ref(null)
const isDragging = ref(false)
const isResizing = ref(false)
const isMaximized = ref(false)
const isShaking = ref(false)

const currentX = ref(props.x)
const currentY = ref(props.y)
const currentWidth = ref(props.width)
const currentHeight = ref(props.height)

const savedPosition = ref({ x: props.x, y: props.y, width: props.width, height: props.height })

const windowStyle = computed(() => {
  if (isMaximized.value) {
    return {
      left: '0px',
      top: '28px',
      width: '100%',
      height: 'calc(100% - 28px)',
      borderRadius: '0px',
      zIndex: props.zIndex,
    }
  }
  return {
    left: `${currentX.value}px`,
    top: `${currentY.value}px`,
    width: `${currentWidth.value}px`,
    height: `${currentHeight.value}px`,
    borderRadius: '10px',
    zIndex: props.zIndex,
  }
})

function handleFocus() {
  emit('focus', props.id)
}

function startDrag(e) {
  if (isMaximized.value) return
  if (props.pinned) {
    isShaking.value = true
    setTimeout(() => { isShaking.value = false }, 500)
    return
  }
  isDragging.value = true
  const startX = e.clientX - currentX.value
  const startY = e.clientY - currentY.value

  function onMouseMove(e) {
    currentX.value = Math.max(0, Math.min(e.clientX - startX, window.innerWidth - currentWidth.value))
    currentY.value = Math.max(28, e.clientY - startY)
    emit('dragging', e.clientX, e.clientY)
  }

  function onMouseUp(e) {
    isDragging.value = false
    emit('update:position', { x: currentX.value, y: currentY.value })
    emit('drag-end')
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function startResize(e) {
  isResizing.value = true
  const startX = e.clientX
  const startY = e.clientY
  const startWidth = currentWidth.value
  const startHeight = currentHeight.value

  function onMouseMove(e) {
    const newWidth = Math.max(props.minWidth, Math.min(props.maxWidth, startWidth + (e.clientX - startX)))
    const newHeight = Math.max(props.minHeight, Math.min(props.maxHeight, startHeight + (e.clientY - startY)))
    currentWidth.value = newWidth
    currentHeight.value = newHeight
  }

  function onMouseUp() {
    isResizing.value = false
    emit('update:size', { width: currentWidth.value, height: currentHeight.value })
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function toggleMaximize() {
  if (isMaximized.value) {
    currentX.value = savedPosition.value.x
    currentY.value = savedPosition.value.y
    currentWidth.value = savedPosition.value.width
    currentHeight.value = savedPosition.value.height
    isMaximized.value = false
  } else {
    savedPosition.value = {
      x: currentX.value,
      y: currentY.value,
      width: currentWidth.value,
      height: currentHeight.value,
    }
    isMaximized.value = true
  }
}

defineExpose({
  getPosition: () => ({ x: currentX.value, y: currentY.value }),
  getSize: () => ({ width: currentWidth.value, height: currentHeight.value }),
})
</script>

<style scoped>
.macos-window {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  background: rgba(255, 255, 255, 0.99);
  backdrop-filter: blur(30px) saturate(190%);
  -webkit-backdrop-filter: blur(30px) saturate(190%);
  box-shadow: 
    0 22px 70px 4px rgba(0, 0, 0, 0.28),
    0 0 0 0.5px rgba(0, 0, 0, 0.1);
  transition: transform 0.6s ease-in-out, box-shadow 0.2s ease;
}

.macos-window-active {
  box-shadow: 
    0 22px 70px 4px rgba(0, 0, 0, 0.35),
    0 0 0 0.5px rgba(0, 0, 0, 0.15);
}

.macos-window-inactive {
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.15),
    0 0 0 0.5px rgba(0, 0, 0, 0.08);
}

.macos-window-inactive .macos-titlebar {
  background: rgba(246, 246, 246, 0.98);
}

.macos-titlebar {
  background: linear-gradient(180deg, #e8e8e8 0%, #f6f6f6 100%);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px 10px 0 0;
}

.traffic-lights {
  display: flex;
  align-items: center;
  gap: 8px;
}

.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: filter 0.15s ease;
  border: none;
  padding: 0;
}

.traffic-light:hover {
  filter: brightness(0.9);
}

.traffic-light-icon {
  width: 8px;
  height: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.macos-window:hover .traffic-light-icon {
  opacity: 1;
}

.traffic-light-close {
  background: linear-gradient(180deg, #ff6058 0%, #e04038 100%);
  box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.3), 0 0.5px 1px rgba(0, 0, 0, 0.1);
}

.traffic-light-close .traffic-light-icon {
  color: rgba(100, 0, 0, 0.6);
}

.traffic-light-minimize {
  background: linear-gradient(180deg, #ffbe2f 0%, #e0a020 100%);
  box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.3), 0 0.5px 1px rgba(0, 0, 0, 0.1);
}

.traffic-light-minimize .traffic-light-icon {
  color: rgba(100, 60, 0, 0.6);
}

.traffic-light-maximize {
  background: linear-gradient(180deg, #2bc840 0%, #20a830 100%);
  box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.3), 0 0.5px 1px rgba(0, 0, 0, 0.1);
}

.traffic-light-maximize .traffic-light-icon {
  color: rgba(0, 60, 0, 0.6);
}

.macos-resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
}

.macos-resize-handle::before {
  content: '';
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-right: 1.5px solid rgba(0, 0, 0, 0.15);
  border-bottom: 1.5px solid rgba(0, 0, 0, 0.15);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.shake {
  animation: shake 0.5s ease-in-out;
}

.window-perspective {
  perspective: 1200px;
}

.preserve-3d {
  transform-style: preserve-3d;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.backface-hidden {
  backface-visibility: hidden;
}
</style>
