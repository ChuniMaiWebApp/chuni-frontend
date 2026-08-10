<script setup lang="ts">
import type { StoredScore } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · All Personal Bests' })

const route = useRoute()

const level = ref((route.query.level as string) ?? '')
const difficulty = ref((route.query.difficulty as string) ?? '')
const sort = ref((route.query.sort as string) ?? 'rating')
const order = ref<'asc' | 'desc'>(((route.query.order as string) === 'asc') ? 'asc' : 'desc')
const page = ref(Number(route.query.page as string) || 1)
const pageSize = ref(Number(route.query.pageSize as string) || 36)

const { data: rawScores, error, status, refresh } = await useApiFetch<StoredScore[]>(
  '/records/top',
  {
    query: computed(() => ({
      level: level.value || undefined,
      difficulty: difficulty.value || undefined,
      sort: sort.value,
      order: order.value,
      limit: 5000,
    })),
  },
)

const allScores = computed(() => rawScores.value ?? [])
const totalCount = computed(() => allScores.value.length)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value) || 1)

const startItem = computed(() => (totalCount.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const endItem = computed(() => Math.min(page.value * pageSize.value, totalCount.value))

const paginatedScores = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return allScores.value.slice(start, start + pageSize.value)
})

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

const goToPage = (p: number) => {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const applyFilters = () => {
  page.value = 1
  refresh()
}

const SORTS = [
  { value: 'rating', label: 'Play rating' },
  { value: 'score', label: 'Score' },
  { value: 'overpower', label: 'OVER POWER' },
  { value: 'overpowerPercent', label: 'OVER POWER %' },
  { value: 'comboLamp', label: 'Combo lamp' },
  { value: 'clearLamp', label: 'Clear lamp' },
  { value: 'mistakes', label: 'Fewest mistakes' },
]

/** What the folded panel says, so its state is legible while it is shut. */
const filterSummary = computed(() => {
  const parts = [
    SORTS.find(option => option.value === sort.value)?.label ?? sort.value,
    order.value === 'desc' ? 'high to low' : 'low to high',
    `${pageSize.value} / page`,
  ]

  if (level.value.trim()) parts.unshift(`Level ${level.value.trim()}`)
  if (difficulty.value) parts.unshift(difficulty.value)

  return parts.join(' · ')
})
</script>

<template>
  <section class="top-page">
    <header class="page-header">
      <div>
        <h1>All Personal Bests</h1>
        <p class="lead">
          Unlike <NuxtLink to="/best50">Best 50</NuxtLink> (which only counts Sega's top 50 formula),
          this page lists <strong>all your cached personal bests</strong> across all difficulty levels.
          Run a <NuxtLink to="/statistics">Sync</NuxtLink> after playing to keep them up to date.
        </p>
      </div>
    </header>

    <!-- Filter & Sort Panel -->
    <details class="filter-panel card">
      <summary class="filter-panel__summary">
        <AppIcon name="filter" :size="15" />
        <span>Filter and sort</span>
        <span class="filter-panel__state">{{ filterSummary }}</span>
      </summary>

      <form class="filters" @submit.prevent="applyFilters()">
        <label class="filter-field">
          <span>Level</span>
          <input v-model="level" type="text" placeholder="e.g. 14+, 14.5 or 13.5-13.8">
        </label>

        <label class="filter-field">
          <span>Difficulty</span>
          <select v-model="difficulty">
            <option value="">All Difficulties</option>
            <option value="BAS">BASIC</option>
            <option value="ADV">ADVANCED</option>
            <option value="EXP">EXPERT</option>
            <option value="MAS">MASTER</option>
            <option value="ULT">ULTIMA</option>
          </select>
        </label>

        <label class="filter-field">
          <span>Sort By</span>
          <select v-model="sort">
            <option v-for="option in SORTS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="filter-field">
          <span>Order</span>
          <select v-model="order">
            <option value="desc">Descending (Highest first)</option>
            <option value="asc">Ascending (Lowest first)</option>
          </select>
        </label>

        <label class="filter-field">
          <span>Per Page</span>
          <select v-model="pageSize" @change="goToPage(1)">
            <option :value="24">24 per page</option>
            <option :value="36">36 per page</option>
            <option :value="48">48 per page</option>
            <option :value="60">60 per page</option>
            <option :value="120">120 per page</option>
          </select>
        </label>

        <button type="submit" class="btn btn--primary" :disabled="status === 'pending'">
          {{ status === 'pending' ? 'Filtering…' : 'Apply' }}
        </button>
      </form>
    </details>

    <ApiError v-if="error" :error="error" />

    <AppSpinner v-else-if="status === 'pending' && !rawScores" label="Reading your cache…" />

    <div v-else-if="!allScores.length" class="empty-card card">
      <p class="empty">
        No scores found matching these filters. Run a sync from the
        <NuxtLink to="/statistics">Statistics page</NuxtLink> to fetch your personal bests!
      </p>
    </div>

    <template v-else>
      <!-- TOP PAGINATION BAR ONLY -->
      <div class="pagination-bar card">
        <div class="pagination-info">
          Showing {{ startItem }}–{{ endItem }} of {{ totalCount }} scores (Page {{ page }} of {{ totalPages }})
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

      <!-- SCORE CARDS GRID -->
      <ul class="list">
        <li v-for="(score, index) in paginatedScores" :key="`${score.song.id}-${score.chart.difficultyName}`">
          <NuxtLink
            :to="`/records/${score.song.id}/${score.chart.difficulty}`"
            class="list__link"
          >
            <ScoreCard :score="score" :index="(page - 1) * pageSize + index + 1" />
          </NuxtLink>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.top-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.25rem;
}

.lead {
  color: var(--color-muted);
  font-size: 0.84375rem;
  line-height: 1.4;
  margin: 0;
  max-width: 44rem;
}

.lead a {
  color: var(--color-accent);
  font-weight: 600;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  padding: 1.125rem;
}

.filter-panel {
  padding: 0;
}

.filter-panel__summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.875rem;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 650;
  list-style: none;
}

.filter-panel__summary::-webkit-details-marker {
  display: none;
}

.filter-panel__state {
  margin-left: auto;
  font-weight: 500;
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-panel[open] .filters {
  border-top: 1px solid var(--color-border);
  padding: 0.875rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.875rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  flex: 1 1 10rem;
}

.filter-field input,
.filter-field select {
  font: inherit;
  font-size: 0.875rem;
  color: var(--color-text);
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  width: 100%;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr));
  gap: 0.75rem;
}

.list__link {
  display: block;
  color: inherit;
  text-decoration: none;
  border-radius: 6px;
}

.list__link:hover {
  outline: 1px solid var(--color-accent);
  outline-offset: 1px;
}

.list__link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Pagination Bar Styles (Matching Song DB) */
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

.empty-card {
  text-align: center;
  padding: 2.5rem 1rem;
}

.empty {
  color: var(--color-muted);
  font-size: 0.875rem;
  margin: 0;
}

.empty a {
  color: var(--color-accent);
  font-weight: 600;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 650;
  border: none;
  cursor: pointer;
}

.btn--primary {
  background: var(--color-accent);
  color: #ffffff;
}

.btn--primary:hover {
  background: var(--color-accent-hover);
}
</style>
