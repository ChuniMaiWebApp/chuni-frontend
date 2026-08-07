<script setup lang="ts">
import type { RatingBreakdown } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · Best 50' })

const { data, error, pending, refresh } = await useApiFetch<RatingBreakdown>(
  '/chunithm/records/best50',
)

/** Average play rating of a frame, which is what feeds the overall rating. */
const average = (scores: Array<{ rating: number | null }>, slots: number) => {
  if (!scores.length) return 0

  const total = scores.reduce((sum, score) => sum + (score.rating ?? 0), 0)

  return total / slots
}

const frames = computed(() => {
  if (!data.value) return []

  return [
    {
      key: 'best',
      title: 'Best 30',
      subtitle: 'Highest rated plays on older versions',
      ...data.value.best,
    },
    {
      key: 'new',
      title: 'New 20',
      subtitle: 'Highest rated plays on the current version',
      ...data.value.new,
    },
  ]
})
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <h1>Rating breakdown</h1>
        <p v-if="data" class="rating">
          {{ data.rating.toFixed(2) }}
          <span>as reported by the game</span>
        </p>
      </div>

      <button type="button" :disabled="pending" @click="refresh()">
        {{ pending ? 'Loading…' : 'Refresh' }}
      </button>
    </header>

    <ApiError v-if="error" :error="error" />

    <template v-else>
      <section v-for="frame in frames" :key="frame.key" class="frame">
        <header class="frame__header">
          <h2>{{ frame.title }}</h2>
          <span class="frame__meta">
            {{ frame.scores.length }} / {{ frame.slots }}
            · avg {{ average(frame.scores, frame.slots).toFixed(4) }}
          </span>
        </header>

        <p v-if="!frame.scores.length" class="empty">{{ frame.subtitle }} — nothing yet.</p>

        <ul v-else class="list">
          <li v-for="(score, index) in frame.scores" :key="index">
            <!-- The whole card links through: judgements for a personal best
                 are something the bot cannot show at all, so they are worth
                 one click rather than being buried behind a small control. -->
            <NuxtLink
              v-if="score.song.id !== null"
              :to="`/records/${score.song.id}/${score.chart.difficulty}`"
              class="list__link"
            >
              <ScoreCard :score="score" :index="index + 1" />
            </NuxtLink>
            <ScoreCard v-else :score="score" :index="index + 1" />
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>

<style scoped>
.list__link {
  display: block;
  color: inherit;
  text-decoration: none;
  border-radius: var(--radius);
}

.list__link:hover {
  outline: 1px solid var(--color-accent);
  outline-offset: 1px;
}

.list__link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
}

.rating {
  margin: 0.25rem 0 0;
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.rating span {
  display: block;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-muted);
}

.page-header button {
  font: inherit;
  font-size: 0.875rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.frame {
  margin-bottom: 2rem;
}

.frame__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.frame__header h2 {
  font-size: 1rem;
  margin: 0;
}

.frame__meta {
  font-size: 0.8125rem;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
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
