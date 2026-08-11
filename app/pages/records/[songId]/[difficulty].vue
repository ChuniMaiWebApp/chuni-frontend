<script setup lang="ts">
import type { ChartRecord, StoredScore } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const songId = computed(() => Number(route.params.songId))
const difficulty = computed(() => Number(route.params.difficulty))

const { data: record, error } = await useApiFetch<ChartRecord>(
  () => `/chunithm/records/chart/${songId.value}/${difficulty.value}`,
)

/**
 * The locally cached personal best, which covers records set before the last
 * 50 tracks. A 404 here only means the chart has never been synced, so the
 * error is deliberately ignored and the page carries on without it.
 */
const { data: stored } = await useApiFetch<StoredScore[]>(
  () => `/records/songs/${songId.value}`,
)

const best = computed(
  () =>
    stored.value?.find((score) => score.chart.difficulty === difficulty.value)
    ?? null,
)

useHead(() => ({
  title: record.value
    ? `${record.value.song.title} · ChunithmWebApp`
    : 'Record · ChunithmWebApp',
}))

/**
 * What to render the breakdown from, best source first.
 *
 * 1. A live playlog entry — always complete.
 * 2. The cached best, with a previously captured breakdown folded in when the
 *    two describe the same run. This is what survives the playlog window.
 * 3. The cached best on its own.
 */
const score = computed(() => {
  if (record.value?.play) return record.value.play

  const stored = best.value

  if (!stored) return null

  const captured = record.value?.captured

  if (!captured || captured.score !== stored.score) return stored

  return {
    ...stored,
    maxCombo: stored.maxCombo ?? captured.maxCombo,
    judgements: captured.judgements,
    notePercentage: captured.notePercentage,
    judgementLoss: captured.judgementLoss,
  }
})

/** True when the breakdown on screen came out of our own store, not SEGA. */
const fromCapture = computed(
  () =>
    !record.value?.play
    && Boolean(record.value?.captured)
    && record.value!.captured!.score === best.value?.score,
)

/** True when the run shown is not the record — the best is simply older. */
const playIsOlderRun = computed(
  () =>
    Boolean(record.value?.play)
    && Boolean(best.value)
    && record.value!.play!.score < best.value!.score,
)
</script>

<template>
  <section class="chart-record-page">
    <ApiError v-if="error" :error="error" />

    <template v-else-if="record">
      <NuxtLink :to="`/songs/${record.song.id}`" class="back-link">
        ← Back to {{ record.song.title }}
      </NuxtLink>

      <!-- MANDATORY 3-BRANCH NOTICE PRESERVED -->
      <p v-if="playIsOlderRun" class="note card">
        Showing your most recent run on this chart, not your best. Judgements
        only exist for plays still in the last 50 tracks, and your record
        (<strong>{{ formatScore(best!.score) }}</strong>) was set before that.
      </p>

      <p v-else-if="fromCapture" class="note card">
        This chart is not in your last 50 tracks, so CHUNITHM-NET no longer
        serves its judgements. The breakdown below was captured on
        <strong>{{ formatDateTime(record.captured!.capturedAt) }}</strong>, while the play was
        still in the window.
      </p>

      <p v-else-if="!record.play && best" class="note card">
        <AppIcon name="warning" /> No play on this chart in your last 50 tracks, so CHUNITHM-NET has no
        judgement breakdown to show — it publishes them for the playlog only,
        and this run was never captured while it was there. Everything below
        comes from your cached personal best.
      </p>

      <p v-else-if="!score" class="note card">
        Nothing recorded on this chart yet. Play it, or run a
        <NuxtLink to="/statistics">Sync</NuxtLink> if you have.
      </p>

      <ScoreDetail
        v-if="score"
        :score="score"
        :chart="record.chart"
        :track-no="record.play?.trackNo ?? null"
      >
        <template #panels>
          <section class="panel card">
            <h3 class="panel__title">Chart Info</h3>
            <dl class="meta">
              <div class="meta-row"><dt>Artist</dt><dd>{{ record.song.artist }}</dd></div>
              <div class="meta-row"><dt>Genre</dt><dd>{{ record.song.genre }}</dd></div>
              <div v-if="record.chart.charter" class="meta-row">
                <dt>Charter</dt><dd>{{ record.chart.charter }}</dd>
              </div>
              <div v-if="record.chart.maxCombo" class="meta-row">
                <dt>Notes</dt><dd class="tabular">{{ record.chart.maxCombo.toLocaleString('en-GB') }}</dd>
              </div>
              <div v-if="best" class="meta-row">
                <dt>Personal best</dt>
                <dd class="tabular"><strong>{{ formatScore(best.score) }}</strong></dd>
              </div>
            </dl>
          </section>
        </template>
      </ScoreDetail>

      <nav class="links card">
        <a
          v-if="record.chart.sdvxinUrl"
          :href="record.chart.sdvxinUrl"
          target="_blank"
          rel="noopener"
          class="action-link"
        ><AppIcon name="external" /> Chart view</a>
        <a :href="record.chart.youtubeUrl" target="_blank" rel="noopener" class="action-link"><AppIcon name="external" /> Video</a>
        <NuxtLink :to="`/leaderboard?songId=${record.song.id}&difficulty=${difficulty}`" class="action-link">
          <AppIcon name="trophy" /> Leaderboard
        </NuxtLink>
        <NuxtLink
          v-if="record.chart.maxCombo"
          :to="`/tools?notecount=${record.chart.maxCombo}`"
          class="action-link"
        ><AppIcon name="chart" /> Borders</NuxtLink>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.chart-record-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  font-size: 0.8125rem;
  font-weight: 650;
  color: var(--color-muted);
  text-decoration: none;
  width: fit-content;
}

.back-link:hover {
  color: var(--color-accent);
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.note {
  margin: 0;
  padding: 0.875rem 1.125rem;
  border-left: 4px solid var(--color-accent);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-muted);
}

.note strong {
  color: var(--color-text);
}

.note a {
  color: var(--color-accent);
  font-weight: 650;
}

.panel {
  padding: 1.125rem;
}

.panel__title {
  margin: 0 0 0.75rem;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
  font-weight: 750;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
}

.meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.meta dt {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
}

.meta dd {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.875rem 1.125rem;
  font-size: 0.8125rem;
  font-weight: 650;
}

.action-link {
  color: var(--color-accent);
  text-decoration: none;
}

.action-link:hover {
  text-decoration: underline;
}
</style>

