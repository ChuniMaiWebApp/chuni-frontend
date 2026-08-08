<script setup lang="ts">
import type { Statistics, SyncResult } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · Statistics' })

const api = useApi()

const level = ref('')
const difficulty = ref('')

/** What the folded panel says, so its state is legible while it is shut. */
const filterSummary = computed(() => {
  const parts: string[] = []

  if (difficulty.value) parts.push(difficulty.value)
  if (level.value.trim()) parts.push(`Level ${level.value.trim()}`)

  return parts.length ? parts.join(' · ') : 'All charts'
})

const { data: stats, error, status, refresh } = await useApiFetch<Statistics>(
  '/records/statistics',
  {
    query: computed(() => ({
      level: level.value || undefined,
      difficulty: difficulty.value || undefined,
    })),
  },
)

const syncing = ref(false)
const syncError = ref<string | null>(null)
const skipped = ref<string[]>([])

/**
 * Syncing costs five requests to SEGA, so it is an explicit action rather than
 * something the page does on load.
 */
const runSync = async () => {
  syncing.value = true
  syncError.value = null
  skipped.value = []

  try {
    const result = await api<SyncResult>('/records/sync', { method: 'POST' })

    // Scores on charts the song database lacks cannot be stored. Saying so
    // beats letting them vanish without a word.
    skipped.value = result.skipped
    await refresh()
  }
  catch (caught) {
    syncError.value = readApiError(caught)
  }
  finally {
    syncing.value = false
  }
}

/** The dataset is a snapshot; warn once it is old enough to be missing songs. */
const datasetWarning = computed(() => {
  const dataset = stats.value?.sync.dataset

  if (!dataset) {
    return 'Song data has never been refreshed from upstream — recent songs may be missing.'
  }

  if (dataset.ageDays >= 30) {
    return `Song data was last refreshed ${dataset.ageDays} days ago (newest song ${dataset.newestRelease}). Songs released since then are missing.`
  }

  return null
})

const RANK_ORDER = ['SSS+', 'SSS', 'SS+', 'SS', 'S+', 'S']
const COMBO_ORDER = ['ALL_JUSTICE_CRITICAL', 'ALL_JUSTICE', 'FULL_COMBO']

const comboLabel: Record<string, string> = {
  ALL_JUSTICE_CRITICAL: 'AJC',
  ALL_JUSTICE: 'AJ',
  FULL_COMBO: 'FC',
}

const lastSynced = computed(() => {
  const finished = stats.value?.sync.finishedAt

  return finished ? formatDateTime(finished) : null
})
</script>

<template>
  <section class="stats-page">
    <header class="page-header">
      <div>
        <h1>Statistics &amp; Folder Coverage</h1>
        <p class="lead">
          Computed from scores stored in your local cache.
          <template v-if="lastSynced">Last synced <strong>{{ lastSynced }}</strong>.</template>
          <template v-else>Nothing synced yet — press sync to pull your scores.</template>
        </p>
      </div>

      <button type="button" class="btn btn--primary" :disabled="syncing" @click="runSync">
        <AppIcon name="download" />
        {{ syncing ? 'Syncing…' : 'Sync' }}
      </button>
    </header>

    <p v-if="syncError" class="error">{{ syncError }}</p>

    <p v-if="datasetWarning" class="notice">{{ datasetWarning }}</p>

    <details v-if="skipped.length" class="notice notice--skipped">
      <summary>
        {{ skipped.length }} score(s) could not be stored — the song database does not have those charts yet
      </summary>
      <ul>
        <li v-for="chart in skipped" :key="chart">{{ chart }}</li>
      </ul>
    </details>

    <!-- Folded by default: the unfiltered view is the one most visits want. -->
    <details class="filter-panel card">
      <summary class="filter-panel__summary">
        <AppIcon name="filter" :size="15" />
        <span>Filter</span>
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
        <button type="submit" class="btn btn--secondary" :disabled="status === 'pending'">
          {{ status === 'pending' ? 'Filtering…' : 'Apply' }}
        </button>
      </form>
    </details>

    <ApiError v-if="error" :error="error" />

    <template v-else-if="stats">
      <!-- Metric Tiles Grid -->
      <dl class="tiles-grid">
        <div class="card metric-tile">
          <dt class="metric-tile__label">Folder Coverage</dt>
          <dd class="metric-tile__val tabular">
            {{ stats.coverage.played }} <span class="muted-slash">/</span> {{ stats.coverage.total }}
            <span class="metric-tile__sub">{{ stats.coverage.percentage.toFixed(2) }}%</span>
          </dd>
          <div class="progress-bar" aria-hidden="true">
            <div class="progress-bar__fill" :style="{ width: `${Math.min(stats.coverage.percentage, 100)}%` }" />
          </div>
        </div>

        <div class="card metric-tile">
          <dt class="metric-tile__label">OVER POWER</dt>
          <dd class="metric-tile__val tabular">
            {{ stats.overpower.value.toFixed(2) }}
            <span class="metric-tile__sub">/ {{ stats.overpower.max.toFixed(2) }} ({{ stats.overpower.percentage.toFixed(2) }}%)</span>
          </dd>
          <div class="progress-bar" aria-hidden="true">
            <div class="progress-bar__fill" :style="{ width: `${Math.min(stats.overpower.percentage, 100)}%` }" />
          </div>
        </div>

        <div class="card metric-tile">
          <dt class="metric-tile__label">Average Score</dt>
          <dd class="metric-tile__val tabular">
            {{ stats.averageScore.played.toLocaleString('en-US') }}
            <span class="metric-tile__sub">on played charts</span>
          </dd>
        </div>

        <div class="card metric-tile">
          <dt class="metric-tile__label">99% Justice Critical</dt>
          <dd class="metric-tile__val tabular">
            {{ stats.counts['99AJ'] }} <span class="metric-tile__sub">charts</span>
          </dd>
        </div>
      </dl>

      <!-- Tally Cards -->
      <div class="tally-grid">
        <section class="card tally-card">
          <h2 class="tally-card__title">Rank Counts</h2>
          <ul class="tally-list">
            <li v-for="rank in RANK_ORDER" :key="rank" class="tally-item">
              <span class="tally-item__label">{{ rank }}</span>
              <strong class="tally-item__val tabular">{{ stats.counts.ranks[rank] ?? 0 }}</strong>
            </li>
          </ul>
        </section>

        <section class="card tally-card">
          <h2 class="tally-card__title">Combo Lamp Counts</h2>
          <ul class="tally-list">
            <li v-for="lamp in COMBO_ORDER" :key="lamp" class="tally-item">
              <span class="tally-item__label">{{ comboLabel[lamp] }}</span>
              <strong class="tally-item__val tabular">{{ stats.counts.comboLamps[lamp] ?? 0 }}</strong>
            </li>
          </ul>
        </section>
      </div>

      <!-- Highlights Section -->
      <div v-if="stats.best" class="highlights-grid">
        <div class="highlight-item">
          <h2 class="highlight-title"><AppIcon name="trophy" /> Best score</h2>
          <ScoreCard :score="stats.best" />
        </div>
        <div v-if="stats.worst" class="highlight-item">
          <h2 class="highlight-title"><AppIcon name="trending" /> Lowest score</h2>
          <ScoreCard :score="stats.worst" />
        </div>
      </div>
    </template>
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

.stats-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
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

.lead strong {
  color: var(--color-text);
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  padding: 1.125rem;
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
  flex: 1 1 11rem;
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

.tiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13.5rem, 1fr));
  gap: 0.875rem;
  margin: 0;
}

.metric-tile {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.metric-tile__label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.metric-tile__val {
  margin: 0.35rem 0 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-text);
}

.muted-slash {
  color: var(--color-muted);
}

.metric-tile__sub {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
  margin-top: 0.15rem;
}

.progress-bar {
  height: 5px;
  border-radius: 999px;
  background: var(--color-border);
  overflow: hidden;
  margin-top: 0.625rem;
}

.progress-bar__fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: 999px;
}

.tally-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 0.875rem;
}

.tally-card__title {
  font-size: 0.8125rem;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  margin: 0 0 0.75rem;
}

.tally-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tally-item {
  display: flex;
  flex-direction: column;
  min-width: 3.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.tally-item__label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-muted);
}

.tally-item__val {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--color-text);
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1rem;
}

.highlight-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 750;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.error {
  color: var(--color-down);
  font-weight: 600;
  font-size: 0.875rem;
}

.notice {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-accent);
  border-radius: var(--radius);
  background: var(--color-surface);
  padding: 0.75rem 1rem;
  margin: 0;
}

.notice--skipped summary {
  cursor: pointer;
  font-weight: 650;
}

.notice--skipped ul {
  margin: 0.5rem 0 0;
  padding-left: 1.1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 650;
  cursor: pointer;
  border: none;
}

.btn--primary {
  background: var(--color-accent);
  color: #ffffff;
}

.btn--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
</style>

