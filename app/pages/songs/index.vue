<script setup lang="ts">
import type { SongSearchResult } from '~~/shared/types/api'

useHead({ title: 'ChunithmQueue · Songs' })

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
  <section>
    <h1>Songs</h1>
    <p class="lead">
      Search by title, artist or nickname. Typos and romanisations are fine —
      <code>tentai kansoku</code> finds 天体観測.
    </p>

    <form class="search" @submit.prevent="runSearch">
      <input
        v-model="query"
        type="search"
        placeholder="Song title, artist or alias…"
        autocomplete="off"
        @input="runSearch"
      >
      <label class="toggle">
        <input v-model="availableOnly" type="checkbox" @change="runSearch">
        Hide removed songs
      </label>
    </form>

    <ApiError v-if="error" :error="error" />

    <p v-else-if="!query" class="empty">Type something to search.</p>

    <p v-else-if="status === 'pending'" class="empty">Searching…</p>

    <p v-else-if="!results?.length" class="empty">
      Nothing matched “{{ query }}”.
    </p>

    <ul v-else class="results">
      <li v-for="song in results" :key="song.id">
        <NuxtLink :to="`/songs/${song.id}`" class="result">
          <img
            v-if="song.jacketUrl"
            :src="song.jacketUrl"
            alt=""
            width="56"
            height="56"
            loading="lazy"
          >
          <div v-else class="result__placeholder" aria-hidden="true" />

          <div class="result__body">
            <h2>{{ song.title }}</h2>
            <p class="result__artist">{{ song.artist }}</p>
            <p class="result__meta">
              <span>{{ song.genre }}</span>
              <span>{{ song.version }}</span>
              <span v-if="song.matchedAlias" class="result__alias">
                matched “{{ song.matchedAlias }}”
              </span>
              <span v-if="song.removed" class="result__removed">removed</span>
            </p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.lead {
  color: var(--color-muted);
  margin-bottom: 1.25rem;
}

.search {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search input[type='search'] {
  flex: 1;
  font: inherit;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: var(--color-muted);
  white-space: nowrap;
}

.results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result {
  display: flex;
  gap: 0.875rem;
  align-items: center;
  padding: 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: inherit;
  text-decoration: none;
}

.result:hover {
  border-color: var(--color-accent);
}

.result img,
.result__placeholder {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.result__placeholder {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.result__body {
  min-width: 0;
}

.result h2 {
  font-size: 0.9375rem;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result__artist {
  margin: 0.1rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.result__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  margin: 0.25rem 0 0;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-muted);
}

.result__alias {
  text-transform: none;
  letter-spacing: 0;
  color: var(--color-accent);
}

.result__removed {
  color: var(--color-down);
}

.empty {
  color: var(--color-muted);
}
</style>
