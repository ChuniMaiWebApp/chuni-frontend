<script setup lang="ts">
import type { SongSearchResponse, ChartView } from '~~/shared/types/api'

useHead({ title: 'ChunithmWebApp · Songs Database' })

const route = useRoute()
const router = useRouter()

// Filter & Pagination State synced with URL parameters
const query = ref((route.query.q as string) ?? '')
const viewMode = ref<'grid' | 'list'>(((route.query.view as string) === 'list') ? 'list' : 'grid')
const region = ref<'all' | 'intl' | 'jp'>((route.query.region as 'all' | 'intl' | 'jp') || (route.query.available === 'true' ? 'intl' : 'all'))
const genre = ref((route.query.genre as string) ?? 'ALL')
const difficulty = ref((route.query.difficulty as string) ?? 'ALL')
const version = ref((route.query.version as string) ?? 'ALL')
const minConst = ref((route.query.minConst as string) ?? '')
const maxConst = ref((route.query.maxConst as string) ?? '')
const minBpm = ref((route.query.minBpm as string) ?? '')
const maxBpm = ref((route.query.maxBpm as string) ?? '')
const charter = ref((route.query.charter as string) ?? '')
const hideRemoved = ref(route.query.hideRemoved !== 'false')
// The query string is user input: narrow it to the union instead of asserting,
// so `?sortBy=nonsense` falls back rather than putting an unknown value into a
// ref the sort function trusts.
type SortBy = 'default' | 'title' | 'const' | 'release' | 'bpm'
type SortOrder = 'asc' | 'desc'

const SORT_BY: readonly SortBy[] = ['default', 'title', 'const', 'release', 'bpm']
const SORT_ORDER: readonly SortOrder[] = ['asc', 'desc']

const pick = <T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T =>
  typeof raw === 'string' && (allowed as readonly string[]).includes(raw)
    ? (raw as T)
    : fallback

const sortBy = ref<SortBy>(pick(route.query.sortBy, SORT_BY, 'default'))
const sortOrder = ref<SortOrder>(pick(route.query.sortOrder, SORT_ORDER, 'desc'))
const page = ref(Number(route.query.page as string) || 1)
const pageSize = ref(Number(route.query.limit as string) || 30)

// Toggle sidebar visibility (Left Sidebar)
const isSidebarOpen = ref(true)

const CATEGORIES = [
  'ALL',
  'POPS & ANIME',
  'niconico',
  '東方Project',
  'VARIETY',
  'イロドリミドリ',
  'ゲキマイ',
  'ORIGINAL',
]

const DIFFICULTIES = [
  { label: 'ALL', value: 'ALL' },
  { label: 'BASIC', value: 'BAS', code: 'BAS' },
  { label: 'ADVANCED', value: 'ADV', code: 'ADV' },
  { label: 'EXPERT', value: 'EXP', code: 'EXP' },
  { label: 'MASTER', value: 'MAS', code: 'MAS' },
  { label: 'ULTIMA', value: 'ULT', code: 'ULT' },
  { label: 'WORLD\'S END', value: 'WE', code: 'WE' },
]

const VERSIONS = [
  'ALL',
  'CHUNITHM',
  'AIR',
  'STAR',
  'AMAZON',
  'CRYSTAL',
  'PARADISE',
  'NEW',
  'SUN',
  'LUMINOUS',
  'VERSE',
  'Mate',
]

// Active filter count calculation
const activeFilterCount = computed(() => {
  let count = 0
  if (region.value !== 'all') count++
  if (genre.value !== 'ALL') count++
  if (difficulty.value !== 'ALL') count++
  if (version.value !== 'ALL') count++
  if (minConst.value) count++
  if (maxConst.value) count++
  if (minBpm.value) count++
  if (maxBpm.value) count++
  if (charter.value.trim()) count++
  if (!hideRemoved.value) count++
  if (sortBy.value !== 'default') count++
  return count
})

const { data: searchData, error, status } = await useApiFetch<SongSearchResponse>(
  '/songs/search',
  {
    query: computed(() => ({
      q: query.value,
      genre: genre.value !== 'ALL' ? genre.value : undefined,
      version: version.value !== 'ALL' ? version.value : undefined,
      difficulty: difficulty.value !== 'ALL' ? difficulty.value : undefined,
      region: region.value !== 'all' ? region.value : undefined,
      minConst: minConst.value || undefined,
      maxConst: maxConst.value || undefined,
      minBpm: minBpm.value || undefined,
      maxBpm: maxBpm.value || undefined,
      charter: charter.value.trim() || undefined,
      hideRemoved: hideRemoved.value ? 'true' : 'false',
      sortBy: sortBy.value !== 'default' ? sortBy.value : undefined,
      sortOrder: sortOrder.value,
      page: page.value,
      limit: pageSize.value,
    })),
    immediate: true,
    watch: false,
  },
)

const results = computed(() => searchData.value?.songs ?? [])
const totalCount = computed(() => searchData.value?.total ?? 0)
const totalPages = computed(() => searchData.value?.totalPages ?? 1)

// Smooth non-destructive loading state (prevents layout collapse)
const isInitialLoading = computed(() => status.value === 'pending' && !searchData.value)
const isRefreshing = computed(() => status.value === 'pending' && !!searchData.value)

const startItem = computed(() => (totalCount.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const endItem = computed(() => Math.min(page.value * pageSize.value, totalCount.value))

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = page.value
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | string)[] = [1]
  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

const executeSearch = (resetPage = false) => {
  if (resetPage) page.value = 1

  void router.replace({
    query: {
      q: query.value || undefined,
      view: viewMode.value !== 'grid' ? viewMode.value : undefined,
      region: region.value !== 'all' ? region.value : undefined,
      genre: genre.value !== 'ALL' ? genre.value : undefined,
      difficulty: difficulty.value !== 'ALL' ? difficulty.value : undefined,
      version: version.value !== 'ALL' ? version.value : undefined,
      minConst: minConst.value || undefined,
      maxConst: maxConst.value || undefined,
      minBpm: minBpm.value || undefined,
      maxBpm: maxBpm.value || undefined,
      charter: charter.value.trim() || undefined,
      hideRemoved: hideRemoved.value ? undefined : 'false',
      sortBy: sortBy.value !== 'default' ? sortBy.value : undefined,
      sortOrder: sortOrder.value !== 'desc' ? sortOrder.value : undefined,
      page: page.value > 1 ? page.value : undefined,
      limit: pageSize.value !== 30 ? pageSize.value : undefined,
    },
  })
  void refreshNuxtData()
}

let debounce: ReturnType<typeof setTimeout> | null = null

const runSearch = (resetPage = false) => {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => {
    executeSearch(resetPage)
  }, 250)
}

const songsLayoutRef = ref<HTMLElement | null>(null)

const goToPage = (p: number) => {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  executeSearch(false)

  if (import.meta.client) {
    const targetY = songsLayoutRef.value ? Math.max(0, songsLayoutRef.value.offsetTop - 20) : 0
    if (window.scrollY > targetY) {
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    }
  }
}

const resetFilters = () => {
  query.value = ''
  region.value = 'all'
  genre.value = 'ALL'
  difficulty.value = 'ALL'
  version.value = 'ALL'
  minConst.value = ''
  maxConst.value = ''
  minBpm.value = ''
  maxBpm.value = ''
  charter.value = ''
  hideRemoved.value = true
  sortBy.value = 'default'
  sortOrder.value = 'desc'
  page.value = 1
  pageSize.value = 30
  executeSearch(true)
}

// Helpers for difficulty styling
const diffClass = (diffName: string) => {
  const name = diffName.toLowerCase()
  if (name.includes('bas')) return 'diff-bas'
  if (name.includes('adv')) return 'diff-adv'
  if (name.includes('exp')) return 'diff-exp'
  if (name.includes('mas')) return 'diff-mas'
  if (name.includes('ult')) return 'diff-ult'
  if (name.includes('we') || name.includes('world')) return 'diff-we'
  return ''
}

const formatConst = (chart: ChartView) => {
  if (chart.const !== null && chart.const !== undefined) {
    return chart.const.toFixed(1)
  }
  return chart.level
}

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce)
})
</script>

<template>
  <section class="songs-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1>Song Database</h1>
        <p class="lead">
          Search songs, levels, constants, BPM and charter info. Romaji search supported (e.g. <code>tentai kansoku</code> finds 天体観測).
        </p>
      </div>
    </header>

    <!-- Top Search Control Bar -->
    <div class="search-control-bar card">
      <div class="search-input-wrapper">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="query"
          type="search"
          placeholder="Search title, artist or alias…"
          autocomplete="off"
          class="search-input"
          @input="runSearch(true)"
        >
        <button v-if="query" type="button" class="btn-clear" aria-label="Clear search" @click="query = ''; executeSearch(true)">
          ✕
        </button>
      </div>

      <div class="control-actions">
        <!-- View Mode Toggle -->
        <div class="view-mode-toggle">
          <button
            type="button"
            class="btn-icon"
            :class="{ active: viewMode === 'grid' }"
            title="Grid View"
            @click="viewMode = 'grid'; executeSearch(false)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button
            type="button"
            class="btn-icon"
            :class="{ active: viewMode === 'list' }"
            title="Detail/List View"
            @click="viewMode = 'list'; executeSearch(false)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Sidebar Toggle Button -->
        <button
          type="button"
          class="btn-toggle-sidebar"
          :class="{ 'is-active': isSidebarOpen }"
          @click="isSidebarOpen = !isSidebarOpen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"/>
            <line x1="4" y1="10" x2="4" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12" y2="3"/>
            <line x1="20" y1="21" x2="20" y2="16"/>
            <line x1="20" y1="12" x2="20" y2="3"/>
            <line x1="1" y1="14" x2="7" y2="14"/>
            <line x1="9" y1="8" x2="15" y2="8"/>
            <line x1="17" y1="16" x2="23" y2="16"/>
          </svg>
          <span>Filters Sidebar</span>
          <span v-if="activeFilterCount > 0" class="filter-count-badge">{{ activeFilterCount }}</span>
        </button>
      </div>
    </div>

    <!-- Active Filters Pills Bar -->
    <div v-if="activeFilterCount > 0" class="active-filters-bar">
      <span class="active-label">Active filters:</span>
      <span v-if="region !== 'all'" class="filter-chip">Region: {{ region.toUpperCase() }}</span>
      <span v-if="genre !== 'ALL'" class="filter-chip">Genre: {{ genre }}</span>
      <span v-if="difficulty !== 'ALL'" class="filter-chip">Diff: {{ difficulty }}</span>
      <span v-if="version !== 'ALL'" class="filter-chip">Ver: {{ version }}</span>
      <span v-if="minConst || maxConst" class="filter-chip">Const: {{ minConst || '1.0' }} – {{ maxConst || '15.4+' }}</span>
      <span v-if="minBpm || maxBpm" class="filter-chip">BPM: {{ minBpm || 'Min' }} – {{ maxBpm || 'Max' }}</span>
      <span v-if="charter" class="filter-chip">Charter: {{ charter }}</span>
      <span v-if="!hideRemoved" class="filter-chip">Showing removed songs</span>
      <button type="button" class="btn-reset-text" @click="resetFilters">Reset all</button>
    </div>

    <!-- Main Layout Container (Left Sidebar, Right Results) -->
    <div ref="songsLayoutRef" class="songs-layout" :class="{ 'has-sidebar': isSidebarOpen }">
      <!-- Left Filter Sidebar Drawer -->
      <aside v-if="isSidebarOpen" class="filter-sidebar card">
        <div class="sidebar-header">
          <h2>Filter Options</h2>
          <button type="button" class="btn-close-sidebar" aria-label="Close sidebar" @click="isSidebarOpen = false">✕</button>
        </div>

        <div class="sidebar-content">
          <!-- 1. Sort By -->
          <div class="filter-group">
            <label class="group-label">Sort By</label>

            <select v-model="sortBy" class="select-input" @change="executeSearch(false)">
              <option value="default">Default (Relevance)</option>
              <option value="title">Title (A-Z)</option>
              <option value="const">Chart Constant (Level)</option>
              <option value="release">Release Date</option>
              <option value="bpm">BPM</option>
            </select>

            <div class="sort-order-toggle">
              <button
                type="button"
                class="order-btn"
                :class="{ active: sortOrder === 'desc' }"
                @click="sortOrder = 'desc'; executeSearch(false)"
              >
                Descending ⬇
              </button>
              <button
                type="button"
                class="order-btn"
                :class="{ active: sortOrder === 'asc' }"
                @click="sortOrder = 'asc'; executeSearch(false)"
              >
                Ascending ⬆
              </button>
            </div>
          </div>

          <!-- 2. Region -->
          <div class="filter-group">
            <label class="group-label">Region</label>

            <div class="chip-select-grid">
              <button
                type="button"
                class="chip-btn"
                :class="{ active: region === 'all' }"
                @click="region = 'all'; executeSearch(true)"
              >
                All
              </button>
              <button
                type="button"
                class="chip-btn"
                :class="{ active: region === 'intl' }"
                @click="region = 'intl'; executeSearch(true)"
              >
                International
              </button>
              <button
                type="button"
                class="chip-btn"
                :class="{ active: region === 'jp' }"
                @click="region = 'jp'; executeSearch(true)"
              >
                Japan Only
              </button>
            </div>
          </div>

          <!-- 3. Category / Genre -->
          <div class="filter-group">
            <label class="group-label">Category / Genre</label>
            <select v-model="genre" class="select-input" @change="executeSearch(true)">
              <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <!-- 4. Difficulty -->
          <div class="filter-group">
            <label class="group-label">Difficulty</label>
            <div class="chip-select-grid chip-select-grid--diff">
              <button
                v-for="diff in DIFFICULTIES"
                :key="diff.value"
                type="button"
                class="chip-btn"
                :class="[{ active: difficulty === diff.value }, diff.code ? diffClass(diff.code) : '']"
                @click="difficulty = diff.value; executeSearch(true)"
              >
                {{ diff.label }}
              </button>
            </div>
          </div>

          <!-- 5. Game Version -->
          <div class="filter-group">
            <label class="group-label">Version</label>
            <select v-model="version" class="select-input" @change="executeSearch(true)">
              <option v-for="ver in VERSIONS" :key="ver" :value="ver">{{ ver }}</option>
            </select>
          </div>

          <!-- 6. Level / Chart Constant Range -->
          <div class="filter-group">
            <label class="group-label">Chart Constant Range</label>

            <div class="range-inputs">
              <input
                v-model="minConst"
                type="number"
                step="0.1"
                min="1.0"
                max="15.4"
                placeholder="Min (e.g. 13.0)"
                class="number-input"
                @change="executeSearch(true)"
              >
              <span class="range-dash">–</span>
              <input
                v-model="maxConst"
                type="number"
                step="0.1"
                min="1.0"
                max="15.4"
                placeholder="Max (e.g. 15.4)"
                class="number-input"
                @change="executeSearch(true)"
              >
            </div>
          </div>

          <!-- 7. BPM Range -->
          <div class="filter-group">
            <label class="group-label">BPM Range</label>
            <div class="range-inputs">
              <input
                v-model="minBpm"
                type="number"
                placeholder="Min BPM"
                class="number-input"
                @change="executeSearch(true)"
              >
              <span class="range-dash">–</span>
              <input
                v-model="maxBpm"
                type="number"
                placeholder="Max BPM"
                class="number-input"
                @change="executeSearch(true)"
              >
            </div>
          </div>

          <!-- 8. Charter / Notes Designer -->
          <div class="filter-group">
            <label class="group-label">Notes Designer / Charter</label>
            <input
              v-model="charter"
              type="text"
              placeholder="e.g. イノシカ提灯…"
              class="text-input"
              @input="runSearch(true)"
            >
          </div>

          <!-- 9. Hide Removed Songs -->
          <div class="filter-group">
            <label class="checkbox-field">
              <input
                v-model="hideRemoved"
                type="checkbox"
                @change="executeSearch(true)"
              >
              <span>Hide removed songs</span>
            </label>
          </div>

          <!-- Reset All -->
          <div class="filter-group filter-group--reset">
            <button type="button" class="btn-reset-full" @click="resetFilters">
              Reset All Filters
            </button>
          </div>
        </div>
      </aside>

      <!-- Right Main Content Area -->
      <main class="songs-content" :class="{ 'is-refreshing': isRefreshing }">
        <!-- Top Loading Indicator Bar -->
        <div v-if="isRefreshing" class="loading-progress-bar">
          <div class="progress-bar-inner" />
        </div>

        <ApiError v-if="error" :error="error" />

        <AppSpinner v-else-if="isInitialLoading" label="Searching songs…" />

        <p v-else-if="!results.length" class="empty card empty--center">
          No songs matched your search criteria. Try adjusting the filters on the left sidebar.
        </p>

        <div v-else class="results-wrapper">
          <!-- TOP PAGINATION BAR -->
          <div class="pagination-bar card">
            <div class="pagination-info">
              Showing {{ startItem }}–{{ endItem }} of {{ totalCount }} songs (Page {{ page }} of {{ totalPages }})
            </div>

            <div class="pagination-controls">
              <button
                type="button"
                class="page-btn"
                :disabled="page <= 1"
                @click="goToPage(page - 1)"
              >
                ‹
              </button>

              <template v-for="(p, idx) in visiblePages" :key="idx">
                <span v-if="p === '...'" class="page-ellipsis">…</span>
                <button
                  v-else
                  type="button"
                  class="page-btn"
                  :class="{ active: p === page }"
                  @click="goToPage(Number(p))"
                >
                  {{ p }}
                </button>
              </template>

              <button
                type="button"
                class="page-btn"
                :disabled="page >= totalPages"
                @click="goToPage(page + 1)"
              >
                ›
              </button>
            </div>

            <div class="page-size-selector">
              <select v-model="pageSize" class="select-input select-input--sm" @change="executeSearch(true)">
                <option :value="30">30 / page</option>
                <option :value="60">60 / page</option>
                <option :value="100">100 / page</option>
                <option :value="200">200 / page</option>
                <option :value="500">500 (All) / page</option>
              </select>
            </div>
          </div>

          <!-- GRID VIEW -->
          <div v-if="viewMode === 'grid'" class="songs-grid">
            <NuxtLink
              v-for="song in results"
              :key="song.id"
              :to="`/songs/${song.id}`"
              class="song-card-grid card"
            >
              <div class="grid-jacket-wrapper">
                <img
                  v-if="song.jacketUrl"
                  :src="song.jacketUrl"
                  alt=""
                  loading="lazy"
                  class="grid-jacket"
                >
                <div v-else class="grid-jacket-placeholder" aria-hidden="true" />
                <div class="grid-badge-group">
                  <span v-if="song.availableJp && !song.availableIntl" class="region-badge region-badge--jp">JP</span>
                  <span v-else-if="song.availableIntl" class="region-badge region-badge--intl">INTL</span>
                  <span v-if="song.removed" class="region-badge region-badge--removed">Removed</span>
                </div>
              </div>

              <div class="grid-info">
                <h3 class="grid-title" :title="song.title">{{ song.title }}</h3>
                <p class="grid-artist" :title="song.artist">{{ song.artist }}</p>

                <div class="grid-meta">
                  <span class="meta-tag" :class="{ 'meta-tag--we': song.genre === `WORLD'S END` }">{{ song.genre }}</span>
                  <span class="meta-tag">{{ song.version }}</span>
                </div>

                <!-- Difficulty & Chart Constants Chips -->
                <div v-if="song.charts?.length" class="grid-charts-chips">
                  <div
                    v-for="chart in song.charts"
                    :key="chart.difficulty"
                    class="chart-chip"
                    :class="diffClass(chart.difficultyName)"
                  >
                    <span class="chip-diff">{{ chart.difficultyName }}</span>
                    <span class="chip-const">{{ formatConst(chart) }}</span>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- LIST / DETAIL VIEW -->
          <ul v-else class="songs-list">
            <li v-for="song in results" :key="song.id">
              <NuxtLink :to="`/songs/${song.id}`" class="song-card-list card">
                <img
                  v-if="song.jacketUrl"
                  :src="song.jacketUrl"
                  alt=""
                  width="72"
                  height="72"
                  loading="lazy"
                  class="list-jacket"
                >
                <div v-else class="list-jacket-placeholder" aria-hidden="true" />

                <div class="list-body">
                  <div class="list-main-info">
                    <h2 class="list-title">{{ song.title }}</h2>
                    <p class="list-artist">{{ song.artist }}</p>
                    <div class="list-meta">
                      <span class="meta-tag" :class="{ 'meta-tag--we': song.genre === `WORLD'S END` }">{{ song.genre }}</span>
                      <span class="meta-tag">{{ song.version }}</span>
                      <span v-if="song.bpm.primary" class="meta-tag">BPM {{ song.bpm.primary }}</span>
                      <span v-if="song.availableJp && !song.availableIntl" class="region-badge region-badge--jp">Japan only</span>
                      <span v-else-if="song.availableIntl" class="region-badge region-badge--intl">International</span>
                      <span v-if="song.matchedAlias" class="meta-tag meta-tag--alias">matched “{{ song.matchedAlias }}”</span>
                    </div>
                  </div>

                  <!-- Charts Summary Chips -->
                  <div v-if="song.charts?.length" class="list-charts-chips">
                    <div
                      v-for="chart in song.charts"
                      :key="chart.difficulty"
                      class="chart-chip"
                      :class="diffClass(chart.difficultyName)"
                    >
                      <span class="chip-diff">{{ chart.difficultyName }}</span>
                      <span class="chip-const">{{ formatConst(chart) }}</span>
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </li>
          </ul>

          <!-- BOTTOM PAGINATION BAR -->
          <div v-if="totalPages > 1" class="pagination-bar card pagination-bar--bottom">
            <div class="pagination-info">
              Showing {{ startItem }}–{{ endItem }} of {{ totalCount }} songs (Page {{ page }} of {{ totalPages }})
            </div>

            <div class="pagination-controls">
              <button
                type="button"
                class="page-btn"
                :disabled="page <= 1"
                @click="goToPage(page - 1)"
              >
                ‹
              </button>

              <template v-for="(p, idx) in visiblePages" :key="idx">
                <span v-if="p === '...'" class="page-ellipsis">…</span>
                <button
                  v-else
                  type="button"
                  class="page-btn"
                  :class="{ active: p === page }"
                  @click="goToPage(Number(p))"
                >
                  {{ p }}
                </button>
              </template>

              <button
                type="button"
                class="page-btn"
                :disabled="page >= totalPages"
                @click="goToPage(page + 1)"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </section>
</template>

<style scoped>
.songs-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.25rem;
}

.lead {
  color: var(--color-muted);
  font-size: 0.84375rem;
  margin: 0;
}

.lead code {
  background: var(--color-bg);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

/* Control Bar */
.search-control-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  width: 18px;
  height: 18px;
  color: var(--color-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  font: inherit;
  font-size: 0.9375rem;
  padding: 0.55rem 2.2rem 0.55rem 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
}

.search-input:focus {
  outline: 2px solid var(--color-accent);
  border-color: transparent;
}

.btn-clear {
  position: absolute;
  right: 0.6rem;
  background: transparent;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  font-size: 0.85rem;
}

.control-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.view-mode-toggle {
  display: flex;
  gap: 0.25rem;
  background: var(--color-bg);
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--color-muted);
  padding: 0.35rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-icon.active {
  background: var(--color-surface);
  color: var(--color-accent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-toggle-sidebar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
  font-size: 0.84375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-toggle-sidebar:hover,
.btn-toggle-sidebar.is-active {
  border-color: var(--color-accent);
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.filter-count-badge {
  background: var(--color-accent);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
}

/* Active Filter Bar */
.active-filters-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.active-label {
  color: var(--color-muted);
  font-weight: 600;
}

.filter-chip {
  background: var(--color-accent-subtle);
  border: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
  color: var(--color-accent);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.78125rem;
}

.btn-reset-text {
  background: transparent;
  border: none;
  color: var(--color-down);
  font-weight: 700;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  font-size: 0.8125rem;
  text-decoration: underline;
}

/* Layout - Left Sidebar, Right Main Content */
.songs-layout {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
  width: 100%;
}

.songs-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 500px;
  position: relative;
}

/* Non-destructive loading indicator bar */
.loading-progress-bar {
  position: absolute;
  top: -6px;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(168, 85, 247, 0.15);
  border-radius: 2px;
  overflow: hidden;
  z-index: 10;
}

.progress-bar-inner {
  height: 100%;
  width: 40%;
  background: var(--color-accent);
  border-radius: 2px;
  animation: loading-pulse 0.9s infinite ease-in-out;
}

@keyframes loading-pulse {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(250%);
  }
}

.songs-content.is-refreshing .results-wrapper {
  opacity: 0.55;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.results-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Pagination Bar */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 1rem;
  flex-wrap: wrap;
  font-size: 0.8125rem;
}

.pagination-bar--bottom {
  margin-top: 0;
}

.pagination-info {
  color: var(--color-muted);
  font-weight: 600;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.page-btn {
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 700;
  min-width: 32px;
  height: 32px;
  padding: 0 0.4rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.page-ellipsis {
  color: var(--color-muted);
  padding: 0 0.2rem;
}

.select-input--sm {
  width: auto;
  padding: 0.3rem 0.6rem;
  font-size: 0.78125rem;
}

/* Grid Layout */
.songs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
  gap: 1rem;
}

.song-card-grid {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.song-card-grid:hover {
  transform: translateY(-3px);
  border-color: var(--color-accent);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.grid-jacket-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: var(--color-bg);
  overflow: hidden;
}

.grid-jacket {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.grid-jacket-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-bg);
}

.grid-badge-group {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.region-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.region-badge--jp {
  background: #ef4444;
  color: #fff;
}

.region-badge--intl {
  background: #3b82f6;
  color: #fff;
}

.region-badge--removed {
  background: #6b7280;
  color: #fff;
}

.grid-info {
  padding: 0.75rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.grid-title {
  font-size: 0.9375rem;
  font-weight: 750;
  margin: 0;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: var(--color-text);
}

.grid-artist {
  font-size: 0.78125rem;
  color: var(--color-muted);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.2rem;
}

.meta-tag {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-muted);
}

.meta-tag--alias {
  text-transform: none;
  color: var(--color-accent);
}

.meta-tag--we {
  background: linear-gradient(135deg, #ff0055, #ff5500, #00cc44, #00ccff, #cc00ff) !important;
  color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
}

/* Color-coded Difficulty Chips */
.grid-charts-chips,
.list-charts-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.4rem;
}

.chart-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: #232733;
  color: #f3f4f6;
  border: 1px solid rgba(255,255,255,0.1);
}

.diff-bas {
  background: #059669 !important;
  color: #ffffff !important;
}

.diff-adv {
  background: #d97706 !important;
  color: #ffffff !important;
}

.diff-exp {
  background: #dc2626 !important;
  color: #ffffff !important;
}

.diff-mas {
  background: #7c3aed !important;
  color: #ffffff !important;
}

.diff-ult {
  background: #111827 !important;
  color: #f3f4f6 !important;
  border: 1px solid #e2e8f0 !important;
}

.diff-we {
  background: linear-gradient(
    135deg,
    #ff0055 0%,
    #ff5500 16%,
    #ffcc00 33%,
    #00cc44 50%,
    #00ccff 66%,
    #3333ff 83%,
    #cc00ff 100%
  ) !important;
  color: #ffffff !important;
  font-weight: 900 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9), 0 0 3px rgba(0, 0, 0, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 0 8px rgba(255, 0, 85, 0.4);
}

.chip-diff {
  font-size: 0.6rem;
  opacity: 0.9;
}

.chip-const {
  font-variant-numeric: tabular-nums;
}

/* List Layout */
.songs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.song-card-list {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 1.1rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.song-card-list:hover {
  transform: translateY(-2px);
  border-color: var(--color-accent);
}

.list-jacket,
.list-jacket-placeholder {
  width: 72px;
  height: 72px;
  border-radius: var(--radius);
  object-fit: cover;
  flex-shrink: 0;
}

.list-jacket-placeholder {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.list-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.list-title {
  font-size: 1rem;
  font-weight: 750;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-artist {
  font-size: 0.8125rem;
  color: var(--color-muted);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

/* Left Filter Sidebar Drawer */
.filter-sidebar {
  width: 290px;
  flex-shrink: 0;
  position: sticky;
  top: 4.5rem;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  max-height: calc(100vh - 5.5rem);
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.6rem;
}

.sidebar-header h2 {
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
}

.btn-close-sidebar {
  background: transparent;
  border: none;
  color: var(--color-muted);
  font-size: 1.1rem;
  cursor: pointer;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.group-label {
  font-size: 0.78125rem;
  font-weight: 700;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.select-input,
.text-input,
.number-input {
  font: inherit;
  font-size: 0.84375rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  width: 100%;
}

.select-input:focus,
.text-input:focus,
.number-input:focus {
  outline: 2px solid var(--color-accent);
  border-color: transparent;
}

.checkbox-field {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.84375rem;
  font-weight: 650;
  color: var(--color-text);
  cursor: pointer;
  user-select: none;
}

.checkbox-field input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.sort-order-toggle {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.3rem;
}

.order-btn {
  flex: 1;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-muted);
  cursor: pointer;
}

.order-btn.active {
  background: var(--color-accent-subtle);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* Chip Select Grid */
.chip-select-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.chip-btn {
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip-btn.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #ffffff;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.range-dash {
  color: var(--color-muted);
  font-weight: 700;
}

.filter-group--reset {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.btn-reset-full {
  width: 100%;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-down);
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-reset-full:hover {
  background: color-mix(in srgb, var(--color-down) 10%, transparent);
}

.empty--center {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--color-muted);
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .songs-layout {
    flex-direction: column;
  }

  .filter-sidebar {
    width: 100%;
    position: static;
    max-height: none;
  }
}
</style>
