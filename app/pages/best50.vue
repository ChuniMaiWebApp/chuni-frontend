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
      title: 'Best 30 (B30)',
      subtitle: 'Highest rated plays on older versions',
      ...data.value.best,
    },
    {
      key: 'new',
      title: 'New 20 (N20)',
      subtitle: 'Highest rated plays on the current version',
      ...data.value.new,
    },
  ]
})
</script>

<template>
  <section class="best50-page">
    <header class="page-header">
      <div>
        <h1>Official Rating Breakdown</h1>
        <div v-if="data" class="rating-header">
          <RatingValue :rating="data.rating" kind="player" size="lg" />

          <span class="rating__caption">Official CHUNITHM Rating (B30 + N20)</span>
        </div>
      </div>

      <button type="button" class="btn btn--secondary" :disabled="pending" @click="refresh()">
        {{ pending ? 'Loading…' : 'Refresh' }}
      </button>
    </header>

    <ApiError v-if="error" :error="error" />

    <AppSpinner
      v-else-if="pending && !data"
      label="Fetching your rating from CHUNITHM-NET…"
    />

    <template v-else>
      <section v-for="frame in frames" :key="frame.key" class="frame">
        <header class="frame__header">
          <div>
            <h2>{{ frame.title }}</h2>
            <span class="frame__subtitle">{{ frame.subtitle }}</span>
          </div>
          <div class="frame__stats tabular">
            <span class="frame__count">{{ frame.scores.length }} / {{ frame.slots }}</span>
            <span class="frame__avg">Average: {{ average(frame.scores, frame.slots).toFixed(2) }}</span>
          </div>
        </header>

        <p v-if="!frame.scores.length" class="empty">{{ frame.subtitle }} — no tracks recorded yet.</p>

        <ul v-else class="list">
          <li v-for="(score, index) in frame.scores" :key="index">
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
.best50-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

/*
 * The rating is the page; the heading only names it. Sized the other way round
 * the 28px title shouted over the number everyone came to read.
 */
.page-header h1 {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
  margin: 0;
}

.rating-header {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin-top: 0.15rem;
}

.rating__caption {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
}

.frame {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.frame__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.frame__header h2 {
  font-size: 1.25rem;
  font-weight: 750;
  margin: 0;
}

.frame__subtitle {
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.frame__stats {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  font-size: 0.8125rem;
  font-weight: 650;
  color: var(--color-muted);
}

.frame__count {
  color: var(--color-text);
}

.frame__avg {
  color: var(--color-accent);
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
  border-radius: var(--radius);
}

.list__link:hover {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.empty {
  color: var(--color-muted);
  font-size: 0.875rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.875rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
}

.btn--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
</style>

