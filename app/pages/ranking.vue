<script setup lang="ts">
import type { Ranking } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · Global Rankings' })

const { user } = useAuth()

type BoardKey = 'rating' | 'score' | 'currency'

const BOARDS = [
  {
    key: 'rating' as const,
    label: 'Rating',
    heading: 'Highest Rating',
    unit: null,
    format: (value: number) => value.toFixed(2),
  },
  {
    key: 'score' as const,
    label: 'Total High Score',
    heading: 'Total High Score',
    unit: null,
    format: (value: number) => value.toLocaleString('en-GB'),
  },
  {
    key: 'currency' as const,
    label: 'Currency (P)',
    heading: 'Total Currency Points',
    unit: 'P',
    format: (value: number) => value.toLocaleString('en-GB'),
  },
]

const board = ref<BoardKey>('rating')
// Only the rating board offers a friends view; CHUNITHM-NET has no friend
// variant of the other two.
const scope = ref<'global' | 'friend'>('global')

const active = computed(
  () => BOARDS.find(entry => entry.key === board.value) ?? BOARDS[0]!,
)

const { data, error, status } = await useApiFetch<Ranking>(
  () => `/chunithm/ranking/${board.value}`,
  {
    query: computed(() =>
      board.value === 'rating' ? { scope: scope.value } : {},
    ),
  },
)

/**
 * CHUNITHM-NET gives every tied player the same position, so the list can open
 * with three players at rank 1. Repeating the number on each row would read as
 * a bug, so the number is drawn once and the rest of the tie is marked.
 */
const rows = computed(() =>
  (data.value?.ranking ?? []).map((entry, index, all) => {
    const tiedWithPrevious
      = index > 0 && all[index - 1]!.position === entry.position

    return {
      ...entry,
      tiedWithPrevious,
      isYou: user.value !== null && entry.playerName === user.value.displayName,
      /*
       * Only the row that prints the number is decorated. Ten players share
       * position 1 on the rating board, and marking every one of them turned
       * the "top three" into a ten-row wall of gold.
       */
      isPodium: !tiedWithPrevious && entry.position <= 3,
    }
  }),
)

const yourEntry = computed(() => rows.value.find(row => row.isYou) ?? null)
</script>

<template>
  <section class="ranking-page">
    <header class="page-header">
      <div>
        <h1>Global Leaderboards</h1>
        <p class="lead">
          The top 100 players on CHUNITHM International. Recalculated once daily by SEGA.
        </p>
      </div>
    </header>

    <div class="tabs" role="tablist">
      <button
        v-for="entry in BOARDS"
        :key="entry.key"
        type="button"
        role="tab"
        :aria-selected="board === entry.key"
        :class="{ 'tabs__tab--active': board === entry.key }"
        class="tabs__tab"
        @click="board = entry.key"
      >
        {{ entry.label }}
      </button>
    </div>

    <div v-if="board === 'rating'" class="scope-toggle">
      <label class="scope-option">
        <input v-model="scope" type="radio" value="global">
        <span>Everyone</span>
      </label>
      <label class="scope-option">
        <input v-model="scope" type="radio" value="friend">
        <span>Friends only</span>
      </label>
    </div>

    <ApiError v-if="error" :error="error" />

    <template v-else>
      <div class="meta card">
        <span v-if="data?.updatedAt">
          Updated: <strong>{{ formatDateTime(data.updatedAt) }}</strong>
        </span>
        <span v-if="yourEntry" class="meta__you">
          You are <strong>#{{ yourEntry.position }}</strong> with <strong>{{ active.format(yourEntry.value) }}{{ active.unit }}</strong>.
        </span>
        <span v-else-if="status === 'success'" class="meta__not-in">
          You are not in this top 100.
        </span>
      </div>

      <AppSpinner v-if="status === 'pending'" label="Loading the board…" />

      <div v-else-if="rows.length === 0" class="empty-card card">
        <p class="empty">
          <template v-if="board === 'rating' && scope === 'friend'">
            No friends found on this board yet — add friends on CHUNITHM-NET to compare ratings!
          </template>
          <template v-else>This ranking board is currently empty.</template>
        </p>
      </div>

      <ol v-else class="board card">
        <li
          v-for="row in rows"
          :key="`${row.position}-${row.playerName}`"
          class="row"
          :class="[
            row.isPodium ? `row--rank-${row.position}` : null,
            { 'row--you': row.isYou },
          ]"
        >
          <span class="row__rank" :class="{ 'row__rank--tied': row.tiedWithPrevious }">
            <template v-if="row.tiedWithPrevious">=</template>
            <template v-else-if="row.position === 1">🥇 1</template>
            <template v-else-if="row.position === 2">🥈 2</template>
            <template v-else-if="row.position === 3">🥉 3</template>
            <template v-else>{{ row.position }}</template>
          </span>

          <span class="row__name">
            <strong class="player-name-text">{{ row.playerName }}</strong>
            <span v-if="row.isYou" class="row__badge">YOU</span>
          </span>

          <span class="row__value tabular">
            <RatingValue v-if="board === 'rating'" :rating="row.value" size="md" />
            <template v-else>
              {{ active.format(row.value) }}<small v-if="active.unit">{{ active.unit }}</small>
            </template>
          </span>
        </li>
      </ol>
    </template>
  </section>
</template>

<style scoped>
.ranking-page {
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
  margin: 0;
  max-width: 44rem;
  color: var(--color-muted);
  font-size: 0.84375rem;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tabs__tab {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-muted);
  padding: 0.45rem 0.95rem;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tabs__tab--active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface) 86%);
}

.scope-toggle {
  display: flex;
  gap: 1.25rem;
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.scope-option {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-weight: 600;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  padding: 0.875rem 1.125rem;
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.meta strong {
  color: var(--color-text);
}

.meta__you {
  color: var(--color-accent);
}

.board {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.row {
  display: grid;
  grid-template-columns: 4rem 1fr auto;
  align-items: center;
  gap: 0.875rem;
  padding: 0.6rem 1.125rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.row:last-child {
  border-bottom: none;
}

.row:nth-child(even) {
  background: var(--color-surface-hover);
}

/* Podium Highlights */
.row--rank-1 {
  background: rgba(246, 203, 17, 0.08);
  box-shadow: inset 3px 0 0 #f6cb11;
}

.row--rank-2 {
  background: rgba(138, 231, 255, 0.08);
  box-shadow: inset 3px 0 0 #8ae7ff;
}

.row--rank-3 {
  background: rgba(219, 87, 10, 0.08);
  box-shadow: inset 3px 0 0 #ffad3c;
}

.row--you {
  background: color-mix(in srgb, var(--color-accent) 15%, var(--color-surface)) !important;
  box-shadow: inset 4px 0 0 var(--color-accent);
}

.row__rank {
  font-size: 0.9375rem;
  font-weight: 750;
  color: var(--color-text);
}

.row__rank--tied {
  opacity: 0.5;
}

.row__name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-name-text {
  font-size: 0.9375rem;
  font-weight: 650;
}

.row__badge {
  border-radius: 999px;
  background: var(--color-accent);
  color: #ffffff;
  padding: 0.1rem 0.45rem;
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.row__value {
  font-size: 1rem;
  font-weight: 750;
  color: var(--color-text);
}

.row__value small {
  color: var(--color-muted);
  font-size: 0.75rem;
  margin-left: 0.15rem;
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

@media (max-width: 30rem) {
  .row {
    grid-template-columns: 3.5rem 1fr auto;
    font-size: 0.875rem;
  }
}
</style>

