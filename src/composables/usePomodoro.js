import { ref, computed, onUnmounted, watch } from 'vue'
import { db } from '../db'
import { settingsTable } from '../storage/adapter'
import { useSettings } from './useSettings'

const STATS_KEY = 'pomodoroStats'

// 全局单例，跨组件共享
const pomodoroSeconds = ref(0)
const pomodoroTotal = ref(25 * 60) // 当前会话总秒数
const pomodoroRunning = ref(false)
const pomodoroMode = ref('focus') // 'focus' | 'shortBreak' | 'longBreak'
const sessionCount = ref(0) // 连续完成的 focus 会话数
const todayCount = ref(0)
const totalCount = ref(0)
const totalMinutes = ref(0)
let pomodoroInterval = null

// 从设置读取配置
const { settings: pomodoroSettings } = useSettings()
const focusMinutes = computed(() => pomodoroSettings.value.focusDuration || 25)
const shortBreakMinutes = computed(() => pomodoroSettings.value.shortBreak ?? 5)
const longBreakCycle = computed(() => pomodoroSettings.value.longBreakCycle ?? 4)
const longBreakMinutes = computed(() => pomodoroSettings.value.longBreakDuration ?? 20)
const soundEnabled = computed(() => pomodoroSettings.value.pomodoroSound ?? true)
const notifyEnabled = computed(() => pomodoroSettings.value.desktopNotify ?? true)
const autoStart = computed(() => pomodoroSettings.value.autoStartPomodoro ?? false)

function getTodayStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

async function loadStats() {
  try {
    const row = await settingsTable.get(STATS_KEY)
    if (row) {
      const stats = row.value
      if (stats.todayDate !== getTodayStr()) {
        stats.todayCount = 0
        stats.todayDate = getTodayStr()
        await settingsTable.put({ key: STATS_KEY, value: stats })
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
    await settingsTable.put({ key: STATS_KEY, value: stats })
  } catch {
    // 静默失败
  }
}

// 播放完成提示音
function playSound() {
  if (!soundEnabled.value) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    // AudioContext not available
  }
}

// 显示桌面通知
function showNotification(title, body) {
  if (!notifyEnabled.value) return
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  }
}

function completeSession() {
  if (pomodoroMode.value === 'focus') {
    todayCount.value++
    totalCount.value++
    totalMinutes.value += Math.round(pomodoroTotal.value / 60)
    sessionCount.value++
    saveStats()
    playSound()
    showNotification('🍅 专注完成！', `已完成 ${todayCount.value} 个番茄钟，休息一下吧～`)
  } else {
    playSound()
    const breakType = pomodoroMode.value === 'longBreak' ? '长休息' : '短休息'
    showNotification(`☕ ${breakType}结束`, '准备开始新的番茄钟～')
  }
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
    // 自动开始下一个阶段
    if (autoStart.value) {
      startNextPhase()
    }
  }
}

function startNextPhase() {
  if (pomodoroMode.value === 'focus') {
    // 上次是专注 → 判断是否需要长休息
    if (sessionCount.value > 0 && sessionCount.value % longBreakCycle.value === 0) {
      pomodoroMode.value = 'longBreak'
      pomodoroTotal.value = longBreakMinutes.value * 60
    } else {
      pomodoroMode.value = 'shortBreak'
      pomodoroTotal.value = shortBreakMinutes.value * 60
    }
  } else {
    // 上次是休息 → 开始新的专注
    pomodoroMode.value = 'focus'
    pomodoroTotal.value = focusMinutes.value * 60
  }
  pomodoroSeconds.value = pomodoroTotal.value
  pomodoroRunning.value = true
  pomodoroInterval = setInterval(tick, 1000)
}

function togglePomodoro() {
  if (pomodoroRunning.value) {
    clearInterval(pomodoroInterval)
    pomodoroInterval = null
    pomodoroRunning.value = false
  } else {
    // 开始新会话（如果未设置，默认为专注模式）
    if (pomodoroSeconds.value <= 0) {
      if (pomodoroMode.value !== 'focus' && pomodoroMode.value !== 'shortBreak' && pomodoroMode.value !== 'longBreak') {
        pomodoroMode.value = 'focus'
      }
      startNewSession()
    }
    pomodoroRunning.value = true
    pomodoroInterval = setInterval(tick, 1000)
  }
}

function startNewSession() {
  if (pomodoroMode.value === 'focus') {
    pomodoroTotal.value = focusMinutes.value * 60
  } else if (pomodoroMode.value === 'longBreak') {
    pomodoroTotal.value = longBreakMinutes.value * 60
  } else {
    pomodoroMode.value = 'shortBreak'
    pomodoroTotal.value = shortBreakMinutes.value * 60
  }
  pomodoroSeconds.value = pomodoroTotal.value
}

function resetPomodoro() {
  clearInterval(pomodoroInterval)
  pomodoroInterval = null
  pomodoroRunning.value = false
  pomodoroMode.value = 'focus'
  pomodoroTotal.value = focusMinutes.value * 60
  pomodoroSeconds.value = pomodoroTotal.value
}

// 手动开始休息
function startBreak(type = 'short') {
  clearInterval(pomodoroInterval)
  pomodoroInterval = null
  pomodoroRunning.value = false
  pomodoroMode.value = type === 'long' ? 'longBreak' : 'shortBreak'
  startNewSession()
  pomodoroRunning.value = true
  pomodoroInterval = setInterval(tick, 1000)
}

// 跳过当前休息
function skipBreak() {
  clearInterval(pomodoroInterval)
  pomodoroInterval = null
  pomodoroRunning.value = false
  pomodoroMode.value = 'focus'
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

// 模式标签
const modeLabel = computed(() => {
  if (pomodoroMode.value === 'focus') return '专注'
  if (pomodoroMode.value === 'longBreak') return '长休息'
  return '短休息'
})

// 连续计数 (本次连续完成的番茄数，用于 UI 显示番茄图标)
const streakCount = computed(() => sessionCount.value)

export function usePomodoro() {
  return {
    focusDurationMinutes,
    pomodoroSeconds,
    pomodoroTotal,
    pomodoroRunning,
    pomodoroMode,
    pomodoroDisplay,
    pomodoroDisplayMini,
    progressPercent,
    modeLabel,
    sessionCount,
    streakCount,
    todayCount,
    totalCount,
    totalMinutes,
    loadStats,
    togglePomodoro,
    resetPomodoro,
    startBreak,
    skipBreak,
    cleanup,
  }
}