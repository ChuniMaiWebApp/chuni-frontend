<script setup lang="ts">
import type { StoredScore } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · All Personal Bests' })

const level = ref('')
const difficulty = ref('')
const sort = ref('rating')
const order = ref<'asc' | 'desc'>('desc')

const { data: scores, error, status, refresh } = await useApiFetch<StoredScore[]>(
  '/records/top',
  {
    query: computed(() => ({
      level: level.value || undefined,
      difficulty: difficulty.value || undefined,
      sort: sort.value,
      order: order.value,
      limit: 100,
    })),
  },
)

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

    <!--
      Folded away by default. Four fields and a button took a third of a phone
      screen before a single score appeared, and the default view — every best
      sorted by play rating — is the one most visits want.
    -->
    <details class="filter-panel card">
      <summary class="filter-panel__summary">
        <AppIcon name="filter" :size="15" />
        <span>Filter and sort</span>
        <span class="filter-panel__state">{{ filterSummary }}</span>
      </summary>

      <form class="filters" @submit.prevent="refresh()">
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

        <button type="submit" class="btn btn--primary" :disabled="status === 'pending'">
          {{ status === 'pending' ? 'Filtering…' : 'Apply' }}
        </button>
      </form>
    </details>

    <ApiError v-if="error" :error="error" />

    <AppSpinner v-else-if="status === 'pending' && !scores" label="Reading your cache…" />

    <div v-else-if="!scores?.length" class="empty-card card">
      <p class="empty">
        No scores found matching these filters. Run a sync from the
        <NuxtLink to="/statistics">Statistics page</NuxtLink> to fetch your personal bests!
      </p>
    </div>

    <ul v-else class="list">
      <li v-for="(score, index) in scores" :key="`${score.song.id}-${score.chart.difficultyName}`">
        <NuxtLink
          :to="`/records/${score.song.id}/${score.chart.difficulty}`"
          class="list__link"
        >
          <ScoreCard :score="score" :index="index + 1" />
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
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

/* Says what is currently applied, so the panel can stay shut. */
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

/* The card is the link, so hover is the only affordance needed and it costs
   no height in a list this long. */
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

