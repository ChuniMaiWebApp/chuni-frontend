<script setup lang="ts">
import type { StoredScore } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · Top scores' })

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
</script>

<template>
  <section>
    <h1>Top scores</h1>
    <p class="lead">
      Your personal bests from the local cache. Run a
      <NuxtLink to="/statistics">sync</NuxtLink> after playing to refresh them.
    </p>

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
      <label>
        Sort by
        <select v-model="sort">
          <option v-for="option in SORTS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label>
        Order
        <select v-model="order">
          <option value="desc">Best first</option>
          <option value="asc">Worst first</option>
        </select>
      </label>
      <button type="submit" :disabled="status === 'pending'">Apply</button>
    </form>

    <ApiError v-if="error" :error="error" />

    <p v-else-if="!scores?.length" class="empty">
      No scores stored yet. Run a sync from the
      <NuxtLink to="/statistics">statistics page</NuxtLink>.
    </p>

    <ul v-else class="list">
      <li v-for="(score, index) in scores" :key="`${score.song.id}-${score.chart.difficultyName}`">
        <ScoreCard :score="score" :index="index + 1" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.lead {
  color: var(--color-muted);
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.lead a {
  color: var(--color-accent);
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
  min-width: 10rem;
}

.filters button {
  font: inherit;
  font-size: 0.875rem;
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
  gap: 0.625rem;
}

.empty {
  color: var(--color-muted);
}
</style>
