import { ref, computed, onUnmounted } from 'vue'
import { db } from '../db'

const POMODORO_MINUTES = 25
const POMODORO_TOTAL = POMODORO_MINUTES * 60
const STATS_KEY = 'pomodoroStats'

// 全局单例，跨组件共享
const pomodoroSeconds = ref(POMODORO_TOTAL)
const pomodoroRunning = ref(false)
const todayCount = ref(0)
const totalCount = ref(0)
const totalMinutes = ref(0)
let pomodoroInterval = null

function getTodayStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

async function loadStats() {
  try {
    const row = await db.settings.get(STATS_KEY)
    if (row) {
      const stats = row.value
      // 跨天重置今日计数
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
    // settings 表可能还未创建，忽略
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
  totalMinutes.value += POMODORO_MINUTES
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
    if (pomodoroSeconds.value <= 0) {
      pomodoroSeconds.value = POMODORO_TOTAL
    }
    pomodoroRunning.value = true
    pomodoroInterval = setInterval(tick, 1000)
  }
}

function resetPomodoro() {
  clearInterval(pomodoroInterval)
  pomodoroInterval = null
  pomodoroRunning.value = false
  pomodoroSeconds.value = POMODORO_TOTAL
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
  return Math.round(((POMODORO_TOTAL - pomodoroSeconds.value) / POMODORO_TOTAL) * 100)
})

export function usePomodoro() {
  return {
    POMODORO_TOTAL,
    POMODORO_MINUTES,
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