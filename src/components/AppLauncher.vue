<template>
  <div
    ref="sheetRef"
    :style="sheetStyle"
    :class="['launcher-sheet', 'overflow-hidden', 'flex', 'flex-col', shouldUseDarkTheme ? 'app-launcher--dark' : '']"
    @mousedown="bringToFront"
  >
    <div class="sheet-header" @mousedown="startDrag">
      <div class="sheet-title-group">
        <div class="sheet-title-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <div class="sheet-title-text">
          <h2>新建内容</h2>
          <span>CREATOR</span>
        </div>
      </div>
      <div class="sheet-drag-bar w-10"></div>
      <div class="sheet-controls">
        <button
          @click="toggleMaximize"
          class="sheet-control-btn"
          title="最大化/还原"
        >
          <Maximize v-if="!isMaximized" :size="14" />
          <Minimize2 v-else :size="14" />
        </button>
        <button @click="emit('close')" class="sheet-close" title="关闭">
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

    <div class="sheet-body">
      <section class="type-hero">
        <div class="type-grid">
          <div
            :class="['type-card', 'stagger-1', { active: activeTab === 'app' }]"
            data-type="link"
            @click="activeTab = 'app'"
          >
            <span class="type-indicator"></span>
            <div class="type-icon-wrap type-icon-link">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                />
                <path
                  d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                />
              </svg>
            </div>
            <span class="type-label">链接</span>
          </div>

          <div
            :class="[
              'type-card',
              'stagger-2',
              { active: activeTab === 'category' },
            ]"
            data-type="category"
            @click="activeTab = 'category'"
          >
            <span class="type-indicator"></span>
            <div class="type-icon-wrap type-icon-category">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </div>
            <span class="type-label">分类</span>
          </div>

          <div
            :class="['type-card', 'stagger-3', { active: activeTab === 'qa' }]"
            data-type="qa"
            @click="activeTab = 'qa'"
          >
            <span class="type-indicator"></span>
            <div class="type-icon-wrap type-icon-qa">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6M9 13h6M9 17h4" />
              </svg>
            </div>
            <span class="type-label">记忆卡</span>
          </div>

          <div
            :class="[
              'type-card',
              'stagger-4',
              { active: activeTab === 'article' },
            ]"
            data-type="article"
            @click="activeTab = 'article'"
          >
            <span class="type-indicator"></span>
            <div class="type-icon-wrap type-icon-article">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <span class="type-label">文章卡</span>
          </div>
        </div>
      </section>

      <section class="form-area">
        <!-- Panel: Link -->
        <div v-if="activeTab === 'app'" class="form-panel visible">
          <div class="form-row">
            <label class="form-label">应用名称</label>
            <input
              v-model="appForm.name"
              type="text"
              placeholder="例如：GitHub"
              class="form-input"
            />
          </div>
          <div class="form-row">
            <label class="form-label">链接地址</label>
            <input
              v-model="appForm.url"
              type="url"
              placeholder="https://..."
              class="form-input"
            />
          </div>
          <div class="form-row">
            <label class="form-label">图标</label>
            <div class="icon-mode-tabs">
              <button
                @click="appForm.iconMode = 'favicon'"
                :class="[
                  'icon-mode-tab',
                  { active: appForm.iconMode === 'favicon' },
                ]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path
                    d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"
                  />
                </svg>
                网页图标
              </button>
              <button
                @click="appForm.iconMode = 'text'"
                :class="[
                  'icon-mode-tab',
                  { active: appForm.iconMode === 'text' },
                ]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                </svg>
                文字图标
              </button>
            </div>
            <div class="favicon-row">
              <div
                class="favicon-preview-box"
                :style="{ background: appForm.color }"
              >
                <img
                  v-if="faviconUrl && appForm.iconMode === 'favicon'"
                  :src="faviconUrl"
                  class="favicon-preview-img"
                />
                <div v-else class="favicon-placeholder">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path
                      d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"
                    />
                  </svg>
                </div>
              </div>
              <div class="favicon-info">
                <span class="favicon-info-label">{{
                  faviconSource ? faviconSource : "自动获取"
                }}</span>
                <span class="favicon-info-hint font-mono">{{
                  faviconSource ? "" : "输入网址后抓取"
                }}</span>
              </div>
            </div>
            <div class="color-row">
              <div class="color-swatches">
                <button
                  v-for="c in presetColors"
                  :key="c"
                  @click="appForm.color = c"
                  :class="['color-swatch', { active: appForm.color === c }]"
                  :style="{
                    background: c,
                    border:
                      c === '#ffffff' ? '1px solid rgba(0,0,0,0.08)' : 'none',
                  }"
                ></button>
                <label class="color-swatch-custom" title="自定义颜色">
                  <input type="color" v-model="appForm.color" />
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  </svg>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel: Category -->
        <div v-if="activeTab === 'category'" class="form-panel visible">
          <div class="form-row">
            <label class="form-label">分类名称</label>
            <input
              v-model="categoryForm.name"
              type="text"
              placeholder="例如：设计灵感"
              class="form-input"
            />
          </div>
          <div class="form-row">
            <label class="form-label">图标</label>
            <div class="icon-picker-grid">
              <button
                v-for="preset in presetIcons"
                :key="preset.comp"
                @click="selectCategoryPreset(preset)"
                :class="[
                  'icon-picker-item',
                  { active: categoryForm.comp === preset.comp },
                ]"
                :title="preset.label"
              >
                <component :is="iconComponents[preset.comp]" :size="16" />
              </button>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">背景色</label>
            <div class="color-row">
              <div
                class="text-icon-preview"
                :style="{ background: categoryForm.color }"
              >
                <component
                  v-if="categoryForm.comp"
                  :is="iconComponents[categoryForm.comp]"
                  :size="18"
                  class="text-white"
                />
              </div>
              <div class="color-swatches">
                <button
                  v-for="c in presetColors"
                  :key="c"
                  @click="categoryForm.color = c"
                  :class="[
                    'color-swatch',
                    { active: categoryForm.color === c },
                  ]"
                  :style="{
                    background: c,
                    border:
                      c === '#ffffff' || c === '#f1f5f9'
                        ? '1px solid rgba(0,0,0,0.08)'
                        : 'none',
                  }"
                ></button>
                <label class="color-swatch-custom" title="自定义颜色">
                  <input type="color" v-model="categoryForm.color" />
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  </svg>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel: QA / Article -->
        <div
          v-if="activeTab === 'qa' || activeTab === 'article'"
          class="form-panel visible"
        >
          <div class="hint-bar">
            <span class="hint-badge">步骤 1/2</span>
            <span class="hint-text"
              >选择分类后点击创建，进入编辑器填写内容</span
            >
          </div>
          <div class="form-row">
            <label class="form-label">分类</label>
            <div
              class="cat-select-trigger"
              ref="categoryDropdownRef"
              @click="toggleCategoryDropdown"
            >
              <div
                class="cat-select-dot"
                :style="{ background: selectedCatColor || '#C8C9CC' }"
              >
                <component
                  v-if="selectedCatIcon"
                  :is="selectedCatIcon"
                  :size="11"
                  class="text-white"
                />
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span class="cat-select-label">{{ selectedCatLabel }}</span>
              <span class="cat-select-arrow">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>
            <Teleport to="body">
              <div
                v-if="showCategoryDropdown"
                class="cat-dropdown"
                :style="dropdownPosition"
                ref="teleportedDropdownRef"
              >
                <button
                  @click="
                    cardForm.categoryId = null;
                    showCategoryDropdown = false;
                  "
                  class="cat-dropdown-item"
                >
                  <div class="cat-select-dot" style="background: #c8c9cc">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                      />
                    </svg>
                  </div>
                  <span>未分类</span>
                </button>
                <button
                  v-for="cat in categories"
                  :key="cat.id"
                  @click="
                    cardForm.categoryId = cat.id;
                    showCategoryDropdown = false;
                  "
                  class="cat-dropdown-item"
                >
                  <div
                    class="cat-select-dot"
                    :style="{
                      background: cat.iconColor || cat.customColor || '#64748b',
                    }"
                  >
                    <component
                      v-if="cat.iconComp && iconComponents[cat.iconComp]"
                      :is="iconComponents[cat.iconComp]"
                      :size="11"
                      class="text-white"
                    />
                  </div>
                  <span>{{ cat.name }}</span>
                </button>
              </div>
            </Teleport>
          </div>
          <div class="form-row">
            <label class="form-label">来源链接（可选）</label>
            <input
              v-model="cardForm.source"
              type="url"
              placeholder="https://..."
              class="form-input"
            />
          </div>
        </div>
      </section>
    </div>

    <footer class="sheet-footer">
      <div class="footer-hint"><kbd>Esc</kbd> 关闭 · <kbd>Enter</kbd> 创建</div>
      <div class="footer-actions">
        <button @click="emit('close')" class="btn btn-cancel">取消</button>
        <button
          @click="handleCreate"
          :disabled="!canCreate"
          class="btn btn-create"
        >
          创建
        </button>
      </div>
    </footer>
    <div
      v-if="!isMaximized"
      class="sheet-resize-handle"
      @mousedown.stop="startResize"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { Maximize, Minimize2 } from "lucide-vue-next";
import {
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
} from "lucide-vue-next";
import { useCardStore } from "../composables/useCardStore";
import { useSheetWindow } from "../composables/useSheetWindow";
import { useSettings } from "../composables/useSettings";

const emit = defineEmits([
  "close",
  "create-app",
  "create-card",
  "create-category",
]);

const {
  sheetStyle,
  isMaximized,
  bringToFront,
  startDrag,
  startResize,
  toggleMaximize,
} = useSheetWindow({
  defaultWidth: 540,
  defaultHeight: 520,
  minWidth: 420,
  minHeight: 380,
  maxWidth: 800,
  maxHeight: 700,
  id: "launcher",
});

const { categories } = useCardStore();
const { settings } = useSettings();

const shouldUseDarkTheme = computed(() => settings.value.theme === 'dark');

// 根据默认卡片类型初始化标签页
const defaultTab = computed(() => {
  const dt = settings.value.defaultCardType;
  if (dt === 'article') return 'article';
  return 'qa';
});

const activeTab = ref(defaultTab.value);
const showCategoryDropdown = ref(false);
const categoryDropdownRef = ref(null);
const teleportedDropdownRef = ref(null);
const dropdownPosition = ref({});

const appForm = ref({
  name: "",
  url: "",
  icon: "",
  color: "#1d1d1f",
  iconMode: "favicon",
});
const cardForm = ref({ source: "", categoryId: null });
const categoryForm = ref({
  name: "",
  color: "#64748b",
  comp: "Globe",
});

const selectedCatIcon = computed(() => {
  if (!cardForm.value.categoryId) return null;
  const cat = categories.value.find((c) => c.id === cardForm.value.categoryId);
  return cat?.iconComp ? iconComponents[cat.iconComp] : null;
});

const selectedCatColor = computed(() => {
  if (!cardForm.value.categoryId) return null;
  const cat = categories.value.find((c) => c.id === cardForm.value.categoryId);
  return cat?.iconColor || cat?.customColor || null;
});

const selectedCatLabel = computed(() => {
  if (!cardForm.value.categoryId) return "未分类";
  const cat = categories.value.find((c) => c.id === cardForm.value.categoryId);
  return cat?.name || "未分类";
});

const hexToPaletteKey = {
  "#3b82f6": "blue",
  "#8b5cf6": "violet",
  "#10b981": "emerald",
  "#f59e0b": "amber",
  "#ec4899": "pink",
  "#6366f1": "violet",
  "#f97316": "orange",
  "#64748b": "sky",
  "#14b8a6": "teal",
  "#ef4444": "rose",
  "#a855f7": "purple",
  "#38bdf8": "sky",
  "#e11d48": "rose",
  "#1e293b": "blue",
};

const faviconUrl = ref("");
const faviconSource = ref("");

function getDomain(urlStr) {
  if (!urlStr) return "";
  try {
    return new URL(urlStr).hostname;
  } catch {
    return "";
  }
}

async function resolveFavicon(urlStr) {
  const domain = getDomain(urlStr);
  if (!domain) {
    faviconUrl.value = "";
    faviconSource.value = "";
    return;
  }

  const imUrl = `https://favicon.im/${domain}`;
  faviconUrl.value = imUrl;
  faviconSource.value = "favicon.im";

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
      faviconUrl.value = src;
      faviconSource.value = src.includes("apple-touch-icon")
        ? "apple-touch-icon"
        : "favicon.ico";
      return;
    } catch {}
  }
}

watch(
  () => appForm.value.url,
  (url) => {
    if (appForm.value.iconMode === "favicon") resolveFavicon(url);
  },
);

watch(
  () => appForm.value.iconMode,
  (mode) => {
    if (mode === "favicon") resolveFavicon(appForm.value.url);
  },
);

function toggleCategoryDropdown() {
  showCategoryDropdown.value = !showCategoryDropdown.value;
  if (showCategoryDropdown.value) {
    nextTick(() => updateDropdownPosition());
  }
}

function updateDropdownPosition() {
  const trigger = categoryDropdownRef.value;
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  dropdownPosition.value = {
    top: rect.bottom + 4 + "px",
    left: rect.left + "px",
    width: rect.width + "px",
  };
}

function handleClickOutside(e) {
  if (
    categoryDropdownRef.value &&
    !categoryDropdownRef.value.contains(e.target) &&
    teleportedDropdownRef.value &&
    !teleportedDropdownRef.value.contains(e.target)
  ) {
    showCategoryDropdown.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside, true));
onUnmounted(() =>
  document.removeEventListener("click", handleClickOutside, true),
);

const textIconChar = computed(() => {
  return appForm.value.name ? appForm.value.name.charAt(0).toUpperCase() : "A";
});

const presetColors = [
  "#1d1d1f",
  "#f1f5f9",
  "#64748b",
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#f97316",
  "#ec4899",
];

const presetIcons = [
  { comp: "Globe", label: "网页" },
  { comp: "BookOpen", label: "文档" },
  { comp: "MessageSquare", label: "社交" },
  { comp: "Camera", label: "图片" },
  { comp: "Music", label: "音乐" },
  { comp: "Code2", label: "代码" },
  { comp: "Pen", label: "写作" },
  { comp: "Mail", label: "邮件" },
  { comp: "Search", label: "搜索" },
  { comp: "MapPin", label: "地图" },
  { comp: "Calendar", label: "日历" },
  { comp: "Cloud", label: "云盘" },
  { comp: "ShoppingCart", label: "购物" },
  { comp: "Video", label: "视频" },
  { comp: "Bookmark", label: "收藏" },
  { comp: "Terminal", label: "工具" },
];

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

function selectCategoryPreset(preset) {
  categoryForm.value.comp = preset.comp;
}

const canCreate = computed(() => {
  if (activeTab.value === "app")
    return appForm.value.name.trim() && appForm.value.url.trim();
  if (activeTab.value === "category") return categoryForm.value.name.trim();
  return true;
});

function handleCreate() {
  if (activeTab.value === "app") {
    const payload = { ...appForm.value };
    if (payload.iconMode === "favicon") {
      payload.icon = faviconUrl.value;
    } else {
      payload.icon = textIconChar.value;
    }
    emit("create-app", payload);
    appForm.value = {
      name: "",
      url: "",
      icon: "",
      color: "#1d1d1f",
      iconMode: "favicon",
    };
  } else if (activeTab.value === "category") {
    const paletteKey = hexToPaletteKey[categoryForm.value.color] || "sky";
    emit("create-category", {
      name: categoryForm.value.name.trim(),
      paletteKey,
      customColor: categoryForm.value.color,
      iconComp: categoryForm.value.comp,
      iconColor: categoryForm.value.color,
    });
    categoryForm.value = { name: "", color: "#64748b", comp: "Globe" };
  } else {
    emit("create-card", { ...cardForm.value, type: activeTab.value });
    cardForm.value = { source: "", categoryId: null };
  }
}
</script>

<style scoped>
.launcher-sheet {
  background: transparent;
  border: none;
  border-radius: 16px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.9),
    inset 0 -0.5px 0 rgba(0, 0, 0, 0.03);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* animation: sheetEnter 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; */
}
@keyframes sheetEnter {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== 统一磨砂（与 Settings.vue 完全一致）===== */
.sheet-header,
.sheet-body,
.sheet-footer {
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

/* 内容区 */
.sheet-body {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
}
.type-hero {
  padding: 14px 20px 0;
}
.type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.type-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 6px 10px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}
.type-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 0%,
    var(--card-glow, transparent) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.2s ease;
}
.type-card:hover {
  background: var(--input-bg);
  transform: scale(1.02);
}
.type-card:hover::before {
  opacity: 1;
}
.type-card.active {
  background: var(--card-bg, rgba(99, 102, 241, 0.1));
  box-shadow: 0 0 0 1px var(--card-accent, #6366f1);
}
.type-card.active::before {
  opacity: 1;
}

.type-card[data-type="link"] {
  --card-accent: #0ea5e9;
  --card-glow: rgba(14, 165, 233, 0.12);
  --card-glow-accent: rgba(14, 165, 233, 0.2);
  --card-bg: rgba(14, 165, 233, 0.05);
}
.type-card[data-type="category"] {
  --card-accent: #8b5cf6;
  --card-glow: rgba(139, 92, 246, 0.12);
  --card-glow-accent: rgba(139, 92, 246, 0.2);
  --card-bg: rgba(139, 92, 246, 0.05);
}
.type-card[data-type="qa"] {
  --card-accent: #10b981;
  --card-glow: rgba(16, 185, 129, 0.12);
  --card-glow-accent: rgba(16, 185, 129, 0.2);
  --card-bg: rgba(16, 185, 129, 0.05);
}
.type-card[data-type="article"] {
  --card-accent: #d97706;
  --card-glow: rgba(217, 119, 6, 0.12);
  --card-glow-accent: rgba(217, 119, 6, 0.2);
  --card-bg: rgba(217, 119, 6, 0.05);
}

.type-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  position: relative;
  transition: transform 0.25s ease;
}
.type-card:hover .type-icon-wrap {
  transform: scale(1.06);
}
.type-icon-wrap svg {
  width: 16px;
  height: 16px;
  color: #fff;
}

.type-icon-link {
  background: linear-gradient(145deg, #38bdf8 0%, #0ea5e9 100%);
  box-shadow: 0 2px 10px -3px rgba(14, 165, 233, 0.4);
}
.type-icon-category {
  background: linear-gradient(145deg, #c4b5fd 0%, #a78bfa 100%);
  box-shadow: 0 2px 10px -3px rgba(167, 139, 250, 0.4);
}
.type-icon-qa {
  background: linear-gradient(145deg, #6ee7b7 0%, #34d399 100%);
  box-shadow: 0 2px 10px -3px rgba(52, 211, 153, 0.4);
}
.type-icon-article {
  background: linear-gradient(145deg, #fcd34d 0%, #fbbf24 100%);
  box-shadow: 0 2px 10px -3px rgba(251, 191, 36, 0.4);
}

.type-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #1a1a2e;
}

.type-indicator {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--card-accent, #6366f1);
  opacity: 0;
  transform: scale(0);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.type-card.active .type-indicator {
  opacity: 1;
  transform: scale(1);
  box-shadow: 0 0 6px var(--card-glow-accent, rgba(99, 102, 241, 0.2));
}

.stagger-1 {
  animation-delay: 0.06s;
}
.stagger-2 {
  animation-delay: 0.12s;
}
.stagger-3 {
  animation-delay: 0.18s;
}
.stagger-4 {
  animation-delay: 0.24s;
}

.form-area {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 180px;
}
.form-panel {
  animation: panelIn 0.3s ease-out both;
}
@keyframes panelIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.form-label {
  font-size: 11px;
  font-weight: 600;
  color: #424245;
  letter-spacing: 0.02em;
}
.form-input {
  font-family: inherit;
  font-size: 13px;
  padding: 9px 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  background: transparent;
  color: #1a1a2e;
  transition: all 0.15s ease;
  outline: none;
}
.form-input::placeholder {
  color: #64748b;
}
.form-input:focus {
  background: var(--input-bg-hover);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.icon-mode-tabs {
  display: flex;
  gap: 6px;
}
.icon-mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #5a5e64;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}
.icon-mode-tab:hover {
  background: var(--input-bg);
  color: var(--text-secondary);
}
.icon-mode-tab.active {
  background: var(--accent-strong);
  color: var(--accent);
}
.icon-mode-tab svg {
  width: 14px;
  height: 14px;
}

.favicon-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
  padding-bottom: 5px;
}
.favicon-preview-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  flex-shrink: 0;
  overflow: hidden;
  transition: all 0.2s ease;
}
.favicon-preview-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.favicon-placeholder {
  color: #64748b;
}
.favicon-placeholder svg {
  width: 18px;
  height: 18px;
}
.favicon-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.favicon-info-label {
  font-size: 12px;
  font-weight: 500;
  color: #1a1a2e;
}
.favicon-info-hint {
  font-size: 10px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  flex: 1;
}
.color-swatch {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.color-swatch:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
}
.color-swatch.active {
  border-color: #6366f1;
  box-shadow:
    0 0 0 3px rgba(99, 102, 241, 0.08),
    0 3px 10px rgba(99, 102, 241, 0.2);
  transform: scale(1.1);
}
.color-swatch-custom {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  border: 1.5px dashed rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #5a5e64;
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;
  background: transparent;
}
.color-swatch-custom:hover {
  border-color: #6366f1;
  color: #6366f1;
}
.color-swatch-custom input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}
.color-swatch-custom svg {
  width: 13px;
  height: 13px;
  pointer-events: none;
}

.text-icon-preview {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.icon-picker-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}
.icon-picker-item {
  aspect-ratio: 1;
  border-radius: 8px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.icon-picker-item:hover {
  background: var(--input-bg);
}
.icon-picker-item.active {
  background: rgba(139, 92, 246, 0.12);
  box-shadow: inset 0 0 0 1px #8b5cf6;
}
.icon-picker-item svg {
  width: 16px;
  height: 16px;
  color: #5a5e64;
  stroke-width: 1.8;
}
.icon-picker-item.active svg {
  color: #6366f1;
}

.cat-select-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}
.cat-select-trigger:hover {
  background: var(--input-bg);
}
.cat-dot {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cat-dot svg {
  width: 11px;
  height: 11px;
  color: #fff;
}
.cat-select-label {
  flex: 1;
  font-size: 13px;
  color: #1a1a2e;
  text-align: left;
}
.cat-select-arrow {
  color: #64748b;
  flex-shrink: 0;
}
.cat-select-arrow svg {
  width: 12px;
  height: 12px;
}

.cat-dropdown {
  position: fixed;
  z-index: 99999;
  background: var(--dropdown-bg);
  border: none;
  border-radius: 12px;
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.06),
    0 0 0 0.5px rgba(0, 0, 0, 0.03);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  max-height: 220px;
  overflow-y: auto;
}
.cat-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  color: #1a1a2e;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s ease;
}
.cat-dropdown-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.hint-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: transparent;
  border: none;
}
.hint-badge {
  font-size: 10px;
  font-weight: 700;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.03em;
}
.hint-text {
  font-size: 11px;
  color: #64748b;
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

@media (max-width: 640px) {
  .type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .launcher-sheet {
    border-radius: 14px;
  }
  .icon-picker-grid {
    grid-template-columns: repeat(6, 1fr);
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

.sheet-body::-webkit-scrollbar {
  width: 5px;
}
.sheet-body::-webkit-scrollbar-track {
  background: transparent;
}
.sheet-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
}
.sheet-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

.cat-dropdown::-webkit-scrollbar {
  width: 5px;
}
.cat-dropdown::-webkit-scrollbar-track {
  background: transparent;
}
.cat-dropdown::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
}
.cat-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* ===== 暗色模式覆盖 ===== */
.app-launcher--dark .sheet-header,
.app-launcher--dark .sheet-body,
.app-launcher--dark .sheet-footer {
  background: var(--panel-bg);
}

.app-launcher--dark .sheet-title-text h2 {
  color: #e2e8f0;
}

.app-launcher--dark .sheet-title-text span {
  color: #94a3b8;
}

.app-launcher--dark .sheet-close {
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

.app-launcher--dark .sheet-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
}

.app-launcher--dark .type-label {
  color: #e2e8f0;
}

.app-launcher--dark .form-label {
  color: #cbd5e1;
}

.app-launcher--dark .form-input {
  border-color: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.app-launcher--dark .form-input::placeholder {
  color: #64748b;
}

.app-launcher--dark .form-input:focus {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--accent);
}

.app-launcher--dark .btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
}

.app-launcher--dark .btn-cancel:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
}

.app-launcher--dark .hint-text {
  color: #94a3b8;
}

.app-launcher--dark .cat-select-label {
  color: #e2e8f0;
}

.app-launcher--dark .cat-dropdown {
  background: var(--contextmenu-bg);
}

.app-launcher--dark .cat-dropdown-item {
  color: #cbd5e1;
}

.app-launcher--dark .cat-dropdown-item:hover {
  background: rgba(255, 255, 255, 0.06);
}
</style>
