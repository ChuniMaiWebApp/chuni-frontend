<script setup lang="ts">
import type { Leaderboard, SongDetail, SongSearchResult } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmWebApp · Chart Leaderboard' })

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

/** Which difficulties the selected song actually has */
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
  (board.value?.ranking ?? []).map((entry, index, all) => {
    const tiedWithPrevious
      = index > 0 && all[index - 1]!.position === entry.position

    return {
      ...entry,
      tiedWithPrevious,
      isYou: user.value !== null && entry.playerName === user.value.displayName,
      /* Only the row that prints the number is decorated — a chart with ten
         players tied at the top would otherwise be ten rows of gold. */
      isPodium: !tiedWithPrevious && entry.position <= 3,
    }
  }),
)

const yourEntry = computed(() => rows.value.find(row => row.isYou) ?? null)

const chart = computed(
  () => song.value?.charts.find(entry => entry.difficulty === difficulty.value) ?? null,
)
</script>

<template>
  <section class="leaderboard-page">
    <header class="page-header">
      <div>
        <h1>Chart Leaderboard</h1>
        <p class="lead">
          The top 100 scores on a single chart across CHUNITHM International. Pick a song, then a difficulty.
        </p>
      </div>
    </header>

    <div class="search-box">
      <input
        v-model="query"
        type="search"
        placeholder="Search song title, artist or alias…"
        autocomplete="off"
        class="search-input"
        @input="runSearch"
      >

      <ul v-if="query.trim() && results?.length" class="suggestions card">
        <li v-for="result in results.slice(0, 8)" :key="result.id">
          <button type="button" class="suggestion-btn" @click="select(result.id)">
            <img v-if="result.jacketUrl" :src="result.jacketUrl" alt="" width="36" height="36" class="suggestion-img">
            <div class="suggestion-info">
              <span class="suggestions__title">{{ result.title }}</span>
              <span class="suggestions__artist">{{ result.artist }}</span>
            </div>
          </button>
        </li>
      </ul>

      <p v-else-if="query.trim() && searchStatus === 'success'" class="empty">
        Nothing matched “{{ query }}”.
      </p>
    </div>

    <template v-if="songId !== null">
      <header v-if="song" class="chosen card">
        <img
          v-if="song.jacketUrl"
          :src="song.jacketUrl"
          :alt="song.title"
          width="72"
          height="72"
          class="chosen__jacket"
        >
        <div class="chosen__info">
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
          :style="{ '--difficulty': difficultyInk(entry.value) }"
          @click="difficulty = entry.value"
        >
          {{ entry.label }}
          <small v-if="song?.charts.find(c => c.difficulty === entry.value)?.level">
            {{ song?.charts.find(c => c.difficulty === entry.value)?.level }}
          </small>
        </button>
      </div>

      <p v-if="removed" class="empty">
        This song has been removed from the game, so CHUNITHM-NET no longer publishes a leaderboard for it.
      </p>

      <ApiError v-else-if="error" :error="error" />

      <template v-else>
        <div class="meta card">
          <span v-if="chart?.const !== null && chart">
            Chart constant: <strong>{{ chart.const }}</strong>
          </span>
          <span v-if="board?.updatedAt">
            Updated: <strong>{{ formatDateTime(board.updatedAt) }}</strong>
          </span>
          <span v-if="yourEntry" class="meta__you">
            You are <strong>#{{ yourEntry.position }}</strong> with <strong>{{ formatScore(yourEntry.score) }}</strong>.
          </span>
          <span v-else-if="status === 'success' && rows.length" class="meta__not-in">
            You are not in this top 100.
          </span>
        </div>

        <AppSpinner v-if="status === 'pending'" label="Loading the board…" />

        <p v-else-if="rows.length === 0" class="empty">
          No scores recorded on this chart yet.
        </p>

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
            <span
              class="row__rank"
              :class="{ 'row__rank--tied': row.tiedWithPrevious }"
            >
              <template v-if="row.tiedWithPrevious">=</template>
              <template v-else-if="row.position === 1">🥇 1</template>
              <template v-else-if="row.position === 2">🥈 2</template>
              <template v-else-if="row.position === 3">🥉 3</template>
              <template v-else>{{ row.position }}</template>
            </span>

            <span class="row__name">
              <strong class="player-name-text">{{ row.playerName }}</strong>
              <span v-if="row.isYou" class="row__badge">YOU</span>
              <span v-if="row.ajcCount" class="row__ajc">AJC ×{{ row.ajcCount }}</span>
            </span>

            <span class="row__score tabular">{{ formatScore(row.score) }}</span>
            <span class="row__date tabular">{{ formatDateTime(row.achievedAt) }}</span>
          </li>
        </ol>
      </template>
    </template>

    <p v-else-if="!query.trim()" class="empty empty--center card">
      Search for a song title above to view its top 100 leaderboard.
    </p>
  </section>
</template>

<style scoped>
.leaderboard-page {
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

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  max-width: 30rem;
  padding: 0.6rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.9375rem;
}

.search-input:focus {
  outline: 2px solid var(--color-accent);
  border-color: transparent;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-width: 30rem;
  margin-top: 0.4rem;
  list-style: none;
  padding: 0.35rem 0;
  z-index: 50;
}

.suggestion-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.45rem 0.875rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.suggestion-btn:hover {
  background: var(--color-surface-hover);
}

.suggestion-img {
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.suggestion-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.suggestions__title {
  font-weight: 700;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestions__artist {
  color: var(--color-muted);
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chosen {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.125rem;
}

.chosen__jacket {
  border-radius: var(--radius);
  object-fit: cover;
}

.chosen h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
}

.chosen__artist {
  margin: 0.2rem 0 0;
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.difficulties {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.difficulties__tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-muted);
  padding: 0.45rem 0.95rem;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.15s ease;
}

.difficulties__tab--active {
  border-color: var(--difficulty);
  color: var(--difficulty);
  background: color-mix(in srgb, var(--difficulty) 15%, var(--color-surface) 85%);
  box-shadow: 0 0 8px color-mix(in srgb, var(--difficulty) 30%, transparent);
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
  grid-template-columns: 4rem 1fr auto auto;
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
  background: rgba(246, 203, 17, 0.08) !important;
  box-shadow: inset 3px 0 0 #f6cb11;
}

.row--rank-2 {
  background: rgba(138, 231, 255, 0.08) !important;
  box-shadow: inset 3px 0 0 #8ae7ff;
}

.row--rank-3 {
  background: rgba(219, 87, 10, 0.08) !important;
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

  overflow: hidden;
  text-overflow: ellipsis;
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

/*
 * ALL JUSTICE CRITICAL count.
 *
 * The gold sits on the dark chip in both themes rather than on the row. On
 * white it measured 1.23:1 — the badge marking the rarest thing on the board
 * was the least readable thing on it.
 */
.row__ajc {
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, #ffe45e 55%, transparent);
  background: var(--color-game-chip-bg);
  padding: 0.1rem 0.45rem;
  font-size: 0.625rem;
  font-weight: 700;
  color: #ffe45e;
}

.row__score {
  font-size: 1rem;
  font-weight: 750;
  color: var(--color-text);
}

.row__date {
  font-size: 0.75rem;
  color: var(--color-muted);
  white-space: nowrap;
}

.empty {
  color: var(--color-muted);
  font-size: 0.875rem;
}

.empty--center {
  padding: 2.5rem 1rem;
  text-align: center;
}

@media (max-width: 40rem) {
  .row {
    grid-template-columns: 3.5rem 1fr auto;
  }

  .row__date {
    display: none;
  }
}
</style>

