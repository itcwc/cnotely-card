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
          <h2>设置</h2>
          <span>SETTINGS</span>
        </div>
      </div>
      <div class="sheet-drag-bar w-10"></div>
      <div class="sheet-controls">
        <button
          @click="toggleMaximize"
          class="sheet-control-btn"
          title="最大化/还原"
        >
          <svg
            v-if="!isMaximized"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path
              d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
            />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path
              d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
            />
          </svg>
        </button>
        <button @click="$emit('close')" class="sheet-close" title="关闭">
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
          <p class="text-[10px] text-slate-400">cnotely v0.2.0</p>
        </div>
      </nav>

      <!-- 右侧面板 -->
      <main class="flex-1 overflow-y-auto settings-main">
        <!-- ====== 外观 ====== -->
        <template v-if="activeTab === 'appearance'">
          <div class="panel-header">
            <h2>外观</h2>
            <p>自定义界面视觉效果</p>
          </div>

          <div class="setting-group-title">壁纸</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">桌面壁纸</p>
              <p class="setting-desc">选择一张喜欢的背景图</p>
            </div>
            <div class="flex gap-2">
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
                class="wallpaper-thumb bg-slate-100 flex items-center justify-center cursor-pointer"
                title="自定义上传"
              >
                <ChevronRight :size="14" class="text-slate-400" />
              </label>
            </div>
          </div>

          <div class="setting-group-title">透明度</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">磨砂玻璃强度</p>
              <p class="setting-desc">控制毛玻璃效果的模糊程度</p>
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
              <p class="setting-label">顶栏不透明度</p>
              <p class="setting-desc">顶部菜单栏的背景透明度</p>
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

          <div class="setting-group-title">动画效果</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">减少动画效果</p>
              <p class="setting-desc">关闭后使用更简洁的过渡动画</p>
            </div>
            <div
              :class="['toggle-switch', { active: reduceMotion }]"
              @click="reduceMotion = !reduceMotion"
            ></div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">Dock 栏放大效果</p>
              <p class="setting-desc">鼠标悬停时图标放大动画</p>
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
            <h2>桌面</h2>
            <p>桌面布局与行为设置</p>
          </div>

          <div class="setting-group-title">布局模式</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">默认排列方式</p>
              <p class="setting-desc">新打开时的桌面排列模式</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="(opt, i) in ['自动', '自由']"
                :key="opt"
                :class="['segmented-btn', { active: layoutMode === opt }]"
                @click="layoutMode = opt"
              >
                {{ opt }}
              </button>
            </div>
          </div>

          <div class="setting-group-title">图标网格</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">图标间距</p>
              <p class="setting-desc">图标之间的距离（像素）</p>
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
              <p class="setting-label">显示图标名称</p>
              <p class="setting-desc">在图标下方显示文字标签</p>
            </div>
            <div
              :class="['toggle-switch', { active: showIconLabels }]"
              @click="showIconLabels = !showIconLabels"
            ></div>
          </div>

          <div class="setting-group-title">拖拽行为</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">拖入废纸篓直接删除</p>
              <p class="setting-desc">开启后拖到废纸篓即删除，无需确认</p>
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
            <h2>卡片</h2>
            <p>记忆卡和文章卡的默认设置</p>
          </div>

          <div class="setting-group-title">新建卡片</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">默认卡片类型</p>
              <p class="setting-desc">点击新建时默认创建的卡片类型</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="t in ['记忆卡', '文章卡']"
                :key="t"
                :class="['segmented-btn', { active: defaultCardType === t }]"
                @click="defaultCardType = t"
              >
                {{ t }}
              </button>
            </div>
          </div>

          <div class="setting-group-title">翻转动画</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">翻转速度</p>
              <p class="setting-desc">卡片翻转的动画时长</p>
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
              <p class="setting-label">3D 翻转透视</p>
              <p class="setting-desc">启用立体翻转效果</p>
            </div>
            <div
              :class="['toggle-switch', { active: flip3d }]"
              @click="flip3d = !flip3d"
            ></div>
          </div>

          <div class="setting-group-title">默认尺寸</div>
          <div class="setting-row">
            <div><p class="setting-label">记忆卡宽度</p></div>
            <input
              type="number"
              v-model="cardWidth"
              class="settings-input"
              style="width: 80px; text-align: center"
            />
          </div>
          <div class="setting-row">
            <div><p class="setting-label">记忆卡高度</p></div>
            <input
              type="number"
              v-model="cardHeight"
              class="settings-input"
              style="width: 80px; text-align: center"
            />
          </div>
          <div class="setting-row">
            <div><p class="setting-label">文章卡宽度</p></div>
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
            <h2>复习</h2>
            <p>艾宾浩斯间隔重复算法配置</p>
          </div>

          <div class="setting-group-title">算法参数</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">初始间隔</p>
              <p class="setting-desc">首次标记「已掌握」后的复习天数</p>
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
              <p class="setting-label">难度系数起始值</p>
              <p class="setting-desc">SM-2 算法的初始 ease factor</p>
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
              <p class="setting-label">最小间隔倍数</p>
              <p class="setting-desc">相邻两次复习的最小时间比例</p>
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

          <div class="setting-group-title">学习模式</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">自动播放下一张</p>
              <p class="setting-desc">评分后自动切换到下一张卡片</p>
            </div>
            <div
              :class="['toggle-switch', { active: autoNextCard }]"
              @click="autoNextCard = !autoNextCard"
            ></div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">显示艾宾浩斯状态</p>
              <p class="setting-desc">在卡片上显示下次复习时间提示</p>
            </div>
            <div
              :class="['toggle-switch', { active: showEbbinghaus }]"
              @click="showEbbinghaus = !showEbbinghaus"
            ></div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">随机打乱顺序</p>
              <p class="setting-desc">每次开始时打乱卡片顺序避免位置记忆</p>
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
            <h2>番茄钟</h2>
            <p>专注计时器配置</p>
          </div>

          <div class="setting-group-title">时间设置</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">专注时长</p>
              <p class="setting-desc">单个番茄的时间长度</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="t in ['15分钟', '25分钟', '45分钟']"
                :key="t"
                :class="['segmented-btn', { active: focusDuration === t }]"
                @click="focusDuration = t"
              >
                {{ t }}
              </button>
            </div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">短休息时长</p>
              <p class="setting-desc">每个番茄结束后的休息时间</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="t in ['5分钟', '10分钟']"
                :key="t"
                :class="['segmented-btn', { active: shortBreak === t }]"
                @click="shortBreak = t"
              >
                {{ t }}
              </button>
            </div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">长休息周期</p>
              <p class="setting-desc">每几个番茄后进入长休息</p>
            </div>
            <div class="segmented-control">
              <button
                v-for="t in ['3个', '4个', '5个']"
                :key="t"
                :class="['segmented-btn', { active: longBreakCycle === t }]"
                @click="longBreakCycle = t"
              >
                {{ t }}
              </button>
            </div>
          </div>
          <div class="setting-row">
            <div><p class="setting-label">长休息时长</p></div>
            <div class="segmented-control">
              <button
                v-for="t in ['15分钟', '20分钟', '30分钟']"
                :key="t"
                :class="['segmented-btn', { active: longBreakDuration === t }]"
                @click="longBreakDuration = t"
              >
                {{ t }}
              </button>
            </div>
          </div>

          <div class="setting-group-title">提醒与音效</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">完成提示音</p>
              <p class="setting-desc">番茄结束时播放声音提醒</p>
            </div>
            <div
              :class="['toggle-switch', { active: pomodoroSound }]"
              @click="pomodoroSound = !pomodoroSound"
            ></div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">桌面通知</p>
              <p class="setting-desc">通过系统推送通知提醒</p>
            </div>
            <div
              :class="['toggle-switch', { active: desktopNotify }]"
              @click="desktopNotify = !desktopNotify"
            ></div>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">自动开始下一个</p>
              <p class="setting-desc">休息结束后自动开始新的番茄</p>
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
            <h2>数据管理</h2>
            <p>导入、导出与存储空间</p>
          </div>

          <div class="setting-group-title">存储概览</div>
          <div
            class="mx-6 my-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
          >
            <div class="flex justify-between items-center mb-3">
              <span class="text-sm font-medium text-slate-600">已用空间</span>
              <span class="text-sm font-bold text-slate-800">2.4 MB</span>
            </div>
            <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                class="h-full w-[8%] bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
              ></div>
            </div>
            <div class="flex justify-between mt-2 text-[10px] text-slate-400">
              <span>卡片: 128 张</span>
              <span>图标: 5 个</span>
              <span>分类: 4 个</span>
            </div>
          </div>

          <div class="setting-group-title">导出 / 导入</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">导出全部数据</p>
              <p class="setting-desc">将所有卡片、分类、设置导出为 JSON 文件</p>
            </div>
            <button class="btn-primary">导出</button>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">导入数据</p>
              <p class="setting-desc">从 JSON 文件恢复之前导出的数据</p>
            </div>
            <button class="btn-secondary">导入</button>
          </div>

          <div class="setting-group-title">同步</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">云端同步</p>
              <p class="setting-desc">跨设备同步你的学习进度（即将推出）</p>
            </div>
            <button class="btn-disabled">敬请期待</button>
          </div>

          <div class="setting-group-title danger-zone">危险操作</div>
          <div class="setting-row">
            <div>
              <p class="setting-label">清空全部卡片</p>
              <p class="setting-desc">删除所有卡片，保留分类和设置</p>
            </div>
            <button class="danger-btn">清空卡片</button>
          </div>
          <div class="setting-row">
            <div>
              <p class="setting-label">重置为出厂设置</p>
              <p class="setting-desc">清除所有数据，恢复到首次安装状态</p>
            </div>
            <button class="danger-btn">重置全部</button>
          </div>
        </template>

        <!-- ====== 关于 ====== -->
        <template v-if="activeTab === 'about'">
          <div class="panel-header"><h2>关于 cnotely</h2></div>
          <div class="flex flex-col items-center py-12">
            <div
              class="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-blue-500/25 mb-6"
            >
              C
            </div>
            <h3 class="text-xl font-bold text-slate-800">cnotely</h3>
            <p class="text-sm text-slate-400 mt-1">
              闪记便笺工作台 · 版本 0.2.0
            </p>
            <p
              class="text-xs text-slate-500 text-center max-w-sm mt-6 leading-relaxed"
            >
              cnotely 是一款受 macOS
              设计语言启发的闪记卡片工作台。通过拟物化的卡片交互、艾宾浩斯间隔重复算法和番茄专注钟，让知识管理像整理桌面一样直观有趣。
            </p>
            <div class="grid grid-cols-3 gap-8 mt-8 text-center">
              <div>
                <p class="text-2xl font-bold text-blue-500">128</p>
                <p class="text-[11px] text-slate-400 mt-1">张卡片</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-emerald-500">86</p>
                <p class="text-[11px] text-slate-400 mt-1">次复习</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-amber-500">12</p>
                <p class="text-[11px] text-slate-400 mt-1">小时专注</p>
              </div>
            </div>
            <div class="mt-8 pt-6 border-t border-slate-100 w-full text-center">
              <p class="text-[11px] text-slate-300">
                © 2025 cnotely. All rights reserved.
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
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  Palette,
  LayoutGrid,
  CreditCard,
  BrainCircuit,
  Timer,
  Database,
  Info,
  ChevronRight,
} from "lucide-vue-next";
import { useSheetWindow } from "../composables/useSheetWindow";

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

// 外观设置
const activeTab = ref("appearance");

const tabs = [
  { id: "appearance", label: "外观", icon: Palette },
  { id: "desktop", label: "桌面", icon: LayoutGrid },
  { id: "card", label: "卡片", icon: CreditCard },
  { id: "review", label: "复习", icon: BrainCircuit },
  { id: "pomodoro", label: "番茄钟", icon: Timer },
  { id: "data", label: "数据", icon: Database },
  { id: "about", label: "关于", icon: Info },
];

// 外观
const selectedWallpaper = ref(0);
const wallpapers = [
  {
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
    title: "默认流体壁纸",
  },
  {
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=200&q=80",
    title: "渐变紫粉",
  },
  {
    url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=200&q=80",
    title: "极光绿",
  },
  {
    url: "https://images.unsplash.com/photo-1557672179-29860c9e6912?auto=format&fit=crop&w=200&q=80",
    title: "深空蓝",
  },
];
const blurStrength = ref(25);
const barOpacity = ref(50);
const reduceMotion = ref(false);
const dockZoom = ref(true);

// 桌面
const layoutMode = ref("自动");
const iconGap = ref(90);
const showIconLabels = ref(true);
const trashDirectDelete = ref(false);

// 卡片
const defaultCardType = ref("记忆卡");
const flipSpeed = ref(500);
const flip3d = ref(true);
const cardWidth = ref(310);
const cardHeight = ref(220);
const articleWidth = ref(350);

// 复习
const initialInterval = ref(1);
const easeFactor = ref(2.5);
const minIntervalMult = ref(1.3);
const autoNextCard = ref(true);
const showEbbinghaus = ref(true);
const shuffleCards = ref(false);

// 番茄钟
const focusDuration = ref("25分钟");
const shortBreak = ref("5分钟");
const longBreakCycle = ref("4个");
const longBreakDuration = ref("20分钟");
const pomodoroSound = ref(true);
const desktopNotify = ref(true);
const autoStartPomodoro = ref(false);
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
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(30px) saturate(190%);
  -webkit-backdrop-filter: blur(30px) saturate(190%);
}
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.35);
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
  /* width: 24px; */
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  margin: -30px 0 0px 0;
}
.sheet-control-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #5a5e64;
}
.sheet-control-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1a1a2e;
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
  color: #1a1a2e;
  line-height: 1.2;
}
.sheet-title-text span {
  display: block;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #8b92a5;
  margin-top: 1px;
}
.sheet-close {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #5a5e64;
}
.sheet-close:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1a1a2e;
}
.sheet-close svg {
  width: 11px;
  height: 11px;
}

.settings-sidebar {
  border-right: 1px solid rgba(255, 255, 255, 0.35);
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
  color: #475569;
  transition: all 0.12s ease;
  border: none;
  background: none;
  text-align: left;
  width: 100%;
}
.sidebar-item:hover {
  background: rgba(59, 130, 246, 0.06);
  color: #1e293b;
}
.sidebar-item.active {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  font-weight: 600;
}

.panel-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.panel-header h2 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}
.panel-header p {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.setting-group-title {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 16px 20px 8px;
}
.setting-group-title.danger-zone {
  color: #ef4444;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 20px;
  transition: background 0.12s ease;
}
.setting-row:hover {
  background: rgba(59, 130, 246, 0.04);
}

.setting-label {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}
.setting-desc {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Toggle Switch */
.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: #e2e8f0;
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
  border: none;
  outline: none;
}
.toggle-switch.active {
  background: #3b82f6;
}
.toggle-switch::after {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
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
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 2px;
}
.segmented-btn {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.segmented-btn.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Inputs */
.settings-input {
  padding: 7px 12px;
  font-size: 13px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.settings-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.range-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #e2e8f0;
  outline: none;
}
.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
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
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.btn-primary {
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2);
}
.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-disabled {
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  background: #f8fafc;
  border: none;
  border-radius: 8px;
  cursor: not-allowed;
}

.danger-btn {
  padding: 8px 18px;
  font-size: 12px;
  font-weight: 600;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.danger-btn:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
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
  border-right: 1.5px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1.5px solid rgba(0, 0, 0, 0.12);
}

.settings-main::-webkit-scrollbar {
  width: 5px;
}
.settings-main::-webkit-scrollbar-track {
  background: transparent;
}
.settings-main::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
}
.settings-main::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}
</style>
