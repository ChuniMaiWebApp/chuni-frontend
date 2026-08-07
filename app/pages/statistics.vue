<script setup lang="ts">
import type { Statistics, SyncResult } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · Statistics' })

const api = useApi()

const level = ref('')
const difficulty = ref('')

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
  <section>
    <header class="page-header">
      <h1>Statistics</h1>
      <button type="button" :disabled="syncing" @click="runSync">
        {{ syncing ? 'Syncing…' : 'Sync from CHUNITHM-NET' }}
      </button>
    </header>

    <p class="lead">
      Computed from scores stored locally.
      <template v-if="lastSynced">Last synced {{ lastSynced }}.</template>
      <template v-else>Nothing synced yet — press sync to fill it in.</template>
    </p>

    <p v-if="syncError" class="error">{{ syncError }}</p>

    <p v-if="datasetWarning" class="notice">{{ datasetWarning }}</p>

    <details v-if="skipped.length" class="notice notice--skipped">
      <summary>
        {{ skipped.length }} score(s) could not be stored — the song database
        does not have those charts yet
      </summary>
      <ul>
        <li v-for="chart in skipped" :key="chart">{{ chart }}</li>
      </ul>
    </details>

    <form class="filters" @submit.prevent="refresh()">
      <label>
        Level
        <input v-model="level" type="text" placeholder="14+, 14.5 or 13.5-13.8">
      </label>
      <label>
        Difficulty
        <select v-model="difficulty">
          <option value="">All</option>
          <option value="BAS">BASIC</option>
          <option value="ADV">ADVANCED</option>
          <option value="EXP">EXPERT</option>
          <option value="MAS">MASTER</option>
          <option value="ULT">ULTIMA</option>
        </select>
      </label>
      <button type="submit" :disabled="status === 'pending'">Apply</button>
    </form>

    <ApiError v-if="error" :error="error" />

    <template v-else-if="stats">
      <dl class="tiles">
        <div class="tile">
          <dt>Played</dt>
          <dd>
            {{ stats.coverage.played }} / {{ stats.coverage.total }}
            <small>{{ stats.coverage.percentage.toFixed(2) }}%</small>
          </dd>
        </div>
        <div class="tile">
          <dt>OVER POWER</dt>
          <dd>
            {{ stats.overpower.value.toFixed(2) }}
            <small>/ {{ stats.overpower.max.toFixed(2) }} ({{ stats.overpower.percentage.toFixed(2) }}%)</small>
          </dd>
        </div>
        <div class="tile">
          <dt>Average score</dt>
          <dd>
            {{ stats.averageScore.played.toLocaleString('en-US') }}
            <small>on charts played</small>
          </dd>
        </div>
        <div class="tile">
          <dt>99% AJ</dt>
          <dd>{{ stats.counts['99AJ'] }}</dd>
        </div>
      </dl>

      <div class="tally">
        <section>
          <h2>Ranks</h2>
          <ul>
            <li v-for="rank in RANK_ORDER" :key="rank">
              <span>{{ rank }}</span>
              <strong>{{ stats.counts.ranks[rank] ?? 0 }}</strong>
            </li>
          </ul>
        </section>

        <section>
          <h2>Combo lamps</h2>
          <ul>
            <li v-for="lamp in COMBO_ORDER" :key="lamp">
              <span>{{ comboLabel[lamp] }}</span>
              <strong>{{ stats.counts.comboLamps[lamp] ?? 0 }}</strong>
            </li>
          </ul>
        </section>
      </div>

      <div v-if="stats.best" class="highlights">
        <div>
          <h2>Best score</h2>
          <ScoreCard :score="stats.best" />
        </div>
        <div v-if="stats.worst">
          <h2>Lowest score</h2>
          <ScoreCard :score="stats.worst" />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.page-header h1 {
  margin: 0;
}

.page-header button,
.filters button {
  font: inherit;
  font-size: 0.875rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.lead {
  color: var(--color-muted);
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.filters label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.filters input,
.filters select {
  font: inherit;
  font-size: 0.9375rem;
  text-transform: none;
  letter-spacing: 0;
  color: var(--color-text);
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  min-width: 11rem;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.75rem;
  margin: 0 0 1.5rem;
}

.tile {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  padding: 0.875rem 1rem;
}

.tile dt {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.tile dd {
  margin: 0.25rem 0 0;
  font-size: 1.25rem;
  font-variant-numeric: tabular-nums;
}

.tile small {
  display: block;
  font-size: 0.75rem;
  color: var(--color-muted);
}

.tally {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.tally section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  padding: 0.875rem 1rem;
}

.tally h2 {
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  margin: 0 0 0.5rem;
}

.tally ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tally li {
  display: flex;
  flex-direction: column;
  min-width: 3rem;
}

.tally span {
  font-size: 0.6875rem;
  color: var(--color-muted);
}

.tally strong {
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}

.highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1rem;
}

.highlights h2 {
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  margin: 0 0 0.5rem;
}

.error {
  color: var(--color-down);
  font-size: 0.875rem;
}

.notice {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent);
  border-radius: 8px;
  background: var(--color-surface);
  padding: 0.625rem 0.875rem;
  margin: 0 0 1rem;
}

.notice--skipped summary {
  cursor: pointer;
}

.notice--skipped ul {
  margin: 0.5rem 0 0;
  padding-left: 1.1rem;
}
</style>
