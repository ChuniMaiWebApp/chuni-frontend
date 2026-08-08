<script setup lang="ts">
import type { SongSearchResult } from '~~/shared/types/api'

useHead({ title: 'ChunithmQueue · Songs Database' })

const route = useRoute()
const router = useRouter()

// The query lives in the URL so a search can be shared or reloaded.
const query = ref((route.query.q as string) ?? '')
const availableOnly = ref(route.query.available !== 'false')

const { data: results, error, status } = await useApiFetch<SongSearchResult[]>(
  '/songs/search',
  {
    query: computed(() => ({
      q: query.value,
      available: availableOnly.value,
    })),
    // Nothing to search for yet on first paint.
    immediate: Boolean(query.value),
    watch: false,
  },
)

let debounce: ReturnType<typeof setTimeout> | null = null

const runSearch = () => {
  if (debounce) clearTimeout(debounce)

  debounce = setTimeout(() => {
    void router.replace({
      query: {
        q: query.value || undefined,
        available: availableOnly.value ? undefined : 'false',
      },
    })
    void refreshNuxtData()
  }, 250)
}

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce)
})
</script>

<template>
  <section class="songs-page">
    <header class="page-header">
      <div>
        <h1>Song Database</h1>
        <p class="lead">
          Search by title, artist, or alias. Romaji is supported — e.g. <code>tentai kansoku</code> finds 天体観測.
        </p>
      </div>
    </header>

    <form class="search-bar card" @submit.prevent="runSearch">
      <input
        v-model="query"
        type="search"
        placeholder="Search song title, artist or alias…"
        autocomplete="off"
        class="search-input"
        @input="runSearch"
      >
      <label class="toggle-field">
        <input v-model="availableOnly" type="checkbox" @change="runSearch">
        <span>Hide removed songs</span>
      </label>
    </form>

    <ApiError v-if="error" :error="error" />

    <p v-else-if="!query" class="empty card empty--center">
      Type a song name or artist above to begin searching.
    </p>

    <AppSpinner v-else-if="status === 'pending'" label="Searching…" />

    <p v-else-if="!results?.length" class="empty card empty--center">
      No songs matched “{{ query }}”.
    </p>

    <ul v-else class="results-list">
      <li v-for="song in results" :key="song.id">
        <NuxtLink :to="`/songs/${song.id}`" class="result-card card">
          <img
            v-if="song.jacketUrl"
            :src="song.jacketUrl"
            alt=""
            width="64"
            height="64"
            loading="lazy"
            class="result__jacket"
          >
          <div v-else class="result__placeholder" aria-hidden="true" />

          <div class="result__body">
            <h2 class="result__title">{{ song.title }}</h2>
            <p class="result__artist">{{ song.artist }}</p>
            <div class="result__meta">
              <span class="meta-tag">{{ song.genre }}</span>
              <span class="meta-tag">{{ song.version }}</span>
              <span v-if="song.matchedAlias" class="meta-tag meta-tag--alias">
                matched “{{ song.matchedAlias }}”
              </span>
              <span v-if="song.removed" class="meta-tag meta-tag--removed">Removed</span>
            </div>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.songs-page {
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
  margin: 0;
}

.lead code {
  background: var(--color-bg);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1.125rem;
}

.search-input {
  flex: 1;
  font: inherit;
  font-size: 0.9375rem;
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
}

.search-input:focus {
  outline: 2px solid var(--color-accent);
  border-color: transparent;
}

.toggle-field {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-muted);
  white-space: nowrap;
  cursor: pointer;
}

.results-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.result-card {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.875rem 1.125rem;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.result-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

.result__jacket,
.result__placeholder {
  width: 64px;
  height: 64px;
  border-radius: var(--radius);
  object-fit: cover;
  flex-shrink: 0;
}

.result__placeholder {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.result__body {
  min-width: 0;
  flex: 1;
}

.result__title {
  font-size: 1rem;
  font-weight: 750;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
}

.result__artist {
  margin: 0.15rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.35rem 0 0;
}

.meta-tag {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-muted);
}

.meta-tag--alias {
  text-transform: none;
  letter-spacing: 0;
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.meta-tag--removed {
  color: var(--color-down);
  border-color: color-mix(in srgb, var(--color-down) 30%, transparent);
}

.empty--center {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--color-muted);
}
</style>

