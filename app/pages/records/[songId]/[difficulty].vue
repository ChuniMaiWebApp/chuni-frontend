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
    ? `${record.value.song.title} · ChunithmQueue`
    : 'Record · ChunithmQueue',
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
  <section>
    <ApiError v-if="error" :error="error" />

    <template v-else-if="record">
      <NuxtLink :to="`/songs/${record.song.id}`" class="back">
        ← {{ record.song.title }}
      </NuxtLink>

      <p v-if="playIsOlderRun" class="note">
        Showing your most recent run on this chart, not your best. Judgements
        only exist for plays still in the last 50 tracks, and your record
        ({{ formatScore(best!.score) }}) was set before that.
      </p>

      <p v-else-if="fromCapture" class="note">
        This chart is not in your last 50 tracks, so CHUNITHM-NET no longer
        serves its judgements. The breakdown below was captured on
        {{ formatDateTime(record.captured!.capturedAt) }}, while the play was
        still in the window.
      </p>

      <p v-else-if="!record.play && best" class="note">
        No play on this chart in your last 50 tracks, so CHUNITHM-NET has no
        judgement breakdown to show — it publishes them for the playlog only,
        and this run was never captured while it was there. Everything below
        comes from your cached personal best.
      </p>

      <p v-else-if="!score" class="note">
        Nothing recorded on this chart yet. Play it, or run a
        <NuxtLink to="/statistics">sync</NuxtLink> if you have.
      </p>

      <ScoreDetail
        v-if="score"
        :score="score"
        :chart="record.chart"
        :track-no="record.play?.trackNo ?? null"
      >
        <template #panels>
          <section class="panel">
            <h3>Chart</h3>
            <dl class="meta">
              <div><dt>Artist</dt><dd>{{ record.song.artist }}</dd></div>
              <div><dt>Genre</dt><dd>{{ record.song.genre }}</dd></div>
              <div v-if="record.chart.charter">
                <dt>Charter</dt><dd>{{ record.chart.charter }}</dd>
              </div>
              <!-- Worth stating outright: without a playlog entry the score
                   line has no combo to hang the notecount off. -->
              <div v-if="record.chart.maxCombo">
                <dt>Notes</dt><dd>{{ record.chart.maxCombo.toLocaleString('en-GB') }}</dd>
              </div>
              <div v-if="best">
                <dt>Personal best</dt>
                <dd>{{ formatScore(best.score) }}</dd>
              </div>
            </dl>
          </section>
        </template>
      </ScoreDetail>

      <nav class="links">
        <a
          v-if="record.chart.sdvxinUrl"
          :href="record.chart.sdvxinUrl"
          target="_blank"
          rel="noopener"
        >Chart view</a>
        <a :href="record.chart.youtubeUrl" target="_blank" rel="noopener">Video</a>
        <NuxtLink :to="`/leaderboard?songId=${record.song.id}&difficulty=${difficulty}`">
          Leaderboard
        </NuxtLink>
        <NuxtLink
          v-if="record.chart.maxCombo"
          :to="`/tools?notecount=${record.chart.maxCombo}`"
        >Borders</NuxtLink>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--color-muted);
  text-decoration: none;
}

.note {
  margin: 0 0 1rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius);
  border-left: 3px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.8125rem;
  color: var(--color-muted);
  max-width: 44rem;
}

.note a {
  color: var(--color-accent);
}

.panel {
  background: var(--color-surface);
  padding: 1rem 1.25rem;
}

.panel h3 {
  margin: 0 0 0.75rem;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
  font-weight: 600;
}

.meta {
  display: grid;
  gap: 0.5rem;
  margin: 0;
}

.meta > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.meta dt {
  font-size: 0.75rem;
  color: var(--color-muted);
  flex-shrink: 0;
}

.meta dd {
  margin: 0;
  font-size: 0.8125rem;
  text-align: right;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.links a {
  color: var(--color-accent);
  text-decoration: none;
}
</style>
