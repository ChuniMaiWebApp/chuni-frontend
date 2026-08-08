<script setup lang="ts">
import type { RecentScore, SongDetail } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const position = computed(() => Number(route.params.position))

/*
 * Not awaited. This page costs two CHUNITHM-NET round trips, and awaiting them
 * in setup held the previous page on screen for the whole wait with no sign
 * anything was happening. Letting it render immediately means the tap lands on
 * a page shaped like the answer.
 */
const { data: play, error, status } = await useApiFetch<RecentScore>(
  () => `/chunithm/records/recent/${position.value}`,
  { lazy: true },
)

/**
 * The chart from the song database, for its note breakdown.
 *
 * Without it a chart with no flicks is indistinguishable from one where every
 * flick was missed — both report 0.00% — and the row would be shown either
 * way. It also lets each note type carry how many of them there are.
 */
const { data: song } = await useApiFetch<SongDetail>(
  () => `/songs/${play.value?.song.id}`,
  // The play is already resolved by the await above; a play on a chart missing
  // from the song database has no id to look up.
  { immediate: play.value?.song.id !== null },
)

const chart = computed(
  () =>
    song.value?.charts.find(
      (entry) => entry.difficulty === play.value?.chart.difficulty,
    ) ?? null,
)

useHead(() => ({
  title: play.value
    ? `${play.value.song.title} · ChunithmQueue`
    : 'Play Detail · ChunithmQueue',
}))

/**
 * CHUNITHM-NET identifies playlog entries by position, so a link saved before
 * another credit was played now points at a different track. The song that was
 * expected rides along in the query string purely so the page can notice.
 */
const expected = computed(() => route.query.song as string | undefined)
const drifted = computed(
  () =>
    Boolean(expected.value) &&
    Boolean(play.value) &&
    play.value!.song.title !== expected.value,
)
</script>

<template>
  <section class="play-detail-page">
    <NuxtLink to="/recent" class="back-link">← Back to Recent Plays</NuxtLink>

    <ApiError v-if="error" :error="error" />

    <AppSpinner
      v-else-if="status === 'pending' && !play"
      label="Fetching judgements from CHUNITHM-NET…"
    />

    <template v-else-if="play">
      <!-- MANDATORY DRIFT WARNING PRESERVED -->
      <p v-if="drifted" class="drift card">
        This link pointed at <strong>{{ expected }}</strong>, but position
        {{ position }} in the playlog is now <strong>{{ play.song.title }}</strong>.
        CHUNITHM-NET numbers plays by position, so every new credit shifts them along.
      </p>

      <ScoreDetail
        :score="play"
        :chart="chart"
        :track-no="play.trackNo"
        :is-new-record="play.isNewRecord"
      >
        <template #panels>
          <section v-if="play.character || play.skill" class="panel card">
            <h3 class="panel__title">Credit Info</h3>
            <dl class="meta">
              <div v-if="play.character" class="meta-row">
                <dt>Character</dt>
                <dd>{{ play.character }}</dd>
              </div>
              <div v-if="play.skill" class="meta-row">
                <dt>Skill</dt>
                <dd>
                  {{ play.skill.name }}
                  <small v-if="play.skill.grade !== null">Lv{{ play.skill.grade }}</small>
                </dd>
              </div>
              <div v-if="play.skillResult !== null" class="meta-row">
                <dt>Skill Result</dt>
                <dd class="tabular">{{ play.skillResult.toLocaleString('en-GB') }}</dd>
              </div>
            </dl>
          </section>
        </template>
      </ScoreDetail>

      <nav class="links card">
        <NuxtLink v-if="play.song.id" :to="`/songs/${play.song.id}`" class="action-link"><AppIcon name="music" /> Song</NuxtLink>
        <NuxtLink
          v-if="play.song.id"
          :to="`/records/${play.song.id}/${play.chart.difficulty}`"
          class="action-link"
        ><AppIcon name="user" /> Your record</NuxtLink>
        <NuxtLink
          v-if="play.song.id"
          :to="`/leaderboard?songId=${play.song.id}&difficulty=${play.chart.difficulty}`"
          class="action-link"
        ><AppIcon name="trophy" /> Leaderboard</NuxtLink>
        <NuxtLink
          v-if="play.chart.maxCombo"
          :to="`/tools?notecount=${play.chart.maxCombo}`"
          class="action-link"
        ><AppIcon name="chart" /> Borders</NuxtLink>
      </nav>

      <nav class="pager">
        <NuxtLink v-if="position > 0" :to="`/plays/${position - 1}`" class="btn btn--secondary">
          ← Newer Play
        </NuxtLink>
        <span v-else />
        <NuxtLink :to="`/plays/${position + 1}`" class="btn btn--secondary">
          Older Play →
        </NuxtLink>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.play-detail-page {
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

.drift {
  margin: 0;
  padding: 0.875rem 1.125rem;
  border-left: 4px solid var(--color-down);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-muted);
}

.drift strong {
  color: var(--color-text);
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

.meta dd small {
  margin-left: 0.35rem;
  color: var(--color-muted);
  font-weight: 600;
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

.pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 650;
  text-decoration: none;
}

.btn--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
</style>

