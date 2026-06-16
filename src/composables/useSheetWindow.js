import { ref, computed } from 'vue'
import { nextZIndex } from './useZIndex'

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'LABEL'])

export function useSheetWindow(options = {}) {
  const {
    defaultWidth = 540,
    defaultHeight = 520,
    minWidth = 360,
    minHeight = 320,
    maxWidth = 900,
    maxHeight = 800,
    id = 'sheet',
  } = options

  const x = ref(Math.round((window.innerWidth - defaultWidth) / 2))
  const y = ref(Math.round((window.innerHeight - defaultHeight) / 2) + 28)
  const width = ref(defaultWidth)
  const height = ref(defaultHeight)
  const zIndex = ref(nextZIndex())
  const isDragging = ref(false)
  const isResizing = ref(false)
  const isMaximized = ref(false)

  const savedState = ref(null)

  const sheetStyle = computed(() => {
    if (isMaximized.value) {
      return {
        position: 'fixed',
        left: '0px',
        top: '0px',
        width: '100vw',
        height: '100vh',
        borderRadius: '0px',
        zIndex: zIndex.value,
      }
    }
    return {
      position: 'fixed',
      left: `${x.value}px`,
      top: `${y.value}px`,
      width: `${width.value}px`,
      height: `${height.value}px`,
      borderRadius: '16px',
      zIndex: zIndex.value,
    }
  })

  function bringToFront(e) {
    if (!e) {
      zIndex.value = nextZIndex()
      return
    }
    const target = e.target
    if (INTERACTIVE_TAGS.has(target.tagName) || target.closest('input, textarea, select, button, a, label, [role="slider"], [role="switch"]')) {
      return
    }
    if (target.closest('.sheet-body, .settings-main, .sheet-content') && target.closest('[class*="scroll"], [class*="resize"], [class*="drag"]')) {
      return
    }
    zIndex.value = nextZIndex()
  }

  function startDrag(e) {
    if (isMaximized.value) return
    if (e.target.closest('button, .sheet-close, .sheet-control-btn')) return
    e.preventDefault()
    bringToFront()
    isDragging.value = true

    const startX = e.clientX - x.value
    const startY = e.clientY - y.value

    function onMouseMove(ev) {
      const nx = ev.clientX - startX
      const ny = ev.clientY - startY
      x.value = Math.max(0, Math.min(nx, window.innerWidth - width.value))
      y.value = Math.max(28, ny)
    }

    function onMouseUp() {
      isDragging.value = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  function startResize(e) {
    e.preventDefault()
    e.stopPropagation()
    bringToFront()
    isResizing.value = true

    const startX = e.clientX
    const startY = e.clientY
    const startW = width.value
    const startH = height.value

    function onMouseMove(ev) {
      width.value = Math.max(minWidth, Math.min(maxWidth, startW + (ev.clientX - startX)))
      height.value = Math.max(minHeight, Math.min(maxHeight, startH + (ev.clientY - startY)))
    }

    function onMouseUp() {
      isResizing.value = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  function toggleMaximize() {
    if (isMaximized.value) {
      if (savedState.value) {
        x.value = savedState.value.x
        y.value = savedState.value.y
        width.value = savedState.value.w
        height.value = savedState.value.h
      }
      isMaximized.value = false
    } else {
      savedState.value = { x: x.value, y: y.value, w: width.value, h: height.value }
      isMaximized.value = true
    }
  }

  function resetPosition() {
    x.value = Math.round((window.innerWidth - defaultWidth) / 2)
    y.value = Math.round((window.innerHeight - defaultHeight) / 2) + 28
    width.value = defaultWidth
    height.value = defaultHeight
    isMaximized.value = false
    bringToFront()
  }

  return {
    sheetStyle,
    x,
    y,
    width,
    height,
    zIndex,
    isDragging,
    isResizing,
    isMaximized,
    bringToFront,
    startDrag,
    startResize,
    toggleMaximize,
    resetPosition,
  }
}
