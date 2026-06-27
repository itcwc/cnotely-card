<template>
  <div
    ref="sheetRef"
    :style="sheetStyle"
    class="settings-window overflow-hidden flex flex-col"
    @mousedown="bringToFront"
  >
    <div class="sheet-header" @mousedown="startDrag">
      <div class="sheet-title-group">
        <div
          class="sheet-title-icon"
          style="background: linear-gradient(135deg, #3b82f6, #8b5cf6)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path
              d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.72v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div class="sheet-title-text">
          <h2>{{ $t('settings.title') }}</h2>
          <span>SETTINGS</span>
        </div>
      </div>
      <div class="sheet-drag-bar w-10"></div>
      <div class="sheet-controls">
        <button
          @click="toggleMaximize"
          class="sheet-control-btn"
          :title="$t('common.maximizeRestore')"
        >
          <Maximize v-if="!isMaximized" :size="14" />
          <Minimize2 v-else :size="14" />
        </button>
        <button @click="$emit('close')" class="sheet-close" :title="$t('common.close')">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 左侧导航 + 右侧面板 -->
    <div class="flex flex-1 overflow-hidden">
      <nav
        class="w-52 shrink-0 py-5 px-3 border-r border-white/20 flex flex-col settings-sidebar"
      >
        <div class="space-y-0.5">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['sidebar-item', { active: activeTab === tab.id }]"
          >
            <component :is="tab.icon" :size="16" />
            {{ tab.label }}
          </button>
        </div>
        <div class="mt-auto pt-4 border-t border-black/5 px-3">
          <p class="text-[10px] text-slate-500">cnotely v0.2.0</p>
        </div>
      </nav>

      <!-- 右侧面板 -->
      <main class="flex-1 overflow-y-auto settings-main">
        <!-- ====== 外观 ====== -->
        <template v-if="activeTab === 'appearance'">
          <div class="panel-header">
            <h2>{{ $t('settings.appearance.title') }}</h2>
            <p>{{ $t('settings.appearance.desc') }}</p>
          </div>

          <div class="setting-group-title">{{ $t('settings.appearance.wallpaper') }}</div>
            <div class="setting-row">
              <div>
                <p class="setting-label">{{ $t('settings.appearance.desktopWallpaper') }}</p>
                <p class="setting-desc">{{ $t('settings.appearance.wallpaperDesc') }}</p>
              </div>
              <div class="flex gap-2 items-center">
                <img
                  v-for="(wp, i) in wallpapers"
                  :key="i"
                  :src="wp.url"
                  :title="wp.title"
                  :class="[
                    'wallpaper-thumb',
                    { selected: selectedWallpaper === i },
                  ]"
                  @click="selectedWallpaper = i"
                />
                <label
                  class="wallpaper-thumb bg-slate-100 flex items-center justify-center cursor-pointer text-slate-500 font-bold text-lg"
                  :title="$t('settings.appearance.customUpload')"
                  @click="handleCustomWallpaper"
                >
                  ＋
                </label>
                <input
                  ref="wallpaperInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onWallpaperUpload"
                />
              </div>
            </div>

          <div class="setting-group-title">{{ $t('settings.appearance.transparency') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.appearance.blurStrength') }}</p>
              <p class="setting-desc">{{ $t('settings.appearance.blurDesc') }}</p>
            </div>
            <div class="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="50"
                v-model="blurStrength"
                class="range-slider"
                style="width: 140px"
              />
              <span class="text-xs text-slate-500 font-mono w-10 text-right"
                >{{ blurStrength }}px</span
              >
            </div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.appearance.barOpacity') }}</p>
              <p class="setting-desc">{{ $t('settings.appearance.barOpacityDesc') }}</p>
            </div>
            <div class="flex items-center gap-3">
              <input
                type="range"
                min="30"
                max="90"
                v-model="barOpacity"
                class="range-slider"
                style="width: 140px"
              />
              <span class="text-xs text-slate-500 font-mono w-10 text-right"
                >{{ barOpacity }}%</span
              >
            </div>
          </div>

          <div class="setting-group-title">{{ $t('settings.appearance.theme') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.appearance.themeLabel') }}</p>
              <p class="setting-desc">{{ $t('settings.appearance.themeDesc') }}</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="t in themeOptions"
                :key="t.value"
                :class="['segmented-btn', { active: globalTheme === t.value }]"
                @click="globalTheme = t.value"
              >
                {{ t.label }}
              </button>
            </div>
          </div>

          <div class="setting-group-title">{{ $t('settings.appearance.reduceMotion') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.appearance.reduceMotionLabel') }}</p>
              <p class="setting-desc">{{ $t('settings.appearance.reduceMotionDesc') }}</p>
            </div>
            <div
              :class="['toggle-switch', { active: reduceMotion }]"
              @click="reduceMotion = !reduceMotion"
            ></div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.appearance.dockZoom') }}</p>
              <p class="setting-desc">{{ $t('settings.appearance.dockZoomDesc') }}</p>
            </div>
            <div
              :class="['toggle-switch', { active: dockZoom }]"
              @click="dockZoom = !dockZoom"
            ></div>
          </div>
        </template>

        <!-- ====== 桌面 ====== -->
        <template v-if="activeTab === 'desktop'">
          <div class="panel-header">
            <h2>{{ $t('settings.tabs.desktop') }}</h2>
            <p>{{ $t('settings.desktop.desc') }}</p>
          </div>

          <div class="setting-group-title">{{ $t('settings.desktop.layout') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.desktop.layoutDesc') }}</p>
              <p class="setting-desc">{{ $t('settings.desktop.autoLayout') }}</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="opt in layoutOptions"
                :key="opt.value"
                :class="['segmented-btn', { active: layoutMode === opt.value }]"
                @click="layoutMode = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>


          <div class="setting-group-title">{{ $t('settings.desktop.iconGap') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.desktop.iconGap') }}</p>
              <p class="setting-desc">{{ $t('settings.desktop.iconGapDesc') }}</p>
            </div>
            <div class="flex items-center gap-3">
              <input
                type="range"
                min="60"
                max="140"
                step="10"
                v-model="iconGap"
                class="range-slider"
                style="width: 140px"
              />
              <span class="text-xs text-slate-500 font-mono w-10 text-right"
                >{{ iconGap }}px</span
              >
            </div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.desktop.showLabels') }}</p>
              <p class="setting-desc">{{ $t('settings.desktop.showLabelsDesc') }}</p>
            </div>
            <div
              :class="['toggle-switch', { active: showIconLabels }]"
              @click="showIconLabels = !showIconLabels"
            ></div>
          </div>

          <div class="setting-group-title">{{ $t('settings.desktop.trashDirectDelete') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.desktop.trashDirectDelete') }}</p>
              <p class="setting-desc">{{ $t('settings.desktop.trashDirectDeleteDesc') }}</p>
            </div>
            <div
              :class="['toggle-switch', { active: trashDirectDelete }]"
              @click="trashDirectDelete = !trashDirectDelete"
            ></div>
          </div>
        </template>

        <!-- ====== 卡片 ====== -->
        <template v-if="activeTab === 'card'">
          <div class="panel-header">
            <h2>{{ $t('settings.tabs.card') }}</h2>
            <p>{{ $t('settings.card.desc') }}</p>
          </div>

          <div class="setting-group-title">{{ $t('settings.card.defaultType') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.card.defaultType') }}</p>
              <p class="setting-desc">{{ $t('settings.card.defaultTypeDesc') }}</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="t in cardTypeOptions"
                :key="t.value"
                :class="['segmented-btn', { active: defaultCardType === t.value }]"
                @click="defaultCardType = t.value"
              >
                {{ t.label }}
              </button>
            </div>
          </div>

          <div class="setting-group-title">{{ $t('settings.card.flipSpeed') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.card.flipSpeed') }}</p>
              <p class="setting-desc">{{ $t('settings.card.flipSpeedDesc') }}</p>
            </div>
            <div class="flex items-center gap-3">
              <input
                type="range"
                min="200"
                max="800"
                step="100"
                v-model="flipSpeed"
                class="range-slider"
                style="width: 140px"
              />
              <span class="text-xs text-slate-500 font-mono w-10 text-right"
                >{{ (flipSpeed / 1000).toFixed(1) }}s</span
              >
            </div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.card.flip3d') }}</p>
              <p class="setting-desc">{{ $t('settings.card.flip3dDesc') }}</p>
            </div>
            <div
              :class="['toggle-switch', { active: flip3d }]"
              @click="flip3d = !flip3d"
            ></div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.card.perspective') }}</p>
              <p class="setting-desc">{{ $t('settings.card.perspectiveDesc') }}</p>
            </div>
            <div class="flex items-center gap-3">
              <input
                type="range"
                min="400"
                max="2000"
                step="100"
                v-model="flipPerspective"
                class="range-slider"
                style="width: 140px"
              />
              <span class="text-xs text-slate-500 font-mono w-12 text-right"
                >{{ flipPerspective }}px</span
              >
            </div>
          </div>

          <div class="setting-group-title">{{ $t('settings.card.cardSize') }}</div>
          <div class="setting-row">
            <div><p class="setting-label">{{ $t('settings.card.cardWidth')}}</p></div>
            <input
              type="number"
              v-model="cardWidth"
              class="settings-input"
              style="width: 80px; text-align: center"
            />
          </div>
          <div class="setting-row">
            <div><p class="setting-label">{{ $t('settings.card.cardHeight')}}</p></div>
            <input
              type="number"
              v-model="cardHeight"
              class="settings-input"
              style="width: 80px; text-align: center"
            />
          </div>
          <div class="setting-row">
            <div><p class="setting-label">{{ $t('settings.card.articleWidth')}}</p></div>
            <input
              type="number"
              v-model="articleWidth"
              class="settings-input"
              style="width: 80px; text-align: center"
            />
          </div>
        </template>

        <!-- ====== 复习 ====== -->
        <template v-if="activeTab === 'review'">
          <div class="panel-header">
            <h2>{{ $t('settings.tabs.review') }}</h2>
            <p>{{ $t('settings.review.desc') }}</p>
          </div>

          <div class="setting-group-title">{{ $t('settings.review.theme') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.review.theme') }}</p>
              <p class="setting-desc">{{ $t('settings.review.themeDesc') }}</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="t in reviewThemeOptions"
                :key="t.value"
                :class="['segmented-btn', { active: reviewTheme === t.value }]"
                @click="reviewTheme = t.value"
              >
                {{ t.label }}
              </button>
            </div>
          </div>

          <div class="setting-group-title">{{ $t('settings.review.algorithm') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.review.initialInterval') }}</p>
              <p class="setting-desc">{{ $t('settings.review.initialIntervalDesc') }}</p>
            </div>
            <input
              type="number"
              v-model="initialInterval"
              class="settings-input"
              style="width: 64px; text-align: center"
              min="1"
              max="7"
            />
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.review.easeFactor') }}</p>
              <p class="setting-desc">{{ $t('settings.review.easeFactorDesc') }}</p>
            </div>
            <input
              type="number"
              v-model="easeFactor"
              class="settings-input"
              style="width: 64px; text-align: center"
              step="0.1"
              min="1.3"
              max="3.0"
            />
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.review.minIntervalMult') }}</p>
              <p class="setting-desc">{{ $t('settings.review.minIntervalMultDesc') }}</p>
            </div>
            <input
              type="number"
              v-model="minIntervalMult"
              class="settings-input"
              style="width: 64px; text-align: center"
              step="0.05"
              min="1.1"
              max="2.0"
            />
          </div>

          <div class="setting-group-title">{{ $t('settings.review.studyMode') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.review.autoNext') }}</p>
              <p class="setting-desc">{{ $t('settings.review.autoNextDesc') }}</p>
            </div>
            <div
              :class="['toggle-switch', { active: autoNextCard }]"
              @click="autoNextCard = !autoNextCard"
            ></div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.review.showEbbinghaus') }}</p>
              <p class="setting-desc">{{ $t('settings.review.showEbbinghausDesc') }}</p>
            </div>
            <div
              :class="['toggle-switch', { active: showEbbinghaus }]"
              @click="showEbbinghaus = !showEbbinghaus"
            ></div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.review.shuffle') }}</p>
              <p class="setting-desc">{{ $t('settings.review.shuffleDesc') }}</p>
            </div>
            <div
              :class="['toggle-switch', { active: shuffleCards }]"
              @click="shuffleCards = !shuffleCards"
            ></div>
          </div>
        </template>

        <!-- ====== 番茄钟 ====== -->
        <template v-if="activeTab === 'pomodoro'">
          <div class="panel-header">
            <h2>{{ $t('settings.tabs.pomodoro') }}</h2>
            <p>{{ $t('settings.pomodoro.desc') }}</p>
          </div>

          <div class="setting-group-title">{{ $t('settings.pomodoro.time') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.pomodoro.focusDuration') }}</p>
              <p class="setting-desc">{{ $t('settings.pomodoro.focusDurationDesc') }}</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="opt in focusDurationOptions"
                :key="opt.value"
                :class="['segmented-btn', { active: focusDuration === opt.value }]"
                @click="focusDuration = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.pomodoro.shortBreak') }}</p>
              <p class="setting-desc">{{ $t('settings.pomodoro.shortBreakDesc') }}</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="opt in shortBreakOptions"
                :key="opt.value"
                :class="['segmented-btn', { active: shortBreak === opt.value }]"
                @click="shortBreak = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.pomodoro.longBreakCycle') }}</p>
              <p class="setting-desc">{{ $t('settings.pomodoro.longBreakCycleDesc') }}</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="opt in longBreakCycleOptions"
                :key="opt.value"
                :class="['segmented-btn', { active: longBreakCycle === opt.value }]"
                @click="longBreakCycle = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div class="setting-row">
            <div><p class="setting-label">{{ $t('settings.pomodoro.longBreak') }}</p></div>
            <div class="segmented-control">
              <button
                v-for="opt in longBreakDurationOptions"
                :key="opt.value"
                :class="['segmented-btn', { active: longBreakDuration === opt.value }]"
                @click="longBreakDuration = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="setting-group-title">{{ $t('settings.pomodoro.notify') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.pomodoro.sound') }}</p>
              <p class="setting-desc">{{ $t('settings.pomodoro.soundDesc') }}</p>
            </div>
            <div
              :class="['toggle-switch', { active: pomodoroSound }]"
              @click="pomodoroSound = !pomodoroSound"
            ></div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.pomodoro.desktopNotify') }}</p>
              <p class="setting-desc">{{ $t('settings.pomodoro.desktopNotifyDesc') }}</p>
            </div>
            <div
              :class="['toggle-switch', { active: desktopNotify }]"
              @click="desktopNotify = !desktopNotify"
            ></div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.pomodoro.autoStart') }}</p>
              <p class="setting-desc">{{ $t('settings.pomodoro.autoStartDesc') }}</p>
            </div>
            <div
              :class="['toggle-switch', { active: autoStartPomodoro }]"
              @click="autoStartPomodoro = !autoStartPomodoro"
            ></div>
          </div>
        </template>

        <!-- ====== 数据 ====== -->
        <template v-if="activeTab === 'data'">
          <div class="panel-header">
            <h2>{{ $t('settings.tabs.data') }}</h2>
            <p>{{ $t('settings.data.desc') }}</p>
          </div>

          <div class="setting-group-title">{{ $t('settings.data.stats') }}</div>
          <div
            class="mx-6 my-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
          >
            <div class="flex justify-between items-center mb-3">
              <span class="text-sm font-medium text-slate-600">{{ $t('settings.data.stats') }}</span>
              <span class="text-sm font-bold text-slate-800">{{ formatSize(storageStats.estimatedSize) }}</span>
            </div>
            <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                :style="{ width: storageStats.cardCount ? Math.min(100, storageStats.cardCount / 5) + '%' : '2%' }"
              ></div>
            </div>
            <div class="flex justify-between mt-2 text-[10px] text-slate-500">
              <span>{{ $t('settings.data.cardCount', { n: storageStats.cardCount }) }}</span>
              <span>{{ $t('settings.data.appCount', { n: storageStats.appCount }) }}</span>
              <span>{{ $t('settings.data.catCount', { n: storageStats.catCount }) }}</span>
            </div>
          </div>

          <div class="setting-group-title">{{ $t('settings.data.export') }} / {{ $t('settings.data.import') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.data.exportBtn') }}</p>
              <p class="setting-desc">{{ $t('settings.data.exportDesc') }}</p>
            </div>
            <button class="btn-primary" @click="handleExport">{{ $t('settings.data.exportBtn') }}</button>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.data.importBtn') }}</p>
              <p class="setting-desc">{{ $t('settings.data.importDesc') }}</p>
            </div>
            <button class="btn-secondary" @click="handleImport">{{ $t('settings.data.importBtn') }}</button>
          </div>

          <div class="setting-group-title">{{ $t('settings.data.sync')}}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.data.sync')}}</p>
              <p class="setting-desc">{{ $t('settings.data.syncDesc') }}</p>
            </div>
            <button class="btn-disabled">{{ $t('settings.data.comingSoon') }}</button>
          </div>

          <div class="setting-group-title danger-zone">{{ $t('settings.data.clearCards') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.data.clearCards') }}</p>
              <p class="setting-desc">{{ $t('settings.data.clearCardsDesc') }}</p>
            </div>
            <button class="danger-btn" @click="handleClearCards">{{ $t('settings.data.clearCards') }}</button>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.data.resetFactory') }}</p>
              <p class="setting-desc">{{ $t('settings.data.resetFactoryDesc') }}</p>
            </div>
            <button class="danger-btn" @click="handleReset">{{ $t('settings.data.resetFactory') }}</button>
          </div>
        </template>

        <!-- ====== 语言 ====== -->
        <template v-if="activeTab === 'language'">
          <div class="panel-header">
            <h2>{{ $t('settings.language.title') }}</h2>
            <p>{{ $t('settings.language.desc') }}</p>
          </div>

          <div class="setting-group-title">{{ $t('settings.language.label') }}</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">{{ $t('settings.language.label') }}</p>
              <p class="setting-desc">{{ $t('settings.language.languageDesc') }}</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="l in localeOptions"
                :key="l.value"
                :class="['segmented-btn', { active: locale === l.value }]"
                @click="locale = l.value"
              >{{ l.label }}</button>
            </div>
          </div>

          <div class="language-hint-row">
            <p class="text-xs text-slate-400">{{ $t('settings.language.hint') }}</p>
            <p class="text-xs text-red-400 mt-1">{{ $t('settings.language.resetHint') }}</p>
          </div>
        </template>

        <!-- ====== 关于 ====== -->
        <template v-if="activeTab === 'about'">
          <div class="panel-header"><h2>{{ $t('settings.about.title') }}</h2></div>
          <div class="flex flex-col items-center py-12">
            <div
              class="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-blue-500/25 mb-6"
            >
              C
            </div>
            <h3 class="text-xl font-bold text-slate-800">cnotely</h3>
            <p class="text-sm text-slate-500 mt-1">
              {{ $t('settings.about.appName') }} · {{ $t('settings.about.version') }} 0.2.0
            </p>
            <p
              class="text-xs text-slate-500 text-center max-w-sm mt-6 leading-relaxed"
            >
              {{ $t('settings.about.appDescription') }}
            </p>
            <div class="grid grid-cols-3 gap-8 mt-8 text-center">
              <div>
                <p class="text-2xl font-bold text-blue-500">{{ storageStats.cardCount }}</p>
                <p class="text-[11px] text-slate-500 mt-1">{{ $t('settings.about.cardCountLabel')}}</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-emerald-500">{{ storageStats.totalCompletions }}</p>
                <p class="text-[11px] text-slate-500 mt-1">{{ $t('settings.about.reviewCountLabel')}}</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-amber-500">{{ Math.round(storageStats.totalFocusMinutes / 60) }}</p>
                <p class="text-[11px] text-slate-500 mt-1">{{ $t('settings.about.focusHourLabel')}}</p>
              </div>
            </div>
            <div class="mt-8 pt-6 border-t border-slate-100 w-full text-center">
              <p class="text-[11px] text-slate-300">
                {{ $t('settings.about.copyright') }}
              </p>
            </div>
          </div>
        </template>
      </main>
    </div>
    <div
      v-if="!isMaximized"
      class="sheet-resize-handle"
      @mousedown.stop="startResize"
    ></div>
    <dialog ref="confirmDialog" class="confirm-dialog">
      <p class="text-sm text-slate-700 mb-4">{{ confirmMsg }}</p>
      <div class="flex gap-2 justify-end">
              <button class="btn-secondary" @click="doCancel">{{ $t('common.cancel') }}</button>
        <button class="danger-btn" @click="doConfirm">{{ $t('common.confirm') }}</button>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import {
  Palette,
  LayoutGrid,
  CreditCard,
  BrainCircuit,
  Timer,
  Database,
  Globe,
  Info,
  ChevronRight,
  Maximize,
  Minimize2,
} from "lucide-vue-next";
import { useSheetWindow } from "../composables/useSheetWindow";
import { useSettings } from "../composables/useSettings";
import { useI18n } from "../locales/i18n.js";

const emit = defineEmits(["close"]);

const {
  sheetStyle,
  isMaximized,
  bringToFront,
  startDrag,
  startResize,
  toggleMaximize,
} = useSheetWindow({
  defaultWidth: 880,
  defaultHeight: 620,
  minWidth: 700,
  minHeight: 480,
  maxWidth: 1200,
  maxHeight: 900,
  id: "settings",
});

const { get, set, init, persist, exportAllData, importAllData, clearAllCards, resetToFactory, getStorageStats, wallpaperPresets: presets } = useSettings();

// 显示值 <-> 存储值映射


const activeTab = ref("appearance");

const { t } = useI18n()

const tabs = computed(() => [
  { id: "appearance", label: t('settings.tabs.appearance'), icon: Palette },
  { id: "desktop", label: t('settings.tabs.desktop'), icon: LayoutGrid },
  { id: "card", label: t('settings.tabs.card'), icon: CreditCard },
  { id: "review", label: t('settings.tabs.review'), icon: BrainCircuit },
  { id: "pomodoro", label: t('settings.tabs.pomodoro'), icon: Timer },
  { id: "data", label: t('settings.tabs.data'), icon: Database },
  { id: "language", label: t('settings.tabs.language'), icon: Globe },
  { id: "about", label: t('settings.tabs.about'), icon: Info },
]);

// 外观
const selectedWallpaper = ref(0);
const wallpapers = presets;
const blurStrength = ref(25);
const barOpacity = ref(50);
const reduceMotion = ref(false);
const dockZoom = ref(true);
const globalTheme = ref('light');
const themeOptions = computed(() => [
  { value: 'light', label: t('settings.appearance.light') },
  { value: 'dark', label: t('settings.appearance.dark') },
]);

// 桌面
const layoutMode = ref("auto");
const layoutOptions = computed(() => [
  { value: 'auto', label: t('settings.desktop.autoLayout') },
  { value: 'free', label: t('settings.desktop.freeLayout') },
]);
const iconGap = ref(90);
const showIconLabels = ref(true);
const trashDirectDelete = ref(false);
// 卡片
const defaultCardType = ref("qa");
const cardTypeOptions = computed(() => [
  { value: 'qa', label: t('settings.card.qaCard') },
  { value: 'article', label: t('settings.card.articleCard') },
]);
const flipSpeed = ref(500);
const flip3d = ref(true);
const flipPerspective = ref(1000);
const cardWidth = ref(310);
const cardHeight = ref(220);
const articleWidth = ref(350);

// 复习
const reviewTheme = ref('system');
const reviewThemeOptions = computed(() => [
  { value: 'system', label: t('settings.review.themeSystem') },
  { value: 'light', label: t('settings.review.themeLight') },
  { value: 'dark', label: t('settings.review.themeDark') },
  { value: 'sepia', label: t('settings.review.themeSepia') },
]);
const { locale, setLocale, locales: localeList } = useI18n()
const localeOptions = computed(() => [
  { value: 'zh-CN', label: t('settings.language.chinese') },
  { value: 'en', label: t('settings.language.english') },
])
const initialInterval = ref(1);
const easeFactor = ref(2.5);
const minIntervalMult = ref(1.3);
const autoNextCard = ref(true);
const showEbbinghaus = ref(true);
const shuffleCards = ref(false);

// 番茄钟
const focusDuration = ref("25");
const focusDurationOptions = computed(() => [
  { value: '15', label: '15' + (t('settings.pomodoro.minutes') || '分钟') },
  { value: '25', label: '25' + (t('settings.pomodoro.minutes') || '分钟') },
  { value: '45', label: '45' + (t('settings.pomodoro.minutes') || '分钟') },
]);
const shortBreak = ref("5");
const shortBreakOptions = computed(() => [
  { value: '5', label: '5' + (t('settings.pomodoro.minutes') || '分钟') },
  { value: '10', label: '10' + (t('settings.pomodoro.minutes') || '分钟') },
]);
const longBreakCycle = ref("4");
const longBreakCycleOptions = computed(() => [
  { value: '3', label: '3' + (t('settings.pomodoro.cycles') || '个') },
  { value: '4', label: '4' + (t('settings.pomodoro.cycles') || '个') },
  { value: '5', label: '5' + (t('settings.pomodoro.cycles') || '个') },
]);
const longBreakDuration = ref("20");
const longBreakDurationOptions = computed(() => [
  { value: '15', label: '15' + (t('settings.pomodoro.minutes') || '分钟') },
  { value: '20', label: '20' + (t('settings.pomodoro.minutes') || '分钟') },
  { value: '30', label: '30' + (t('settings.pomodoro.minutes') || '分钟') },
]);
const pomodoroSound = ref(true);
const desktopNotify = ref(true);
const autoStartPomodoro = ref(false);

// 数据
const storageStats = ref({ cardCount: 0, appCount: 0, catCount: 0, reviewCount: 0, totalCompletions: 0, totalFocusMinutes: 0, estimatedSize: 0 })

// ---- 工具函数 ----
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

// ---- 从 storage 加载到 UI 显示值 ----
async function loadSettings() {
  await init()
  const s = get()

  selectedWallpaper.value = s.wallpaperIndex ?? 0
  blurStrength.value = s.blurStrength ?? 25
  barOpacity.value = s.barOpacity ?? 50
  reduceMotion.value = s.reduceMotion ?? false
  dockZoom.value = s.dockZoom ?? true
  globalTheme.value = s.theme ?? 'light'

  layoutMode.value = s.layoutMode || 'auto'
  iconGap.value = s.iconGap ?? 90
  showIconLabels.value = s.showIconLabels ?? true
  trashDirectDelete.value = s.trashDirectDelete ?? false
  defaultCardType.value = s.defaultCardType || 'qa'
  flipSpeed.value = s.flipSpeed ?? 500
  flip3d.value = s.flip3d ?? true
  flipPerspective.value = s.flipPerspective ?? 1000
  cardWidth.value = s.cardWidth ?? 310
  cardHeight.value = s.cardHeight ?? 220
  articleWidth.value = s.articleWidth ?? 350

  initialInterval.value = s.initialInterval ?? 1
  easeFactor.value = s.easeFactor ?? 2.5
  minIntervalMult.value = s.minIntervalMult ?? 1.3
  autoNextCard.value = s.autoNextCard ?? true
  showEbbinghaus.value = s.showEbbinghaus ?? true
  shuffleCards.value = s.shuffleCards ?? false
  reviewTheme.value = s.reviewTheme ?? 'system'
  locale.value = s.locale ?? 'en'
  setLocale(locale.value)

  focusDuration.value = String(s.focusDuration || 25)
  shortBreak.value = String(s.shortBreak || 5)
  longBreakCycle.value = String(s.longBreakCycle || 4)
  longBreakDuration.value = String(s.longBreakDuration || 20)
  pomodoroSound.value = s.pomodoroSound ?? true
  desktopNotify.value = s.desktopNotify ?? true
  autoStartPomodoro.value = s.autoStartPomodoro ?? false

  await refreshStats()
}

async function refreshStats() {
  const stats = await getStorageStats()
  storageStats.value = stats
}

// ---- 从 UI 显示值写回 storage ----
function saveSetting(key, value) {
  set(key, value)
  // persist 由 useSettings 的 deep watch 自动触发
}

// watch 所有 ref，变更时持久化
watch(selectedWallpaper, (v) => saveSetting('wallpaperIndex', v))
watch(blurStrength, (v) => saveSetting('blurStrength', v))
watch(barOpacity, (v) => saveSetting('barOpacity', v))
watch(reduceMotion, (v) => saveSetting('reduceMotion', v))
watch(dockZoom, (v) => saveSetting('dockZoom', v))
watch(globalTheme, (v) => saveSetting('theme', v))

watch(layoutMode, (v) => saveSetting('layoutMode', v))
watch(iconGap, (v) => saveSetting('iconGap', v))
watch(showIconLabels, (v) => saveSetting('showIconLabels', v))
watch(trashDirectDelete, (v) => saveSetting('trashDirectDelete', v))
watch(defaultCardType, (v) => saveSetting('defaultCardType', v))
watch(flipSpeed, (v) => saveSetting('flipSpeed', v))
watch(flip3d, (v) => saveSetting('flip3d', v))
watch(flipPerspective, (v) => saveSetting('flipPerspective', v))
watch(cardWidth, (v) => saveSetting('cardWidth', v))
watch(cardHeight, (v) => saveSetting('cardHeight', v))
watch(articleWidth, (v) => saveSetting('articleWidth', v))

watch(initialInterval, (v) => saveSetting('initialInterval', v))
watch(easeFactor, (v) => saveSetting('easeFactor', v))
watch(minIntervalMult, (v) => saveSetting('minIntervalMult', v))
watch(autoNextCard, (v) => saveSetting('autoNextCard', v))
watch(showEbbinghaus, (v) => saveSetting('showEbbinghaus', v))
watch(shuffleCards, (v) => saveSetting('shuffleCards', v))
watch(reviewTheme, (v) => saveSetting('reviewTheme', v))
watch(locale, (v) => { saveSetting('locale', v); setLocale(v) })

watch(focusDuration, (v) => saveSetting('focusDuration', Number(v) || 25))
watch(shortBreak, (v) => saveSetting('shortBreak', Number(v) || 5))
watch(longBreakCycle, (v) => saveSetting('longBreakCycle', Number(v) || 4))
watch(longBreakDuration, (v) => saveSetting('longBreakDuration', Number(v) || 20))
watch(pomodoroSound, (v) => saveSetting('pomodoroSound', v))
watch(desktopNotify, (v) => saveSetting('desktopNotify', v))
watch(autoStartPomodoro, (v) => saveSetting('autoStartPomodoro', v))

function handleCustomWallpaper() {
  if (wallpaperInput.value) wallpaperInput.value.click()
}

async function onWallpaperUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (ev) => {
    const base64 = ev.target.result
    set('customWallpaper', base64)
    set('wallpaperIndex', -1)
    persist()
    selectedWallpaper.value = -1
  }
  reader.readAsDataURL(file)
}

const wallpaperInput = ref(null)

// ---- 数据操作 ----
const confirmDialog = ref(null)
const confirmMsg = ref('')
const confirmAction = ref(null)

function showConfirm(msg, action) {
  confirmMsg.value = msg
  confirmAction.value = action
  if (confirmDialog.value) confirmDialog.value.showModal()
}

async function handleExport() {
  const data = await exportAllData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cnotely-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)
      await loadSettings()
      emit('dataChanged')
    } catch (err) {
      alert(t('settings.data.importFailed') + err.message)
    }
  }
  input.click()
}

function handleClearCards() {
  showConfirm(t('settings.data.clearCardsConfirm'), async () => {
    await clearAllCards()
    await refreshStats()
    emit('dataChanged')
  })
}

function handleReset() {
  showConfirm(t('settings.data.resetFactoryConfirm'), async () => {
    await resetToFactory()
    await loadSettings()
    emit('dataChanged')
  })
}

function doConfirm() {
  if (confirmAction.value) confirmAction.value()
  if (confirmDialog.value) confirmDialog.value.close()
}
function doCancel() {
  if (confirmDialog.value) confirmDialog.value.close()
}

onMounted(async () => {
  await nextTick()
  await loadSettings()
})
</script>

<style scoped>
.settings-window {
  background: transparent;
  border: none;
  border-radius: 16px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.9),
    inset 0 -0.5px 0 rgba(0, 0, 0, 0.03);
}

/* 统一磨砂: header / sidebar / content / footer */
.sheet-header,
.settings-sidebar,
.settings-main {
  background: var(--panel-bg);
  backdrop-filter: blur(30px) saturate(190%);
  -webkit-backdrop-filter: blur(30px) saturate(190%);
}
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 0.5px solid var(--border-subtle);
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
}
.sheet-header:active {
  cursor: grabbing;
}
.sheet-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}
.sheet-drag-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--border-input);
  flex-shrink: 0;
  margin: -30px 0 0px 0;
}
.sheet-control-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: var(--kbd-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-tertiary);
}
.sheet-control-btn:hover {
  background: var(--button-secondary-bg);
  color: var(--text-primary);
}
.sheet-control-btn svg {
  width: 13px;
  height: 13px;
}
.sheet-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sheet-title-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.2);
}
.sheet-title-icon svg {
  width: 15px;
  height: 15px;
  color: white;
}
.sheet-title-text h2 {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}
.sheet-title-text span {
  display: block;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--text-placeholder);
  margin-top: 1px;
}
.sheet-close {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: var(--kbd-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-tertiary);
}
.sheet-close:hover {
  background: var(--button-secondary-bg);
  color: var(--text-primary);
}
.sheet-close svg {
  width: 11px;
  height: 11px;
}

.settings-sidebar {
  border-right: 1px solid var(--border-subtle);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  margin: 2px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--sidebar-item-text);
  transition: all 0.12s ease;
  border: none;
  background: none;
  text-align: left;
  width: 100%;
}
.sidebar-item:hover {
  background: var(--sidebar-item-hover);
  color: var(--text-heading);
}
.sidebar-item.active {
  background: var(--sidebar-item-active);
  color: var(--sidebar-item-active-text);
  font-weight: 600;
}

.panel-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-subtle);
}
.panel-header h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-heading);
}
.panel-header p {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.setting-group-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 16px 20px 8px;
}
.setting-group-title.danger-zone {
  color: var(--danger);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 20px;
  transition: background 0.12s ease;
}
.setting-row:hover {
  background: var(--accent-light);
}

.setting-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-label);
}
.setting-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Toggle Switch */
.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--toggle-off);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
  border: none;
  outline: none;
}
.toggle-switch.active {
  background: var(--accent);
}
.toggle-switch::after {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--toggle-off-dot);
  top: 2px;
  left: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.toggle-switch.active::after {
  transform: translateX(20px);
}

/* Segmented Control */
.segmented-control {
  display: inline-flex;
  background: var(--segmented-bg);
  border-radius: 8px;
  padding: 2px;
}
.segmented-btn {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.segmented-btn.active {
  background: var(--segmented-active);
  color: var(--segmented-active-text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Inputs */
.settings-input {
  padding: 7px 12px;
  font-size: 13px;
  border: 1px solid var(--border-input);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.settings-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.range-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--range-track);
  outline: none;
}
.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(59, 130, 246, 0.35);
  transition: transform 0.12s;
}
.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.wallpaper-thumb {
  width: 72px;
  height: 48px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  object-fit: cover;
  transition: all 0.15s ease;
}
.wallpaper-thumb:hover {
  transform: scale(1.05);
}
.wallpaper-thumb.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.btn-primary {
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2);
}
.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-label);
  background: var(--button-secondary-bg);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-secondary:hover {
  background: var(--button-secondary-hover);
}

.btn-disabled {
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-50);
  border: none;
  border-radius: 8px;
  cursor: not-allowed;
}

.danger-btn {
  padding: 8px 18px;
  font-size: 12px;
  font-weight: 600;
  color: var(--danger);
  background: var(--danger-light);
  border: 1px solid var(--danger-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.danger-btn:hover {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}

@keyframes settingsIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.sheet-resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 10;
}
.sheet-resize-handle::before {
  content: "";
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-right: 1.5px solid var(--border-input);
  border-bottom: 1.5px solid var(--border-input);
}

.settings-main::-webkit-scrollbar {
  width: 5px;
}
.settings-main::-webkit-scrollbar-track {
  background: transparent;
}
.settings-main::-webkit-scrollbar-thumb {
  background: var(--border-input);
  border-radius: 10px;
}
.settings-main::-webkit-scrollbar-thumb:hover {
  background: var(--separator);
}
.confirm-dialog::backdrop {
  background: var(--dialog-backdrop);
  backdrop-filter: blur(4px);
}

.language-hint-row {
  padding: 12px 20px;
}
.confirm-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  border: none;
  border-radius: 12px;
  padding: 20px 24px;
  background: var(--dialog-bg);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  min-width: 320px;
  max-width: 420px;
  color: var(--text-primary);
}
</style>
