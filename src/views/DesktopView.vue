<template>
  <div class="desktop-container h-screen w-screen overflow-hidden relative"
    :class="[workbenchThemeClass, { 'reduce-motion': reduceMotion }]" :style="desktopCssVars"
    @click="handleDesktopClick">
    <div class="absolute inset-0 macos-wallpaper" :style="wallpaperBgStyle"></div>
    <!-- 深色模式壁纸蒙层 -->
    <div class="absolute inset-0 z-[1] pointer-events-none" :style="overlayStyle"></div>

    <!-- 顶部栏 — 全宽无边距无圆角 -->
    <header class="absolute top-0 left-0 right-0 z-50 h-7 flex items-center justify-between px-4" :style="headerStyle">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5">
          <div
            class="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center text-white text-[10px] font-bold">
            C
          </div>
        </div>
        <span class="text-xs font-semibold tracking-tight menubar-text">cnotely</span>
        <div class="menubar-sep"></div>
        <button @click="showLauncher = true" class="menubar-btn">
          <Plus :size="12" /> {{ $t('desktop.new') }}
        </button>
        <button @click="toggleLayoutMode" class="menubar-btn">
          <Grid :size="12" v-if="desktopLayoutMode === 'auto'" />
          <Move :size="12" v-else />
          {{ desktopLayoutMode === "auto" ? $t('desktop.auto') : $t('desktop.free') }}
        </button>
        <button @click="showSetting = true" class="menubar-btn" :title="$t('desktop.settings')">
          <SettingsIcon :size="12" /> {{ $t('desktop.settings') }}
        </button>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs font-medium menubar-text-muted">{{ currentDate }}</span>
        <span class="text-xs font-semibold font-mono menubar-text">{{ currentTime }}</span>
      </div>
    </header>

    <main class="absolute top-7 left-0 right-0 bottom-0 pt-2 px-3">
      <div v-if="desktopLayoutMode === 'auto'"
        class="flex flex-col flex-wrap content-start h-full" :style="autoFlexGap" ref="autoGridRef">
        <DesktopIcon v-for="(app, index) in apps" :key="app.id" :app="app" :is-selected="selectedIconId === app.id"
          :layout-mode="desktopLayoutMode" :grid-size="desktopIconGap" :show-label="showIconLabels" :class="{
            'icon-drop-target':
              dropTargetIndex === index && draggingAppId !== app.id,
          }" @click="handleIconClick" @contextmenu="handleIconContextMenu"
          @reorder="(x, y) => handleReorder(x, y, app.id)" @reorder-end="finishReorder" />
      </div>
      <div v-else class="relative w-full h-full">
        <DesktopIcon v-for="app in apps" :key="app.id" :app="app" :is-selected="selectedIconId === app.id"
          :grid-x="previewPositions[app.id]?.gridX ?? app.gridX" :grid-y="previewPositions[app.id]?.gridY ?? app.gridY"
          :layout-mode="desktopLayoutMode" :grid-size="desktopIconGap" :show-label="showIconLabels" :is-preview="!!previewPositions[app.id]" @click="handleIconClick"
          @contextmenu="handleIconContextMenu" @drag-move="handleIconDragMove" @drag-end="handleIconDragEnd"
          @dragging="handleIconDragging" />
      </div>
    </main>

    <WindowFrame v-for="win in openWindows" :key="win.id" :id="win.id" :title="win.title" :x="win.x" :y="win.y"
      :width="win.width" :height="win.height" :is-active="activeWindowId === win.id" :show-titlebar="false"
      :z-index="win.z" :drag-bar-color="getWindowDragBarColor(win, flippedWindows[win.id])"
      :drag-bar-style="getWindowDragBarStyle(win, flippedWindows[win.id])"
      :dark-drag-bar="!!flippedWindows[win.id] || isDarkWb" :pinned="!!pinnedWindows[win.id]" @close="
        closeWindow(win.id);
      flippedWindows[win.id] = false;
      " @minimize="minimizeWindow(win.id)" @focus="focusWindow"
      @update:position="(pos) => updateWindowPosition(win.id, pos)"
      @update:size="(size) => updateWindowSize(win.id, size)" @dragging="(x, y) => handleWindowDragging(win.id, x, y)"
      @drag-end="handleWindowDragEnd(win.id)" @pin-toggle="togglePinWindow(win.id)">
      <template v-if="win.type === 'card'">
        <CardWindowContent :card-id="win.cardId" :is-active="activeWindowId === win.id" @edit="openEditor"
          @delete="handleDeleteCard" @close="
            closeWindow(win.id);
          flippedWindows[win.id] = false;
          " @flip="flippedWindows[win.id] = $event" />
      </template>
    </WindowFrame>

    <!-- 卡片式 Dock -->
    <div ref="dockWrapperRef" class="absolute bottom-3 left-1/2 -translate-x-1/2 z-[9998]">
      <div class="flex items-center gap-2 px-3 py-2" :style="dockStyle">
        <div class="dock-item" @click="showLauncher = true" @mouseenter="handleDockHover($event, 0)">
          <div class="dock-icon dock-icon-launcher">
            <Plus :size="28" class="text-white" />
          </div>
          <span class="dock-label" v-show="showIconLabels">{{ $t('desktop.new') }}</span>
        </div>

        <div class="dock-separator"></div>

        <div v-for="(cat, index) in categories" :key="cat.id" class="dock-item" @click="openCategoryFolder(cat)"
          @contextmenu.prevent="handleCategoryContextMenu($event, cat)"
          @mouseenter="handleDockHover($event, index + 1)">
          <div class="dock-icon" :style="{
            background:
              cat.customColor || cat.iconColor || getCategoryColor(cat.slug),
          }">
            <component v-if="cat.iconComp && iconComponents[cat.iconComp]" :is="iconComponents[cat.iconComp]" :size="28"
              class="text-white" />
          </div>
          <span class="dock-label" v-show="showIconLabels">{{ cat.name }}</span>
        </div>

        <div class="dock-separator"></div>

        <div class="dock-item" @click="clearCanvas" @mouseenter="handleDockHover($event, categories.length + 1)">
          <div class="dock-icon dock-icon-clear">
            <Eraser :size="28" class="text-white" />
          </div>
          <span class="dock-label" v-show="showIconLabels">{{ $t('desktop.clear') }}</span>
        </div>

        <div class="dock-item" @click="openTrash" @mouseenter="handleDockHover($event, categories.length + 2)">
          <div class="dock-icon dock-icon-trash" :class="{ 'dock-icon-trash-active': isDraggingOverTrash }">
            <Trash2 :size="28" class="text-white" />
          </div>
          <span class="dock-label" v-show="showIconLabels">{{ $t('desktop.trash.title') }}</span>
          <div v-if="isDraggingOverTrash" class="trash-drop-hint">
            <span>{{ $t('desktop.trash.releaseDelete') }}</span>
          </div>
          <Transition name="hint-fade">
            <div v-if="showTrashHint" class="trash-guide-hint" @click.stop="closeTrashHint">
              <div class="trash-guide-hint-content">
                <span>{{ $t('desktop.trash.dragHere') || '拖拽卡片到此处删除' }}</span>
                <button class="trash-guide-hint-close" @click.stop="closeTrashHint">
                  {{ $t('desktop.trash.gotIt') || '知道了' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
        <div v-if="!trashMaximized" class="sheet-resize-handle" @mousedown.stop="trashStartResize"></div>
      </div>
    </div>

    <AppLauncher v-if="showLauncher" @close="showLauncher = false" @create-app="handleCreateApp"
      @create-card="handleCreateCard" @create-category="handleCreateCategory" />

    <Settings v-if="showSetting" @close="showSetting = false" @dataChanged="handleDataChanged" />

    <CardEditor v-if="editorVisible" :card-id="editingCardId" @close="closeEditor" @save="handleSaveCard" />

    <ContextMenu v-if="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenu.items"
      @close="contextMenu.visible = false" @select="handleContextMenuSelect" />

    <div v-if="showAppEditor">
      <div :style="editorSheetStyle" class="macos-sheet" @mousedown="editorBringToFront">
        <div class="sheet-header" @mousedown="editorStartDrag">
          <div class="sheet-title-group">
            <div class="sheet-title-icon sheet-title-icon-edit">
              <Pen :size="14" />
            </div>
            <div class="sheet-title-text">
              <h2>{{ $t('desktop.editLink') }}</h2>
              <span>LINK EDITOR</span>
            </div>
          </div>
          <div class="sheet-drag-bar w-10"></div>
          <div class="sheet-controls">
            <button @click="editorToggleMaximize" class="sheet-control-btn" :title="$t('common.maximizeRestore')">
              <Maximize v-if="!editorMaximized" :size="14" />
              <Minimize2 v-else :size="14" />
            </button>
            <button @click="showAppEditor = false" class="sheet-close" :title="$t('common.close')">
              <X :size="14" />
            </button>
          </div>
        </div>

        <div class="sheet-content">
          <div class="app-edit-form">
            <div class="form-row">
              <label class="form-label">{{ $t('desktop.appName') || '应用名称' }}</label>
              <input v-model="appEditForm.name" type="text" :placeholder="$t('launcher.placeholderName')" class="form-input" />
            </div>
            <div class="form-row">
              <label class="form-label">{{ $t('desktop.linkUrl') || '链接地址' }}</label>
              <input v-model="appEditForm.url" type="url" placeholder="https://..." class="form-input" />
            </div>
            <div class="form-row">
              <label class="form-label">图标</label>
              <div class="icon-mode-tabs">
                <button @click="appEditForm.iconMode = 'favicon'" :class="[
                  'icon-mode-tab',
                  {
                    'icon-mode-tab-active':
                      appEditForm.iconMode === 'favicon',
                  },
                ]">
                  <Globe :size="14" />
                  <span>{{ $t('desktop.webIcon') || '网页图标' }}</span>
                </button>
                <button @click="appEditForm.iconMode = 'text'" :class="[
                  'icon-mode-tab',
                  { 'icon-mode-tab-active': appEditForm.iconMode === 'text' },
                ]">
                  <Pen :size="14" />
                  <span>{{ $t('desktop.textIcon') || '文字图标' }}</span>
                </button>
              </div>
              <div v-if="appEditForm.iconMode === 'favicon'" class="favicon-section">
                <div class="favicon-row">
                  <div class="favicon-preview-box" :style="{ background: appEditForm.color }">
                    <img v-if="appEditFaviconUrl" :src="appEditFaviconUrl" class="favicon-preview-img" />
                    <div v-else class="favicon-preview-placeholder">
                      <Globe :size="20" />
                    </div>
                  </div>
                  <div class="favicon-info">
                    <span class="favicon-label">{{ $t('desktop.autoFetch') || '自动获取' }}</span>
                    <span class="favicon-hint">{{
                      appEditFaviconSource === "apple-touch-icon"
                        ? "apple-touch-icon"
                        : appEditFaviconSource === "favicon.ico"
                          ? "favicon.ico"
                          : "favicon.im 备用"
                    }}</span>
                  </div>
                </div>
                <div class="favicon-colors">
                  <div class="text-icon-colors">
                    <button v-for="c in editPresetColors" :key="c" @click="appEditForm.color = c" :class="[
                      'color-swatch',
                      { 'color-swatch-selected': appEditForm.color === c },
                    ]" :style="{
                      background: c,
                      border: c === '#ffffff' ? '1px solid #e2e8f0' : 'none',
                    }" />
                    <label class="color-picker-wrap" title="自定义颜色">
                      <input type="color" v-model="appEditForm.color" class="color-picker-native" />
                      <Pen :size="12" />
                    </label>
                  </div>
                </div>
              </div>
              <div v-else class="text-icon-row">
                <div class="text-icon-preview" :style="{ background: appEditForm.color }">
                  <span class="text-icon-char">{{ editTextIconChar }}</span>
                </div>
                <div class="text-icon-colors">
                  <button v-for="c in editPresetColors" :key="c" @click="appEditForm.color = c" :class="[
                    'color-swatch',
                    { 'color-swatch-selected': appEditForm.color === c },
                  ]" :style="{
                    background: c,
                    border: c === '#ffffff' ? '1px solid #e2e8f0' : 'none',
                  }" />
                  <label class="color-picker-wrap" title="自定义颜色">
                    <input type="color" v-model="appEditForm.color" class="color-picker-native" />
                    <Pen :size="12" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="sheet-footer">
          <div class="footer-hint"><kbd>Enter</kbd> {{ $t('common.save') }}</div>
          <div class="footer-actions">
            <button @click="showAppEditor = false" class="btn btn-cancel">
              {{ $t('common.cancel') }}
            </button>
            <button @click="saveAppEditor" :disabled="!appEditForm.name.trim() || !appEditForm.url.trim()"
              class="btn btn-create">
              {{ $t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showTrash">
      <div :style="trashSheetStyle" class="macos-sheet" @mousedown="trashBringToFront">
        <div class="sheet-header" @mousedown="trashStartDrag">
          <div class="sheet-title-group">
            <div class="sheet-title-icon sheet-title-icon-trash">
              <Trash2 :size="14" />
            </div>
            <div class="sheet-title-text">
            <h2 class="sheet-title">{{ $t('desktop.trash.title') || '废纸篓' }}</h2>
              <span>TRASH</span>
            </div>
          </div>
          <div class="sheet-drag-bar w-10"></div>
          <div class="sheet-controls">
            <button @click="trashToggleMaximize" class="sheet-control-btn" :title="$t('desktop.trash.maximizeRestore')">
              <Maximize v-if="!trashMaximized" :size="14" />
              <Minimize2 v-else :size="14" />
            </button>
            <button @click="showTrash = false" class="close-button">
              <X :size="14" />
            </button>
          </div>
        </div>

        <div class="sheet-content">
          <div v-if="deletedCards.length === 0 && deletedApps.length === 0" class="trash-empty">
            <p>{{ $t('desktop.trash.empty') || '废纸篓是空的' }}</p>
          </div>
          <div v-else class="trash-list">
            <template v-if="deletedApps.length > 0">
              <div class="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2 mt-1">
                {{ $t('desktop.trash.iconGroup') || '图标' }}
              </div>
              <div v-for="app in deletedApps" :key="'app-' + app.id" class="trash-item">
                <div class="trash-item-info">
                  <p class="trash-item-title">{{ app.name || $t('common.unknown') || "无标题" }}</p>
                  <p class="trash-item-type">{{ $t('desktop.iconTypes.web') }}</p>
                </div>
                <div class="trash-item-actions">
                  <button @click="restoreAppFromTrash(app.id)" class="btn-restore">
                    {{ $t('common.restore') || '恢复' }}
                  </button>
                  <button @click="permanentlyDeleteAppFromTrash(app.id)" class="btn-delete">
                    {{ $t('desktop.trash.permanentDelete') || '彻底删除' }}
                  </button>
                </div>
              </div>
            </template>

            <template v-if="deletedCards.length > 0">
              <div class="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2 mt-2"
                :class="{ 'mt-3': deletedApps.length > 0 }">
                {{ $t('desktop.trash.cardGroup') || '卡片' }}
              </div>
              <div v-for="card in deletedCards" :key="'card-' + card.id" class="trash-item">
                <div class="trash-item-info">
                  <p class="trash-item-title">
                    {{ card.question || $t('common.unknown') || "无标题" }}
                  </p>
                  <p class="trash-item-type">
                    {{ card.type === "article" ? $t('desktop.cardTypes.article') : $t('desktop.cardTypes.memory') }}
                  </p>
                </div>
                <div class="trash-item-actions">
                  <button @click="restoreCard(card.id)" class="btn-restore">
                    {{ $t('common.restore') || '恢复' }}
                  </button>
                  <button @click="permanentlyDeleteCard(card.id)" class="btn-delete">
                    {{ $t('desktop.trash.permanentDelete') || '彻底删除' }}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCategoryEditor" class="macos-overlay fixed inset-0 z-[9999] flex items-center justify-center"
      @click.self="showCategoryEditor = false">
      <div class="macos-sheet" style="width: 440px">
        <div class="sheet-header">
          <h2 class="sheet-title">{{ $t('desktop.contextMenu.editCategory') || '编辑分类' }}</h2>
          <button @click="showCategoryEditor = false" class="close-button">
            <X :size="14" />
          </button>
        </div>
        <div class="sheet-content">
          <div class="form-section">
            <div class="form-row">
              <label class="form-label">{{ $t('desktop.form.categoryName') || '分类名称' }}</label>
              <input v-model="categoryEditForm.name" type="text" :placeholder="$t('launcher.placeholderCategory')" class="form-input" />
            </div>
            <div class="form-row">
              <label class="form-label">{{ $t('desktop.form.icon') || '图标' }}</label>
              <div class="icon-picker-grid">
                <button v-for="preset in categoryPresetIcons" :key="preset.comp"
                  @click="categoryEditForm.comp = preset.comp" :class="[
                    'icon-picker-item',
                    {
                      'icon-picker-selected':
                        categoryEditForm.comp === preset.comp,
                    },
                  ]" :title="preset.label">
                  <div class="icon-picker-circle" :style="{ background: '#e2e8f0' }">
                    <component :is="iconComponents[preset.comp]" :size="18" class="text-slate-600" />
                  </div>
                </button>
              </div>
            </div>
            <div class="form-row">
              <label class="form-label">{{ $t('desktop.form.backgroundColor') || '背景色' }}</label>
              <div class="text-icon-row">
                <div class="text-icon-preview" :style="{ background: categoryEditForm.color }">
                  <component v-if="categoryEditForm.comp" :is="iconComponents[categoryEditForm.comp]" :size="20"
                    class="text-white" />
                </div>
                <div class="text-icon-colors">
                  <button v-for="c in categoryPresetColors" :key="c" @click="categoryEditForm.color = c" :class="[
                    'color-swatch',
                    { 'color-swatch-selected': categoryEditForm.color === c },
                  ]" :style="{
                    background: c,
                    border: c === '#ffffff' ? '1px solid #e2e8f0' : 'none',
                  }" />
                  <label class="color-picker-wrap" title="自定义颜色">
                    <input type="color" v-model="categoryEditForm.color" class="color-picker-native" />
                    <Pen :size="12" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="sheet-footer">
          <button @click="showCategoryEditor = false" class="btn btn-secondary">
            {{ $t('common.cancel') || '取消' }}
          </button>
          <button @click="saveCategoryEditor" :disabled="!categoryEditForm.name.trim()" class="btn btn-primary">
            {{ $t('common.save') || '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "../locales/i18n";
import {
  Plus,
  X,
  Eraser,
  Trash2,
  Grid,
  Move,
  Settings as SettingsIcon,
  Globe,
  BookOpen,
  MessageSquare,
  Camera,
  Music,
  Code2,
  Pen,
  Mail,
  Search,
  MapPin,
  Calendar,
  Cloud,
  ShoppingCart,
  Video,
  Bookmark,
  Terminal,
  Maximize,
  Minimize2,
} from "lucide-vue-next";
import DesktopIcon from "../components/DesktopIcon.vue";
import WindowFrame from "../components/WindowFrame.vue";
import AppLauncher from "../components/AppLauncher.vue";
import Settings from "../components/Settings.vue";
import CardWindowContent from "../components/CardWindowContent.vue";
import CardEditor from "../components/CardEditor.vue";
import ContextMenu from "../components/ContextMenu.vue";
import { useCardStore } from "../composables/useCardStore";
import { useSheetWindow } from "../composables/useSheetWindow";
import { db } from "../db";
import { useSettings } from "../composables/useSettings";

const { t, locale } = useI18n();
const router = useRouter();

const {
  apps,
  allCards,
  categories,
  openWindows,
  activeWindowId,
  selectedIconId,
  desktopLayoutMode,
  initDesktop,
  createApp,
  updateApp,
  deleteApp,
  restoreApp,
  permanentlyDeleteApp,
  loadDeletedApps,
  createCard,
  updateCard,
  deleteCard,
  openCardWindow,
  closeWindow,
  minimizeWindow,
  focusWindow,
  updateWindowPosition,
  updateWindowSize,
  selectIcon,
  clearSelection,
  loadApps,
  loadAllCards,
  setDesktopLayoutMode,
  updateAppPosition,
  createCategory,
  updateCategory,
  deleteCategory,
} = useCardStore();

const currentTime = ref("");
const currentDate = ref("");
const showLauncher = ref(false);
const showSetting = ref(false);
async function handleDataChanged() {
  // 先关闭所有卡片窗口（数据变更后 cardId 可能失效）
  const cardWindowIds = openWindows.value
    .filter((w) => w.type === 'card')
    .map((w) => w.id)
  cardWindowIds.forEach((id) => closeWindow(id))

  await Promise.all([
    loadApps(),
    loadAllCards(),
    loadCategories(),
  ])
  await refreshWallpaper()
}
const { getActiveWallpaperUrl, settings: wallpaperSettings, init } = useSettings()
const wallpaperUrl = ref('')
const wallpaperBgStyle = computed(() => {
  return wallpaperUrl.value
    ? { backgroundImage: `url("${wallpaperUrl.value}")` }
    : {}
})
// ===== 工作台主题核心状态（统一跟随全局界面主题） =====
const workbenchThemeClass = computed(() => `wb-${wallpaperSettings.value.theme}`)
const isDarkWb = computed(() => wallpaperSettings.value.theme === 'dark')
const blurStrength = computed(() => wallpaperSettings.value.blurStrength ?? 25)
const barOpacity = computed(() => wallpaperSettings.value.barOpacity ?? 50)
const reduceMotion = computed(() => wallpaperSettings.value.reduceMotion ?? false)
const dockZoomEnabled = computed(() => wallpaperSettings.value.dockZoom ?? true)
const showIconLabels = computed(() => wallpaperSettings.value.showIconLabels ?? true)
const desktopIconGap = computed(() => wallpaperSettings.value.iconGap ?? 90)
const trashDirectDelete = computed(() => wallpaperSettings.value.trashDirectDelete ?? false)
const autoFlexGap = computed(() => ({
  gap: `${Math.round(desktopIconGap.value * 0.2)}px`,
}))

// ===== 所有背景色全部走 computed → :style，零 CSS 变量依赖 =====

// 壁纸黑色蒙层（深色模式）
const overlayStyle = computed(() => ({
  background: isDarkWb.value ? 'rgba(0,0,0,0.08)' : 'transparent',
}))

// 顶部导航栏
const headerStyle = computed(() => {
  const alpha = (barOpacity.value / 100).toFixed(2)
  return {
    background: isDarkWb.value
      ? `rgba(0,0,0,${(alpha * 0.55).toFixed(2)})`
      : `rgba(255,255,255,${alpha})`,
    backdropFilter: `blur(${blurStrength.value}px) saturate(190%)`,
    WebkitBackdropFilter: `blur(${blurStrength.value}px) saturate(190%)`,
    borderBottom: isDarkWb.value
      ? '0.5px solid rgba(255,255,255,0.08)'
      : '0.5px solid rgba(0,0,0,0.06)',
  }
})

// 分类栏 Dock 托底卡片
const dockStyle = computed(() => ({
  background: isDarkWb.value
    ? 'rgba(0,0,0,0.28)'
    : 'rgba(255,255,255,0.45)',
  border: isDarkWb.value
    ? '1px solid rgba(255,255,255,0.08)'
    : '1px solid rgba(0,0,0,0.06)',
  borderRadius: '16px',
  boxShadow: isDarkWb.value
    ? '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)'
    : '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}))

// 桌面图标需要的 CSS 变量（仅图标选中态和标签颜色，通过 inline style 确保生效）
const desktopCssVars = computed(() => ({
  '--blur-strength': blurStrength.value + 'px',
  '--wb-icon-label': isDarkWb.value ? '#e2e8f0' : '#e2e8f0',
  '--wb-icon-label-shadow': isDarkWb.value ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
  '--wb-icon-selected': isDarkWb.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
}))
async function refreshWallpaper() {
  await init()
  wallpaperUrl.value = getActiveWallpaperUrl()
}
refreshWallpaper()

watch(
  () => [wallpaperSettings.value.wallpaperIndex, wallpaperSettings.value.customWallpaper],
  () => { wallpaperUrl.value = getActiveWallpaperUrl() },
  { deep: true }
)

const editorVisible = ref(false);
const editingCardId = ref(null);
const previewPositions = ref({});
const isDraggingOverTrash = ref(false);
const draggingType = ref(null); // 'app' | 'card'
const draggingId = ref(null);
const flippedWindows = reactive({});
const pinnedWindows = reactive({});
const showTrashHint = ref(false);
const autoGridRef = ref(null);
const dockWrapperRef = ref(null);
const draggingAppId = ref(null);
const dropTargetIndex = ref(-1);

const showAppEditor = ref(false);
const editingApp = ref(null);
const appEditForm = ref({
  name: "",
  url: "",
  icon: "",
  color: "#1d1d1f",
  iconMode: "favicon",
});
const appEditFaviconUrl = ref("");
const appEditFaviconSource = ref("");

const iconComponents = {
  Globe,
  BookOpen,
  MessageSquare,
  Camera,
  Music,
  Code2,
  Pen,
  Mail,
  Search,
  MapPin,
  Calendar,
  Cloud,
  ShoppingCart,
  Video,
  Bookmark,
  Terminal,
};

watch(
  openWindows,
  (windows) => {
    for (const win of windows) {
      if (win.type === "card" && pinnedWindows[win.id] === undefined) {
        const card = allCards.value.find((c) => c.id === win.cardId);
        pinnedWindows[win.id] = card?.pinned || false;
      }
    }
  },
  { immediate: true },
);

// 颜色名称 → 调色板色值（用于无 iconColor 时的色调计算）
const COLOR_PALETTE_MAP = {
  emerald: '#10b981',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  rose: '#f43f5e',
  sky: '#0ea5e9',
  violet: '#7c3aed',
  teal: '#14b8a6',
  orange: '#f97316',
  cyan: '#06b6d4',
  pink: '#ec4899',
  lime: '#84cc16',
  blue: '#3b82f6',
  slate: '#64748b',
};

function getWindowDragBarColor(win, isFlipped) {
  // 拖动栏不再使用 Tailwind 颜色类，改为通过 style 统一控制
  return "";
}

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getWindowDragBarStyle(win, isFlipped) {
  const dark = isDarkWb.value;

  // 翻转（答案面）：与背面内容区使用完全相同的背景色
  if (isFlipped) {
    return { backgroundColor: 'var(--card-back-bg, #1a2332)' };
  }

  if (win.type !== "card") {
    return { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' };
  }

  const card = allCards.value.find((c) => c.id === win.cardId);
  if (!card) {
    return { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' };
  }

  // 有自定义 iconColor：与内容区保持完全相同的 alpha
  if (card.iconColor) {
    const alpha = dark ? 0.25 : 0.2;
    const rgba = hexToRgba(card.iconColor, alpha);
    return rgba ? { backgroundColor: rgba } : {};
  }

  // 无 iconColor：使用颜色名称对应的调色板色值
  const border = card.border || '';
  const match = border.match(/border-t-(\w+)-/);
  const colorKey = match ? match[1] : 'emerald';
  const hex = COLOR_PALETTE_MAP[colorKey] || COLOR_PALETTE_MAP.emerald;
  const alpha = dark ? 0.18 : 0.12;
  const rgba = hexToRgba(hex, alpha);
  return rgba ? { backgroundColor: rgba } : {};
}

function checkTrashHover(clientX, clientY) {
  const trashEl = document.querySelector(".dock-icon-trash");
  if (!trashEl) return false;
  const rect = trashEl.getBoundingClientRect();
  const padding = 40;
  return (
    clientX >= rect.left - padding &&
    clientX <= rect.right + padding &&
    clientY >= rect.top - padding &&
    clientY <= rect.bottom + padding
  );
}

function handleIconDragging(clientX, clientY) {
  isDraggingOverTrash.value = checkTrashHover(clientX, clientY);
}

function handleWindowDragging(windowId, clientX, clientY) {
  if (showTrashHint.value) {
    showTrashHint.value = false;
    localStorage.setItem("trash-hint-shown", "true");
  }
  isDraggingOverTrash.value = checkTrashHover(clientX, clientY);
  draggingType.value = "card";
  const win = openWindows.value.find((w) => w.id === windowId);
  if (win) draggingId.value = win.cardId;
}

function handleWindowDragEnd(windowId) {
  if (isDraggingOverTrash.value && draggingId.value) {
    if (trashDirectDelete.value) {
      db.cards.delete(Number(draggingId.value));
    } else {
      deleteCard(String(draggingId.value));
    }
    closeWindow(windowId);
  }
  isDraggingOverTrash.value = false;
  draggingType.value = null;
  draggingId.value = null;
}

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  items: [],
  target: null,
});

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const weekdays = t('desktop.dateFormat.weekdays') || ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = weekdays[now.getDay()];
  const dateFormat = t('desktop.dateFormat.format') || '{month}月{day}日 {weekday}';
  currentDate.value = dateFormat.replace('{month}', month).replace('{day}', day).replace('{weekday}', weekday);
}

function handleDesktopClick(e) {
  if (
    e.target === e.currentTarget ||
    e.target.classList.contains("macos-wallpaper")
  ) {
    clearSelection();
  }
}

function handleIconClick(app, e) {
  e.stopPropagation();
  if (app.url) {
    if (app.url.startsWith("/")) {
      router.push(app.url);
    } else {
      window.open(app.url, "_blank");
    }
  }
}

function handleReorder(clientX, clientY, appId) {
  isDraggingOverTrash.value = checkTrashHover(clientX, clientY);
  if (!autoGridRef.value) return;

  if (draggingAppId.value !== appId) {
    draggingAppId.value = appId;
  }

  const rect = autoGridRef.value.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  const iconWidth = desktopIconGap.value;
  const iconHeight = desktopIconGap.value;
  const cols = Math.max(1, Math.floor(rect.width / iconWidth));

  const col = Math.floor(x / iconWidth);
  const row = Math.floor(y / iconHeight);

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    dropTargetIndex.value = apps.value.length - 1;
  } else {
    const targetIndex = row * cols + col;
    dropTargetIndex.value = Math.min(targetIndex, apps.value.length - 1);
  }
}

function finishReorder(clientX, clientY) {
  if (
    clientX !== undefined &&
    clientY !== undefined &&
    checkTrashHover(clientX, clientY)
  ) {
    if (draggingAppId.value) {
      const app = apps.value.find((a) => a.id === draggingAppId.value);
      if (!app?.pinned) {
        if (trashDirectDelete.value) {
          permanentlyDeleteApp(draggingAppId.value);
        } else {
          deleteApp(draggingAppId.value);
        }
      }
    }
    isDraggingOverTrash.value = false;
    draggingType.value = null;
    draggingId.value = null;
    draggingAppId.value = null;
    dropTargetIndex.value = -1;
    return;
  }

  if (draggingAppId.value && dropTargetIndex.value >= 0) {
    const fromIndex = apps.value.findIndex((a) => a.id === draggingAppId.value);
    const toIndex = dropTargetIndex.value;

    if (fromIndex !== -1 && fromIndex !== toIndex) {
      const newApps = [...apps.value];
      const [removed] = newApps.splice(fromIndex, 1);
      newApps.splice(toIndex, 0, removed);
      apps.value = newApps;
      saveAppsOrder();
    }
  }

  draggingAppId.value = null;
  dropTargetIndex.value = -1;
}

async function saveAppsOrder() {
  for (let i = 0; i < apps.value.length; i++) {
    await db.apps.update(Number(apps.value[i].id), { sortOrder: i });
  }
}

function toggleLayoutMode() {
  const newMode = desktopLayoutMode.value === "auto" ? "free" : "auto";
  setDesktopLayoutMode(newMode);
}

function handleIconDragMove(appId, gridX, gridY) {
  previewPositions.value = {
    ...previewPositions.value,
    [appId]: { gridX, gridY },
  };
}

async function handleIconDragEnd(appId, gridX, gridY) {
  previewPositions.value = {};

  if (isDraggingOverTrash.value) {
    const app = apps.value.find((a) => a.id === appId);
    if (!app?.pinned) {
      if (trashDirectDelete.value) {
        permanentlyDeleteApp(appId);
      } else {
        deleteApp(appId);
      }
    }
    isDraggingOverTrash.value = false;
    draggingType.value = null;
    draggingId.value = null;
    return;
  }
  isDraggingOverTrash.value = false;
  draggingType.value = null;
  draggingId.value = null;

  if (desktopLayoutMode.value === "free") {
    const occupyingApp = apps.value.find(
      (a) => a.id !== appId && a.gridX === gridX && a.gridY === gridY,
    );

    if (occupyingApp) {
      const draggedApp = apps.value.find((a) => a.id === appId);
      if (draggedApp) {
        await updateAppPosition(
          occupyingApp.id,
          draggedApp.gridX,
          draggedApp.gridY,
        );
      }
    }
  }

  await updateAppPosition(appId, gridX, gridY);
}

function handleIconContextMenu(app, e) {
  e.stopPropagation();
  const items = [{ label: t('desktop.dockMenu.open'), action: "open" }];
  if (!app.pinned) {
    items.push({ label: t('desktop.dockMenu.edit'), action: "edit" });
    items.push({ divider: true });
    items.push({ label: t('desktop.dockMenu.moveToTrash'), action: "delete", danger: true });
  }
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    items,
    target: app,
  };
}

function handleContextMenuSelect(action) {
  const target = contextMenu.value.target;
  contextMenu.value.visible = false;

  if (action === "open" && target?.url) {
    if (target.url.startsWith("/")) {
      router.push(target.url);
    } else {
      window.open(target.url, "_blank");
    }
  } else if (action === "edit" && target?.id) {
    openAppEditor(target);
  } else if (action === "delete" && target?.id) {
    deleteApp(target.id);
  } else if (action === "open-folder" && target?.id) {
    openCategoryFolder(target);
  } else if (action === "edit-category" && target?.id) {
    openCategoryEditor(target);
  } else if (action === "delete-category" && target?.id) {
    deleteCategory(target.slug);
  }
}

const editPresetColors = [
  "#1d1d1f",
  "#ffffff",
  "#64748b",
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#f97316",
  "#ec4899",
];

const editTextIconChar = computed(() => {
  return appEditForm.value.name
    ? appEditForm.value.name.charAt(0).toUpperCase()
    : "A";
});

function getEditDomain(urlStr) {
  if (!urlStr) return "";
  try {
    return new URL(urlStr).hostname;
  } catch {
    return "";
  }
}

async function resolveEditFavicon(urlStr) {
  const domain = getEditDomain(urlStr);
  if (!domain) {
    appEditFaviconUrl.value = "";
    appEditFaviconSource.value = "";
    return;
  }
  const imUrl = `https://favicon.im/${domain}`;
  appEditFaviconUrl.value = imUrl;
  appEditFaviconSource.value = "favicon.im";
  for (const src of [
    `https://${domain}/apple-touch-icon.png`,
    `https://${domain}/favicon.ico`,
  ]) {
    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });
      appEditFaviconUrl.value = src;
      appEditFaviconSource.value = src.includes("apple-touch-icon")
        ? "apple-touch-icon"
        : "favicon.ico";
      return;
    } catch { }
  }
}

watch(
  () => appEditForm.value.url,
  (url) => {
    if (appEditForm.value.iconMode === "favicon") resolveEditFavicon(url);
  },
);
watch(
  () => appEditForm.value.iconMode,
  (mode) => {
    if (mode === "favicon") resolveEditFavicon(appEditForm.value.url);
  },
);

function openAppEditor(app) {
  editingApp.value = app;
  const isEmoji = app.icon && app.icon.length <= 2;
  appEditForm.value = {
    name: app.name || "",
    url: app.url || "",
    icon: app.icon || "",
    color: app.color || "#1d1d1f",
    iconMode: isEmoji ? "text" : "favicon",
  };
  if (!isEmoji) resolveEditFavicon(app.url);
  showAppEditor.value = true;
}

async function saveAppEditor() {
  if (!editingApp.value) return;
  const payload = { ...appEditForm.value };
  if (payload.iconMode === "favicon") {
    payload.icon = appEditFaviconUrl.value;
  } else {
    payload.icon = editTextIconChar.value;
  }
  await updateApp(editingApp.value.id, {
    name: payload.name,
    url: payload.url,
    icon: payload.icon,
    color: payload.color,
  });
  showAppEditor.value = false;
  editingApp.value = null;
}

function getCategoryColor(slug) {
  const colors = {
    frontend: "#10b981",
    vocab: "#f59e0b",
    notes: "#8b5cf6",
    uncategorized: "#64748b",
  };
  return colors[slug] || "#64748b";
}

function openCategoryFolder(cat) {
  const cardsInCategory = cat.isDefault
    ? allCards.value.filter((c) => !c.categoryId || c.categoryId === cat.id)
    : allCards.value.filter((c) => c.categoryId === cat.id);
  cardsInCategory.forEach((card) => {
    openCardWindow(String(card.id));
  });
  activeWindowId.value = null;
}

function handleDockHover(e, index) {
  if (!dockZoomEnabled.value) return
  const items = document.querySelectorAll(".dock-item");
  items.forEach((item, i) => {
    if (i === index) {
      item.style.transform = "translateY(-8px) scale(1.2)";
    } else {
      item.style.transform = "translateY(0) scale(1)";
    }
  });
}

function resetDockScale() {
  const items = document.querySelectorAll(".dock-item");
  items.forEach((item) => {
    item.style.transform = "translateY(0) scale(1)";
  });
}

function handleCreateApp(appData) {
  createApp(appData);
  showLauncher.value = false;
}

async function handleCreateCard(cardData) {
  const cardId = await createCard(cardData);
  showLauncher.value = false;
  openEditor(cardId);
}

async function handleCreateCategory(data) {
  await createCategory(
    data.name,
    data.paletteKey,
    data.customColor,
    data.iconComp,
    data.iconColor,
  );
  showLauncher.value = false;
}

function handleCategoryContextMenu(e, cat) {
  const items = [{ label: t('desktop.contextMenu.openFolder'), action: "open-folder" }];
  if (!cat.isDefault) {
    items.push({ label: t('desktop.contextMenu.editCategory'), action: "edit-category" });
    items.push({ divider: true });
    items.push({ label: t('desktop.contextMenu.deleteCategory'), action: "delete-category", danger: true });
  }
  const menuHeight = items.length * 34 + 8;
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY - menuHeight,
    items,
    target: cat,
  };
}

function openCategoryEditor(cat) {
  editingCategory.value = cat;
  categoryEditForm.value = {
    name: cat.name || "",
    color: cat.customColor || cat.iconColor || "#64748b",
    comp: cat.iconComp || "Globe",
  };
  showCategoryEditor.value = true;
}

async function saveCategoryEditor() {
  if (!editingCategory.value?.id) return;
  await updateCategory(editingCategory.value.id, {
    name: categoryEditForm.value.name.trim(),
    iconColor: categoryEditForm.value.color,
    customColor: categoryEditForm.value.color,
    iconComp: categoryEditForm.value.comp,
  });
  showCategoryEditor.value = false;
  editingCategory.value = null;
}

function openEditor(cardId) {
  editingCardId.value = cardId;
  editorVisible.value = true;
}

function closeEditor() {
  editorVisible.value = false;
  editingCardId.value = null;
}

async function handleSaveCard(cardData) {
  if (editingCardId.value) {
    await updateCard(editingCardId.value, cardData);
    openCardWindow(editingCardId.value);
  }
  closeEditor();
}

async function handleDeleteCard(cardId) {
  await deleteCard(cardId);
}

function clearCanvas() {
  const ids = openWindows.value
    .filter((w) => !pinnedWindows[w.id])
    .map((w) => w.id);
  ids.forEach((id) => closeWindow(id));
}

async function togglePinWindow(windowId) {
  const win = openWindows.value.find((w) => w.id === windowId);
  if (!win || win.type !== "card") return;
  const cardId = win.cardId;
  const newPinned = !pinnedWindows[windowId];
  pinnedWindows[windowId] = newPinned;
  await db.cards.update(Number(cardId), { pinned: newPinned });
  const card = allCards.value.find((c) => c.id === cardId);
  if (card) card.pinned = newPinned;
}

const showTrash = ref(false);

const {
  sheetStyle: trashSheetStyle,
  isMaximized: trashMaximized,
  bringToFront: trashBringToFront,
  startDrag: trashStartDrag,
  startResize: trashStartResize,
  toggleMaximize: trashToggleMaximize,
} = useSheetWindow({
  defaultWidth: 420,
  defaultHeight: 480,
  minWidth: 360,
  minHeight: 300,
  maxWidth: 700,
  maxHeight: 600,
  id: "trash",
});

const {
  sheetStyle: editorSheetStyle,
  isMaximized: editorMaximized,
  bringToFront: editorBringToFront,
  startDrag: editorStartDrag,
  toggleMaximize: editorToggleMaximize,
} = useSheetWindow({
  defaultWidth: 440,
  defaultHeight: 480,
  minWidth: 380,
  minHeight: 360,
  maxWidth: 600,
  maxHeight: 650,
  id: "app-editor",
});

const showCategoryEditor = ref(false);
const editingCategory = ref(null);
const categoryEditForm = ref({
  name: "",
  color: "#1d1d1f",
  comp: "Globe",
});

const categoryPresetColors = [
  "#1d1d1f",
  "#ffffff",
  "#64748b",
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#f97316",
  "#ec4899",
];

const categoryPresetIcons = computed(() => [
  { comp: "Globe", label: t('desktop.iconTypes.web') },
  { comp: "BookOpen", label: t('desktop.iconTypes.doc') },
  { comp: "MessageSquare", label: t('desktop.iconTypes.social') },
  { comp: "Camera", label: t('desktop.iconTypes.image') },
  { comp: "Music", label: t('desktop.iconTypes.music') },
  { comp: "Code2", label: t('desktop.iconTypes.code') },
  { comp: "Pen", label: t('desktop.iconTypes.write') },
  { comp: "Mail", label: t('desktop.iconTypes.mail') },
  { comp: "Search", label: t('desktop.iconTypes.search') },
  { comp: "MapPin", label: t('desktop.iconTypes.map') },
  { comp: "Calendar", label: t('desktop.iconTypes.calendar') },
  { comp: "Cloud", label: t('desktop.iconTypes.cloud') },
  { comp: "ShoppingCart", label: t('desktop.iconTypes.shop') },
  { comp: "Video", label: t('desktop.iconTypes.video') },
  { comp: "Bookmark", label: t('desktop.iconTypes.favorite') },
  { comp: "Terminal", label: t('desktop.iconTypes.tool') },
]);

function openTrash() {
  loadTrashItems();
  showTrash.value = true;
}

const deletedCards = ref([]);
const deletedApps = ref([]);

async function loadTrashItems() {
  deletedCards.value = await db.cards.where("categoryId").equals(-1).toArray();
  deletedApps.value = await loadDeletedApps();
}

async function restoreCard(cardId) {
  await db.cards.update(cardId, { categoryId: null });
  await loadTrashItems();
  await loadAllCards();
}

async function restoreAppFromTrash(appId) {
  await restoreApp(appId);
  await loadTrashItems();
}

function closeTrashHint() {
  showTrashHint.value = false;
  localStorage.setItem("trash-hint-shown", "true");
}

async function permanentlyDeleteCard(cardId) {
  await db.cards.delete(cardId);
  await loadTrashItems();
}

async function permanentlyDeleteAppFromTrash(appId) {
  await permanentlyDeleteApp(appId);
  await loadTrashItems();
}

onMounted(async () => {
  await initDesktop();
  updateTime();
  setInterval(updateTime, 1000);

  const dockWrapper = dockWrapperRef.value;
  if (dockWrapper) {
    dockWrapper.addEventListener("mouseleave", resetDockScale);
  }

  if (!localStorage.getItem("trash-hint-shown")) {
    setTimeout(() => {
      showTrashHint.value = true;
    }, 1500);
  }
});

onUnmounted(() => {
  clearInterval(updateTime);
});
</script>

<style scoped>
.desktop-container {
  font-family:
    -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
    "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.icon-drop-target {
  position: relative;
}

.icon-drop-target::before {
  content: "";
  position: absolute;
  inset: -4px;
  border: 2px dashed rgba(59, 130, 246, 0.6);
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.1);
  animation: drop-target-pulse 1s ease-in-out infinite;
}

@keyframes drop-target-pulse {

  0%,
  100% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }
}

.macos-wallpaper {
  background-image: url("https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=1920&q=80");
  background-size: cover;
  background-position: center;
  backdrop-filter: blur(var(--blur-strength, 25px)) saturate(190%);
  -webkit-backdrop-filter: blur(var(--blur-strength, 25px)) saturate(190%);
}

.macos-menubar {
  /* 已迁移到卡片式顶栏 — 使用 .wb-card */
}

.macos-dock-wrapper {
  /* 已迁移到卡片式 Dock */
  padding: 0;
}

.macos-dock {
  /* 已移除玻璃条样式 — 使用 .wb-card */
}

.dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px 3px;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
}

.dock-icon {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #64748b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: box-shadow 0.2s, transform 0.15s;
}

.dock-icon:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.dock-icon-launcher {
  background: #6366f1;
}

.dock-icon-clear {
  background: #ec4899;
}

.dock-icon-trash {
  background: #64748b;
}

.dock-icon-trash-active {
  background: #ef4444;
  transform: scale(1.2);
  box-shadow:
    0 0 30px rgba(239, 68, 68, 0.6),
    0 0 60px rgba(239, 68, 68, 0.3),
    0 8px 25px rgba(0, 0, 0, 0.3);
  animation: trash-pulse 0.8s ease-in-out infinite;
}

@keyframes trash-pulse {

  0%,
  100% {
    transform: scale(1.2);
    box-shadow:
      0 0 30px rgba(239, 68, 68, 0.6),
      0 0 60px rgba(239, 68, 68, 0.3),
      0 8px 25px rgba(0, 0, 0, 0.3);
  }

  50% {
    transform: scale(1.25);
    box-shadow:
      0 0 40px rgba(239, 68, 68, 0.8),
      0 0 80px rgba(239, 68, 68, 0.4),
      0 10px 30px rgba(0, 0, 0, 0.35);
  }
}

.trash-drop-hint {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(239, 68, 68, 0.95);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: hint-bounce 0.6s ease-in-out infinite;
}

.trash-drop-hint::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(239, 68, 68, 0.95);
}

@keyframes hint-bounce {

  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }

  50% {
    transform: translateX(-50%) translateY(-4px);
  }
}

.trash-guide-hint {
  position: absolute;
  bottom: calc(100% + 60px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.trash-guide-hint-content {
  background: rgba(30, 30, 30, 0.95);
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  white-space: nowrap;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: hint-appear 0.4s ease-out;
}

.trash-guide-hint-content::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: rgba(30, 30, 30, 0.95);
}

.trash-guide-hint-close {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.trash-guide-hint-close:hover {
  background: rgba(255, 255, 255, 0.25);
}

@keyframes hint-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.3s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

.dock-label {
  font-size: 11px;
  margin-top: 2px;
  text-align: center;
  max-width: 56px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-light .dock-label {
  color: #FFF;
  text-shadow: none;
}

/* .wb-light .dock-label {
  text-shadow: none;
} */

.wb-dark .dock-label {
  color: #e2e8f0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.dock-separator {
  width: 1px;
  height: 28px;
  margin: 0 2px;
  align-self: center;
}

.wb-light .dock-separator {
  background: rgba(0, 0, 0, 0.06);
}

.wb-dark .dock-separator {
  background: rgba(255, 255, 255, 0.08);
}

.macos-overlay {
  background: var(--overlay-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.macos-sheet {
  font-family:
    -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
    "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  background: transparent;
  border: none;
  border-radius: 16px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.9),
    inset 0 -0.5px 0 rgba(0, 0, 0, 0.03);
  width: 420px;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ===== 统一磨砂（与 Settings.vue 完全一致）===== */
.sheet-header,
.sheet-content,
.sheet-footer {
  background: var(--panel-bg);
  backdrop-filter: blur(30px) saturate(190%);
  -webkit-backdrop-filter: blur(30px) saturate(190%);
}

.sheet-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 0.5px solid var(--border-subtle);
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
}
.sheet-title-group {
  min-width: 0;
}
.sheet-drag-bar {
  justify-self: center;
}
.sheet-controls {
  justify-self: end;
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-title-icon svg {
  width: 15px;
  height: 15px;
  color: white;
}

.sheet-title-icon-trash {
  background: linear-gradient(135deg, #64748b, #475569);
  box-shadow: 0 2px 10px rgba(71, 85, 105, 0.25);
}

.sheet-title-icon-edit {
  background: linear-gradient(135deg, #0ea5e9, #38bdf8);
  box-shadow: 0 2px 10px rgba(14, 165, 233, 0.25);
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

.close-button {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--kbd-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-tertiary);
  border: none;
}

.close-button:hover {
  background: var(--button-secondary-bg);
  color: var(--text-primary);
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

.sheet-content {
  padding: 16px 20px;
  max-height: 50vh;
  overflow-y: auto;
  flex: 1;
}

.trash-empty {
  text-align: center;
  padding: 48px 0;
  color: var(--text-muted);
  font-size: 13px;
}

.trash-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trash-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--input-bg);
  transition: background 0.15s ease;
}

.trash-item:hover {
  background: var(--input-bg-hover);
}

.trash-item-info {
  flex: 1;
  min-width: 0;
}

.trash-item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trash-item-type {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.trash-item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 12px;
  flex-shrink: 0;
}

.btn-restore,
.btn-delete {
  padding: 5px 12px;
  border-radius: 6px;
  border: none;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-restore {
  background: var(--button-secondary-bg);
  color: var(--text-label);
}

.btn-restore:hover {
  background: var(--button-secondary-hover);
}

.btn-delete {
  background: var(--danger-light);
  color: var(--danger);
  border: 1px solid var(--danger-light);
}

.btn-delete:hover {
  background: var(--danger);
  color: white;
}

.app-edit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}

.form-input {
  font-family: inherit;
  font-size: 13px;
  padding: 9px 12px;
  border: 1px solid var(--border-input);
  border-radius: 10px;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all 0.15s ease;
  outline: none;
}

.form-input::placeholder {
  color: var(--text-placeholder);
}

.form-input:focus {
  background: var(--input-bg-hover);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.icon-mode-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.icon-mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  border: none;
  background: var(--segmented-bg);
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.icon-mode-tab:hover {
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
}

.icon-mode-tab-active {
  border-color: var(--accent);
  background: var(--accent-strong);
  color: var(--accent);
}

.favicon-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.favicon-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.favicon-preview-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--border-input);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--input-bg);
  flex-shrink: 0;
  overflow: hidden;
}

.favicon-preview-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.favicon-preview-placeholder {
  color: var(--text-muted);
}

.favicon-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.favicon-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.favicon-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.favicon-colors {
  padding-left: 56px;
}

.text-icon-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.text-icon-preview {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.text-icon-char {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.text-icon-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.color-swatch:hover {
  transform: scale(1.15);
}

.color-swatch-selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.color-picker-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px dashed var(--border-input);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-tertiary);
  position: relative;
  transition: all 0.15s ease;
  background: var(--input-bg);
}

.color-picker-wrap:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.color-picker-native {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.sheet-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 0.5px solid var(--border-subtle);
  flex-shrink: 0;
}

.footer-hint {
  font-size: 10px;
  color: #5a5e64;
  display: flex;
  align-items: center;
  gap: 5px;
}
.footer-hint kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
  border: none;
}

.footer-actions {
  display: flex;
  gap: 6px;
}

.btn {
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.btn-cancel {
  background: rgba(0, 0, 0, 0.06);
  color: #424245;
}
.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #1a1a2e;
}

.btn-create {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2);
}
.btn-create:hover {
  background: #2563eb;
}
.btn-create:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--button-secondary-bg);
  color: var(--text-label);
}

.btn-secondary:hover {
  background: var(--button-secondary-hover);
}

.btn-primary {
  background: var(--accent);
  color: white;
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2);
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.icon-picker-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.icon-picker-item {
  background: none;
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 2px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--input-bg);
}

.icon-picker-item:hover {
  border-color: var(--border-input);
  background: var(--input-bg-hover);
}

.icon-picker-selected {
  border-color: var(--accent);
  background: var(--accent-light);
}

.icon-picker-circle {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.sheet-content::-webkit-scrollbar {
  width: 5px;
}

.sheet-content::-webkit-scrollbar-track {
  background: transparent;
}

.sheet-content::-webkit-scrollbar-thumb {
  background: var(--border-input);
  border-radius: 10px;
}

.sheet-content::-webkit-scrollbar-thumb:hover {
  background: var(--separator);
}

/* 顶部栏 compact 按钮 — 直接跟随 wb-light/wb-dark，不依赖 CSS 变量 */
.menubar-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 5px;
  border-radius: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-size: 11px;
}

.wb-light .menubar-btn {
  color: #1e293b;
}

.wb-dark .menubar-btn {
  color: #e2e8f0;
}

.wb-light .menubar-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #3b82f6;
}

.wb-dark .menubar-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #60a5fa;
}

.menubar-text {
  /* handled by parent class */
}

.wb-light .menubar-text {
  color: #1e293b;
}

.wb-dark .menubar-text {
  color: #e2e8f0;
}

.wb-light .menubar-text-muted {
  color: #64748b;
}

.wb-dark .menubar-text-muted {
  color: #94a3b8;
}

.menubar-sep {
  width: 1px;
  height: 14px;
  flex-shrink: 0;
}

.wb-light .menubar-sep {
  background: rgba(0, 0, 0, 0.06);
}

.wb-dark .menubar-sep {
  background: rgba(255, 255, 255, 0.08);
}

/* 减少动画 */
.reduce-motion *,
.reduce-motion *::before,
.reduce-motion *::after {
  transition-duration: 0s !important;
  animation-duration: 0s !important;
}
</style>
