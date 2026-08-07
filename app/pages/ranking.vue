<script setup lang="ts">
import type { Ranking } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · Rankings' })

const { user } = useAuth()

type BoardKey = 'rating' | 'score' | 'currency'

const BOARDS = [
  {
    key: 'rating' as const,
    label: 'Rating',
    heading: 'Highest rating',
    unit: null,
    format: (value: number) => value.toFixed(2),
  },
  {
    key: 'score' as const,
    label: 'Total high score',
    heading: 'Total high score',
    unit: null,
    format: (value: number) => value.toLocaleString('en-GB'),
  },
  {
    key: 'currency' as const,
    label: 'Currency',
    heading: 'Total point',
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
  (data.value?.ranking ?? []).map((entry, index, all) => ({
    ...entry,
    tiedWithPrevious: index > 0 && all[index - 1]!.position === entry.position,
    // Names come back full-width, exactly as the profile reports them, so a
    // plain comparison is enough to spot yourself in the list.
    isYou: user.value !== null && entry.playerName === user.value.displayName,
  })),
)

const yourEntry = computed(() => rows.value.find(row => row.isYou) ?? null)
</script>

<template>
  <section>
    <h1>Rankings</h1>
    <p class="lead">
      The top 100 on CHUNITHM International, straight from CHUNITHM-NET. The
      site recalculates these once a day, so a play you just made will not move
      you until the next update.
    </p>

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

    <div v-if="board === 'rating'" class="scope">
      <label>
        <input v-model="scope" type="radio" value="global"> Everyone
      </label>
      <label>
        <input v-model="scope" type="radio" value="friend"> Friends only
      </label>
    </div>

    <ApiError v-if="error" :error="error" />

    <template v-else>
      <p class="meta">
        <span v-if="data?.updatedAt">
          Updated {{ formatDateTime(data.updatedAt) }}.
        </span>
        <span v-if="yourEntry" class="meta__you">
          You are #{{ yourEntry.position }} with
          {{ active.format(yourEntry.value) }}{{ active.unit }}.
        </span>
        <span v-else-if="status === 'success'">
          You are not in this top 100.
        </span>
      </p>

      <p v-if="status === 'pending'" class="empty">Loading…</p>

      <p v-else-if="rows.length === 0" class="empty">
        <template v-if="board === 'rating' && scope === 'friend'">
          No friends on this board yet — add some in CHUNITHM-NET and they will
          show up here.
        </template>
        <template v-else>This board is empty right now.</template>
      </p>

      <ol v-else class="board">
        <li
          v-for="row in rows"
          :key="`${row.position}-${row.playerName}`"
          class="row"
          :class="{ 'row--you': row.isYou }"
        >
          <span class="row__rank" :class="{ 'row__rank--tied': row.tiedWithPrevious }">
            <template v-if="row.tiedWithPrevious">=</template>
            <template v-else>{{ row.position }}</template>
          </span>
          <span class="row__name">
            {{ row.playerName }}
            <span v-if="row.isYou" class="row__badge">you</span>
          </span>
          <span class="row__value">
            {{ active.format(row.value) }}<small v-if="active.unit">{{ active.unit }}</small>
          </span>
        </li>
      </ol>
    </template>
  </section>
</template>

<style scoped>
h1 {
  margin: 0 0 0.35rem;
  font-size: 1.375rem;
}

.lead {
  margin: 0 0 1.25rem;
  max-width: 44rem;
  color: var(--color-muted);
  font-size: 0.875rem;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.875rem;
}

.tabs__tab {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-muted);
  padding: 0.35rem 0.85rem;
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
}

.tabs__tab--active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.scope {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.875rem;
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0 0 0.875rem;
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.meta__you {
  color: var(--color-accent);
}

.empty {
  color: var(--color-muted);
  font-size: 0.875rem;
}

.board {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.row {
  display: grid;
  grid-template-columns: 3rem 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.875rem;
  background: var(--color-surface);
}

.row:nth-child(even) {
  background: color-mix(in srgb, var(--color-surface) 60%, transparent);
}

.row--you {
  background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface));
  box-shadow: inset 3px 0 0 var(--color-accent);
}

.row__rank {
  font-variant-numeric: tabular-nums;
  font-size: 0.9375rem;
  color: var(--color-muted);
  text-align: right;
}

/* A tie repeats the rank above; the marker says so without shouting it. */
.row__rank--tied {
  opacity: 0.45;
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

.row__badge {
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-bg);
  padding: 0.05rem 0.4rem;
  font-size: 0.625rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.row__value {
  font-variant-numeric: tabular-nums;
  font-size: 0.9375rem;
}

.row__value small {
  color: var(--color-muted);
  font-size: 0.75rem;
  margin-left: 0.1rem;
}

@media (max-width: 30rem) {
  .row {
    grid-template-columns: 2.25rem 1fr auto;
    font-size: 0.875rem;
  }
}
</style>
