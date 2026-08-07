<script setup lang="ts">
import type { Leaderboard, SongDetail, SongSearchResult } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · Chart leaderboard' })

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

// Chart selection lives in the URL so a board can be linked to from a song
// page or shared with someone.
const songId = ref(route.query.songId ? Number(route.query.songId) : null)
const difficulty = ref(Number(route.query.difficulty ?? 3))

const DIFFICULTIES = [
  { value: 0, label: 'BASIC' },
  { value: 1, label: 'ADVANCED' },
  { value: 2, label: 'EXPERT' },
  { value: 3, label: 'MASTER' },
  { value: 4, label: 'ULTIMA' },
]

const query = ref('')
const { data: results, status: searchStatus } = await useApiFetch<SongSearchResult[]>(
  '/songs/search',
  {
    // Excludes songs removed from the game, which have no ranking page to
    // show. The flag filters on removal, not on International availability.
    query: computed(() => ({ q: query.value, available: true })),
    immediate: false,
    watch: false,
  },
)

let debounce: ReturnType<typeof setTimeout> | null = null

const runSearch = () => {
  if (debounce) clearTimeout(debounce)
  if (!query.value.trim()) return

  debounce = setTimeout(() => void refreshNuxtData(), 250)
}

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce)
})

const { data: song } = await useApiFetch<SongDetail>(
  () => `/songs/${songId.value}`,
  { immediate: songId.value !== null },
)

/** Which difficulties the selected song actually has, so ULTIMA is not offered
 * on a song that has none. */
const availableDifficulties = computed(() => {
  const charts = song.value?.charts

  if (!charts) return DIFFICULTIES

  return DIFFICULTIES.filter(entry =>
    charts.some(chart => chart.difficulty === entry.value),
  )
})

// CHUNITHM-NET drops the ranking page along with the song, so there is nothing
// to fetch for a removed one.
const removed = computed(() => song.value?.removed === true)

const {
  data: board,
  error,
  status,
} = await useApiFetch<Leaderboard>('/chunithm/leaderboard', {
  query: computed(() => ({
    songId: songId.value,
    difficulty: difficulty.value,
  })),
  immediate: songId.value !== null,
})

const select = (id: number) => {
  songId.value = id
  query.value = ''
  void router.replace({
    query: { songId: String(id), difficulty: String(difficulty.value) },
  })
}

watch(difficulty, (value) => {
  if (songId.value === null) return

  void router.replace({
    query: { songId: String(songId.value), difficulty: String(value) },
  })
})

const rows = computed(() =>
  (board.value?.ranking ?? []).map((entry, index, all) => ({
    ...entry,
    tiedWithPrevious: index > 0 && all[index - 1]!.position === entry.position,
    isYou: user.value !== null && entry.playerName === user.value.displayName,
  })),
)

const yourEntry = computed(() => rows.value.find(row => row.isYou) ?? null)

const chart = computed(
  () => song.value?.charts.find(entry => entry.difficulty === difficulty.value) ?? null,
)
</script>

<template>
  <section>
    <h1>Chart leaderboard</h1>
    <p class="lead">
      The top 100 scores on a single chart across CHUNITHM International. Pick
      a song, then a difficulty.
    </p>

    <form class="search" @submit.prevent="runSearch">
      <input
        v-model="query"
        type="search"
        placeholder="Song title, artist or alias…"
        autocomplete="off"
        @input="runSearch"
      >
    </form>

    <ul v-if="query.trim() && results?.length" class="suggestions">
      <li v-for="result in results.slice(0, 8)" :key="result.id">
        <button type="button" @click="select(result.id)">
          <!-- Decorative: the title next to it already names the song. -->
          <img v-if="result.jacketUrl" :src="result.jacketUrl" alt="" width="32" height="32">
          <span class="suggestions__title">{{ result.title }}</span>
          <span class="suggestions__artist">{{ result.artist }}</span>
        </button>
      </li>
    </ul>

    <p v-else-if="query.trim() && searchStatus === 'success'" class="empty">
      Nothing matched “{{ query }}”.
    </p>

    <template v-if="songId !== null">
      <header v-if="song" class="chosen">
        <img
          v-if="song.jacketUrl"
          :src="song.jacketUrl"
          :alt="song.title"
          width="64"
          height="64"
        >
        <div>
          <h2>{{ song.title }}</h2>
          <p class="chosen__artist">{{ song.artist }}</p>
        </div>
      </header>

      <div class="difficulties" role="tablist">
        <button
          v-for="entry in availableDifficulties"
          :key="entry.value"
          type="button"
          role="tab"
          :aria-selected="difficulty === entry.value"
          class="difficulties__tab"
          :class="{ 'difficulties__tab--active': difficulty === entry.value }"
          :style="{ '--difficulty': difficultyColour(entry.value) }"
          @click="difficulty = entry.value"
        >
          {{ entry.label }}
          <small v-if="song?.charts.find(c => c.difficulty === entry.value)?.level">
            {{ song?.charts.find(c => c.difficulty === entry.value)?.level }}
          </small>
        </button>
      </div>

      <p v-if="removed" class="empty">
        This song has been removed from the game, so CHUNITHM-NET no longer
        publishes a leaderboard for it.
      </p>

      <ApiError v-else-if="error" :error="error" />

      <template v-else>
        <p class="meta">
          <span v-if="chart?.const !== null && chart">
            Chart constant {{ chart.const }}.
          </span>
          <span v-if="board?.updatedAt">
            Updated {{ formatDateTime(board.updatedAt) }}.
          </span>
          <span v-if="yourEntry" class="meta__you">
            You are #{{ yourEntry.position }} with
            {{ formatScore(yourEntry.score) }}.
          </span>
          <span v-else-if="status === 'success' && rows.length">
            You are not in this top 100.
          </span>
        </p>

        <p v-if="status === 'pending'" class="empty">Loading…</p>

        <p v-else-if="rows.length === 0" class="empty">
          No scores on this chart yet.
        </p>

        <ol v-else class="board">
          <li
            v-for="row in rows"
            :key="`${row.position}-${row.playerName}`"
            class="row"
            :class="{ 'row--you': row.isYou }"
          >
            <span
              class="row__rank"
              :class="{ 'row__rank--tied': row.tiedWithPrevious }"
            >
              <template v-if="row.tiedWithPrevious">=</template>
              <template v-else>{{ row.position }}</template>
            </span>
            <span class="row__name">
              {{ row.playerName }}
              <span v-if="row.isYou" class="row__badge">you</span>
              <!-- The site only reports an AJC count when there is one. -->
              <span v-if="row.ajcCount" class="row__ajc">AJC ×{{ row.ajcCount }}</span>
            </span>
            <span class="row__score">{{ formatScore(row.score) }}</span>
            <span class="row__date">{{ formatDateTime(row.achievedAt) }}</span>
          </li>
        </ol>
      </template>
    </template>

    <p v-else-if="!query.trim()" class="empty">
      Search for a song to see its leaderboard.
    </p>
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

.search input {
  width: 100%;
  max-width: 28rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: inherit;
  font: inherit;
}

.suggestions {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  max-width: 28rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.suggestions button {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.4rem 0.625rem;
  border: 0;
  background: var(--color-surface);
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
}

.suggestions button:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface));
}

.suggestions img {
  border-radius: 4px;
  flex-shrink: 0;
}

.suggestions__title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestions__artist {
  color: var(--color-muted);
  font-size: 0.75rem;
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chosen {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin: 1.5rem 0 1rem;
}

.chosen img {
  border-radius: 8px;
}

.chosen h2 {
  margin: 0;
  font-size: 1.125rem;
}

.chosen__artist {
  margin: 0.15rem 0 0;
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.difficulties {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.875rem;
}

.difficulties__tab {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-muted);
  padding: 0.35rem 0.85rem;
  font: inherit;
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  cursor: pointer;
}

.difficulties__tab--active {
  border-color: var(--difficulty);
  color: var(--difficulty);
  background: color-mix(in srgb, var(--difficulty) 14%, transparent);
}

.difficulties__tab small {
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
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
  grid-template-columns: 3rem 1fr auto auto;
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

.row__ajc {
  border-radius: 999px;
  border: 1px solid var(--color-border);
  padding: 0.05rem 0.4rem;
  font-size: 0.625rem;
  color: var(--color-muted);
}

.row__score {
  font-variant-numeric: tabular-nums;
  font-size: 0.9375rem;
}

.row__date {
  font-size: 0.75rem;
  color: var(--color-muted);
  white-space: nowrap;
}

@media (max-width: 40rem) {
  .row {
    grid-template-columns: 2.25rem 1fr auto;
  }

  .row__date {
    display: none;
  }
}
</style>
