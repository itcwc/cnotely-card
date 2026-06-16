import { ref, computed, onUnmounted, watch } from 'vue'
import { db } from '../db'
import { useSettings } from './useSettings'

const STATS_KEY = 'pomodoroStats'

// 全局单例，跨组件共享
const pomodoroSeconds = ref(0)
const pomodoroTotal = ref(25 * 60) // 当前会话总秒数
const pomodoroRunning = ref(false)
const todayCount = ref(0)
const totalCount = ref(0)
const totalMinutes = ref(0)
let pomodoroInterval = null

// 从设置读取时长（分钟），返回 ref
const { settings: pomodoroSettings } = useSettings()
const focusMinutes = computed(() => pomodoroSettings.value.focusDuration || 25)

function getTodayStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

async function loadStats() {
  try {
    const row = await db.settings.get(STATS_KEY)
    if (row) {
      const stats = row.value
      if (stats.todayDate !== getTodayStr()) {
        stats.todayCount = 0
        stats.todayDate = getTodayStr()
        await db.settings.put({ key: STATS_KEY, value: stats })
      }
      todayCount.value = stats.todayCount || 0
      totalCount.value = stats.totalCount || 0
      totalMinutes.value = stats.totalMinutes || 0
    } else {
      todayCount.value = 0
      totalCount.value = 0
      totalMinutes.value = 0
    }
  } catch {
    todayCount.value = 0
    totalCount.value = 0
    totalMinutes.value = 0
  }
}

async function saveStats() {
  const stats = {
    todayCount: todayCount.value,
    totalCount: totalCount.value,
    totalMinutes: totalMinutes.value,
    todayDate: getTodayStr(),
    lastCompletedAt: Date.now(),
  }
  try {
    await db.settings.put({ key: STATS_KEY, value: stats })
  } catch {
    // 静默失败
  }
}

function completeSession() {
  todayCount.value++
  totalCount.value++
  totalMinutes.value += Math.round(pomodoroTotal.value / 60)
  saveStats()
}

function tick() {
  if (pomodoroSeconds.value > 0) {
    pomodoroSeconds.value--
  }
  if (pomodoroSeconds.value <= 0) {
    clearInterval(pomodoroInterval)
    pomodoroInterval = null
    pomodoroRunning.value = false
    completeSession()
  }
}

function togglePomodoro() {
  if (pomodoroRunning.value) {
    clearInterval(pomodoroInterval)
    pomodoroInterval = null
    pomodoroRunning.value = false
  } else {
    // 开始新会话，从设置读取时长
    if (pomodoroSeconds.value <= 0) {
      pomodoroTotal.value = focusMinutes.value * 60
      pomodoroSeconds.value = pomodoroTotal.value
    }
    pomodoroRunning.value = true
    pomodoroInterval = setInterval(tick, 1000)
  }
}

function resetPomodoro() {
  clearInterval(pomodoroInterval)
  pomodoroInterval = null
  pomodoroRunning.value = false
  pomodoroTotal.value = focusMinutes.value * 60
  pomodoroSeconds.value = pomodoroTotal.value
}

function cleanup() {
  clearInterval(pomodoroInterval)
  pomodoroInterval = null
}

const pomodoroDisplay = computed(() => {
  const m = Math.floor(pomodoroSeconds.value / 60)
  const s = pomodoroSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const pomodoroDisplayMini = computed(() => {
  const m = Math.floor(pomodoroSeconds.value / 60)
  const s = pomodoroSeconds.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

const progressPercent = computed(() => {
  if (pomodoroTotal.value === 0) return 0
  return Math.round(((pomodoroTotal.value - pomodoroSeconds.value) / pomodoroTotal.value) * 100)
})

const focusDurationMinutes = computed(() => focusMinutes.value)

export function usePomodoro() {
  return {
    focusDurationMinutes,
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
    cleanup,
  }
}