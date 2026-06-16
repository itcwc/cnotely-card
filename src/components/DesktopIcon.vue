<template>
  <div
    ref="iconRef"
    class="macos-icon group flex flex-col items-center justify-center w-[76px] h-[90px] p-1 cursor-pointer select-none"
    :class="{ 'macos-icon-selected': isSelected, 'macos-icon-dragging': isDragging && hasMoved }"
    :style="dragStyle"
    @contextmenu.prevent="emit('contextmenu', app, $event)"
    @pointerdown="startDrag"
  >
    <div class="icon-container mb-1">
      <div
        class="icon-image w-14 h-14 rounded-[14px] flex items-center justify-center shadow-lg transition-all duration-200"
        :style="iconStyle"
      >
        <component v-if="isLucideIcon && lucideIconComp" :is="lucideIconComp" :size="28" class="text-white drop-shadow-sm pointer-events-none" />
        <span v-else-if="isEmoji" class="text-[28px] drop-shadow-sm">{{ app.icon }}</span>
        <img v-else :src="app.icon" :alt="app.name" draggable="false" class="w-9 h-9 object-contain pointer-events-none" />
      </div>
    </div>
    <span class="icon-label text-[11px] font-medium truncate w-full text-center drop-shadow-md px-1">
      {{ app.name }}
    </span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RotateCwSquare } from 'lucide-vue-next'

const lucideIconMap = { RotateCwSquare }

const props = defineProps({
  app: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  gridX: {
    type: Number,
    default: 0,
  },
  gridY: {
    type: Number,
    default: 0,
  },
  layoutMode: {
    type: String,
    default: 'auto',
  },
  isPreview: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click', 'contextmenu', 'drag-move', 'drag-end', 'drag-start', 'dragging', 'reorder', 'reorder-end'])

const iconRef = ref(null)
const isDragging = ref(false)
const hasMoved = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const currentPos = ref({ x: 0, y: 0 })
const initialPos = ref({ x: 0, y: 0 })

const GRID_SIZE = 90
const ICON_WIDTH = 76
const ICON_HEIGHT = 90
const MOVE_THRESHOLD = 5

const isEmoji = computed(() => {
  if (isLucideIcon.value) return false
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  return emojiRegex.test(props.app.icon) || props.app.icon.length <= 2
})

const isLucideIcon = computed(() => {
  return props.app.icon?.startsWith('lucide:')
})

const lucideIconComp = computed(() => {
  if (!isLucideIcon.value) return null
  const name = props.app.icon.replace('lucide:', '')
  return lucideIconMap[name] || null
})

const iconStyle = computed(() => {
  const color = props.app.color || '#64748b'
  return {
    background: color,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  }
})

const positionStyle = computed(() => {
  if (props.layoutMode === 'free') {
    return {
      position: 'absolute',
      left: `${props.gridX * GRID_SIZE}px`,
      top: `${props.gridY * GRID_SIZE}px`,
    }
  }
  return {}
})

const dragStyle = computed(() => {
  if (isDragging.value && hasMoved.value) {
    return {
      position: props.layoutMode === 'free' ? 'absolute' : 'fixed',
      left: `${currentPos.value.x}px`,
      top: `${currentPos.value.y}px`,
      transform: props.layoutMode === 'auto' ? 'scale(1.1)' : '',
      opacity: props.layoutMode === 'auto' ? 0.8 : 1,
      zIndex: 1000,
      pointerEvents: props.layoutMode === 'auto' ? 'none' : 'auto',
    }
  }
  return positionStyle.value
})

function startDrag(e) {
  if (e.button !== 0) return
  hasMoved.value = false
  dragStartPos.value = { x: e.clientX, y: e.clientY }
  
  const isFreeMode = props.layoutMode === 'free'
  
  isDragging.value = true
  
  const startX = props.gridX * GRID_SIZE
  const startY = props.gridY * GRID_SIZE
  
  if (props.layoutMode === 'auto') {
    const rect = iconRef.value?.getBoundingClientRect()
    if (rect) {
      currentPos.value = { x: rect.left, y: rect.top }
      initialPos.value = { x: rect.left, y: rect.top }
    }
  } else {
    currentPos.value = { x: startX, y: startY }
  }

  try {
    iconRef.value?.setPointerCapture(e.pointerId)
  } catch (_) {}

  function onPointerMove(moveEvent) {
    const deltaX = moveEvent.clientX - dragStartPos.value.x
    const deltaY = moveEvent.clientY - dragStartPos.value.y
    
    if (Math.abs(deltaX) > MOVE_THRESHOLD || Math.abs(deltaY) > MOVE_THRESHOLD) {
      hasMoved.value = true
    }
    
    if (hasMoved.value) {
      emit('dragging', moveEvent.clientX, moveEvent.clientY)
    }

    if (hasMoved.value && isFreeMode) {
      currentPos.value = {
        x: startX + deltaX,
        y: startY + deltaY,
      }
    }
    
    if (hasMoved.value && !isFreeMode) {
      currentPos.value = {
        x: initialPos.value.x + deltaX,
        y: initialPos.value.y + deltaY,
      }
      emit('reorder', moveEvent.clientX, moveEvent.clientY)
    }
  }

  function onPointerUp(upEvent) {
    isDragging.value = false

    try {
      iconRef.value?.releasePointerCapture(e.pointerId)
    } catch (_) {}

    if (hasMoved.value && isFreeMode) {
      const gridX = Math.round(currentPos.value.x / GRID_SIZE)
      const gridY = Math.round(currentPos.value.y / GRID_SIZE)
      
      const clampedX = Math.max(0, gridX)
      const clampedY = Math.max(0, gridY)
      
      emit('drag-end', props.app.id, clampedX, clampedY)
    } else if (hasMoved.value && !isFreeMode) {
      emit('reorder-end', upEvent.clientX, upEvent.clientY)
    } else if (!hasMoved.value) {
      emit('click', props.app, upEvent)
    }

    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
  }

  function onPointerCancel() {
    isDragging.value = false
    try {
      iconRef.value?.releasePointerCapture(e.pointerId)
    } catch (_) {}
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
  }

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
  document.addEventListener('pointercancel', onPointerCancel)
}
</script>

<style scoped>
.macos-icon {
  touch-action: none;
  transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.15s, left 0.2s ease, top 0.2s ease;
}

.macos-icon:hover .icon-image {
  transform: scale(1.05);
}

.macos-icon:active .icon-image {
  transform: scale(0.95);
}

.macos-icon-selected {
  background: var(--wb-icon-selected);
  border-radius: 8px;
}

.macos-icon-selected .icon-label {
  background: transparent;
  color: var(--wb-icon-label);
}

.macos-icon-dragging {
  opacity: 0.8;
  z-index: 100;
  cursor: grabbing;
  transition: none;
}

.macos-icon-dragging .icon-image {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.icon-label {
  color: var(--wb-icon-label);
  text-shadow: var(--wb-icon-label-shadow, 0 1px 2px rgba(0, 0, 0, 0.5));
  line-height: 1.4;
  max-height: 28px;
}
</style>
