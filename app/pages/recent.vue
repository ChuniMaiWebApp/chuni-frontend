<script setup lang="ts">
import type { CaptureResult, RecentScore } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · Recent' })

const { data: scores, error, pending, refresh } = await useApiFetch<RecentScore[]>(
  '/chunithm/records/recent',
)

/**
 * Judgements live on their own page rather than expanding in place.
 *
 * Each one costs a second CHUNITHM-NET request, and the breakdown is far too
 * wide to sit inside a list row. The song title rides along so the page can
 * tell when a saved link has drifted: CHUNITHM-NET numbers plays by position,
 * and every new credit shifts them.
 */
const detailLink = (index: number, score: RecentScore) =>
  `/plays/${index}?song=${encodeURIComponent(score.song.title)}`

/**
 * Stores the judgement breakdown of every play still in the window.
 *
 * CHUNITHM-NET serves judgements for the last 50 tracks and nothing else, so a
 * personal best loses its breakdown once fifty more credits push it out.
 * Capturing now is the only way it survives.
 */
const api = useApi()
const capturing = ref(false)
const captured = ref<CaptureResult | null>(null)
const captureError = ref<string | null>(null)

const capture = async () => {
  capturing.value = true
  captureError.value = null

  try {
    captured.value = await api<CaptureResult>('/chunithm/records/capture', {
      method: 'POST',
    })
  }
  catch (error) {
    captureError.value = readApiError(error)
  }
  finally {
    capturing.value = false
  }
}
</script>

<template>
  <section>
    <header class="page-header">
      <h1>Recent plays</h1>
      <div class="page-header__actions">
        <button type="button" :disabled="capturing" @click="capture()">
          {{ capturing ? 'Capturing…' : 'Capture judgements' }}
        </button>
        <button type="button" :disabled="pending" @click="refresh()">
          {{ pending ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
    </header>

    <p class="lead">
      CHUNITHM-NET only serves judgements for these 50 tracks. Capturing them
      keeps the breakdown on your
      <NuxtLink to="/best50">Best 50</NuxtLink> after the playlog has moved on.
    </p>

    <p v-if="captureError" class="capture capture--error">{{ captureError }}</p>

    <p v-else-if="captured" class="capture">
      Scanned {{ captured.scanned }} plays:
      {{ captured.stored }} newly stored,
      {{ captured.alreadyKnown }} already known.
    </p>

    <ApiError v-if="error" :error="error" />

    <p v-else-if="!scores?.length" class="empty">
      No plays recorded yet.
    </p>

    <ul v-else class="list">
      <li v-for="(score, index) in scores" :key="index">
        <ScoreCard :score="score" />

        <NuxtLink :to="detailLink(index, score)" class="detail-button">
          Judgements and note accuracy →
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.page-header h1 {
  margin: 0;
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

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.detail-button {
  display: inline-block;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-muted);
  text-decoration: none;
}

.detail-button:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.page-header__actions {
  display: flex;
  gap: 0.5rem;
}

.lead {
  margin: -0.75rem 0 1rem;
  max-width: 44rem;
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.lead a {
  color: var(--color-accent);
}

.capture {
  margin: 0 0 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  border-left: 3px solid var(--color-accent);
  background: var(--color-surface);
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.capture--error {
  border-left-color: var(--color-down);
  color: var(--color-down);
}

.empty {
  color: var(--color-muted);
}
</style>
