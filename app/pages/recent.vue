<script setup lang="ts">
import type { CaptureResult, RecentScore } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · Recent Plays' })

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
const toast = useToast()
const { confirm } = useConfirm()

const api = useApi()
const capturing = ref(false)
const captured = ref<CaptureResult | null>(null)
const captureError = ref<string | null>(null)

const capture = async () => {
  const confirmed = await confirm({
    title: 'Capture recent scores',
    message: 'This saves the judgement breakdown (Justice/Attack/Miss) for your last 50 plays. Continue?',
    confirmText: 'Capture now',
    cancelText: 'Cancel',
  })

  if (!confirmed) return

  capturing.value = true
  captureError.value = null

  try {
    captured.value = await api<CaptureResult>('/chunithm/records/capture', {
      method: 'POST',
    })
    toast.success('Capture thành công!', 'Đã ghi nhận chi tiết các lượt chơi gần đây.')
  }
  catch (error) {
    const errText = readApiError(error)
    captureError.value = errText
    toast.error('Capture thất bại', errText || 'Không thể lưu chi tiết lượt chơi.')
  }
  finally {
    capturing.value = false
  }
}
</script>

<template>
  <section class="recent-page">
    <header class="page-header">
      <div>
        <h1>Recent Plays</h1>
        <p class="lead">
          CHUNITHM-NET only serves judgements for these 50 tracks. Capturing them
          keeps the breakdown on your
          <NuxtLink to="/best50">Best 50</NuxtLink> after the playlog has moved on.
        </p>
      </div>

      <div class="page-header__actions">
        <button type="button" class="btn btn--primary" :disabled="capturing" @click="capture()">
          <AppIcon name="download" />
          {{ capturing ? 'Capturing…' : 'Capture judgements' }}
        </button>
        <button type="button" class="btn btn--secondary" :disabled="pending" @click="refresh()">
          <AppIcon name="refresh" />
          {{ pending ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
    </header>

    <div v-if="captureError" class="capture capture--error">
      <AppIcon name="warning" /> {{ captureError }}
    </div>

    <div v-else-if="captured" class="capture">
      Scanned <strong>{{ captured.scanned }}</strong> plays:
      <strong>{{ captured.stored }}</strong> newly stored,
      <strong>{{ captured.alreadyKnown }}</strong> already known.
    </div>

    <ApiError v-if="error" :error="error" />

    <AppSpinner
      v-else-if="pending && !scores"
      label="Reading your playlog from CHUNITHM-NET…"
    />

    <p v-else-if="!scores?.length" class="empty">
      No recent plays recorded yet. Play a credit at the arcade and refresh!
    </p>

    <ul v-else class="list">
      <li v-for="(score, index) in scores" :key="index">
        <NuxtLink
          :to="detailLink(index, score)"
          class="list__link"
          :title="`Judgements and note accuracy for ${score.song.title}`"
        >
          <ScoreCard :score="score" />
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.recent-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.25rem;
}

.page-header__actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.lead {
  margin: 0;
  max-width: 38rem;
  font-size: 0.8125rem;
  color: var(--color-muted);
  line-height: 1.4;
}

.lead a {
  color: var(--color-accent);
  font-weight: 600;
}

.capture {
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  border-left: 4px solid var(--color-accent);
  background: var(--color-surface);
  font-size: 0.8125rem;
  color: var(--color-text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.capture--error {
  border-left-color: var(--color-down);
  color: var(--color-down);
}

/* The whole card is the link; the hover outline is the only affordance it
   needs, and it costs no height. */
.list__link {
  display: block;
  color: inherit;
  text-decoration: none;
  border-radius: 6px;
}

.list__link:hover {
  outline: 1px solid var(--color-accent);
  outline-offset: 1px;
}

.list__link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
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
  border: none;
}

.btn--primary {
  background: var(--color-accent);
  color: #ffffff;
}

.btn--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.empty {
  color: var(--color-muted);
  font-size: 0.875rem;
  padding: 2rem 0;
  text-align: center;
}

@media (max-width: 48rem) {
  .page-header {
    flex-direction: column;
  }
}
</style>

