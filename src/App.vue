<template>
  <router-view />
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useSettings } from './composables/useSettings'

const { settings } = useSettings()

// 应用全局主题到 html 根元素（工作台也统一跟随）
function applyTheme() {
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-dark', 'wb-light', 'wb-dark')
  root.classList.add(`theme-${settings.value.theme}`)
  root.classList.add(`wb-${settings.value.theme}`)
}

onMounted(applyTheme)

watch(
  () => settings.value.theme,
  applyTheme,
  { immediate: true }
)
</script>
