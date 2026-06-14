<template>
  <div
    class="macos-menu fixed z-[9999] py-1 min-w-[180px]"
    :style="{ left: `${x}px`, top: `${y}px` }"
  >
    <template v-for="(item, index) in items" :key="index">
      <div v-if="item.divider" class="menu-divider"></div>
      <button
        v-else
        @click="handleSelect(item.action)"
        :class="['menu-item', { 'menu-item-danger': item.danger }]"
      >
        <span v-if="item.icon" class="menu-icon">{{ item.icon }}</span>
        <span class="menu-label">{{ item.label }}</span>
      </button>
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  items: { type: Array, required: true },
})

const emit = defineEmits(['close', 'select'])

function handleSelect(action) {
  emit('select', action)
  emit('close')
}

function handleClickOutside(e) {
  emit('close')
}

function handleEscape(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
  }, 0)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.macos-menu {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(25px) saturate(190%);
  -webkit-backdrop-filter: blur(25px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 12px;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.08);
  animation: menuAppear 0.15s ease-out;
}

@keyframes menuAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 14px;
  font-size: 12px;
  color: #334155;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.menu-item:hover {
  background: #3b82f6;
  color: white;
}

.menu-item-danger {
  color: #ef4444;
}

.menu-item-danger:hover {
  background: #ef4444;
  color: white;
}

.menu-icon {
  width: 18px;
  text-align: center;
  font-size: 14px;
}

.menu-label {
  flex: 1;
}

.menu-divider {
  height: 0.5px;
  background: rgba(0, 0, 0, 0.08);
  margin: 4px 10px;
}
</style>
