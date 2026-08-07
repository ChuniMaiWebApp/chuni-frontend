<script setup lang="ts">
import type { RecentScore, SongDetail } from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const position = computed(() => Number(route.params.position))

const { data: play, error } = await useApiFetch<RecentScore>(
  () => `/chunithm/records/recent/${position.value}`,
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
    : 'Play · ChunithmQueue',
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
  <section>
    <NuxtLink to="/recent" class="back">← Recent plays</NuxtLink>

    <ApiError v-if="error" :error="error" />

    <template v-else-if="play">
      <p v-if="drifted" class="drift">
        This link pointed at <strong>{{ expected }}</strong>, but position
        {{ position }} in the playlog is now <strong>{{ play.song.title }}</strong>.
        CHUNITHM-NET numbers plays by position, so every new credit shifts them
        along.
      </p>

      <ScoreDetail
        :score="play"
        :chart="chart"
        :track-no="play.trackNo"
        :is-new-record="play.isNewRecord"
      >
        <template #panels>
          <section v-if="play.character || play.skill" class="panel">
            <h3>Credit</h3>
            <dl class="meta">
              <div v-if="play.character">
                <dt>Character</dt>
                <dd>{{ play.character }}</dd>
              </div>
              <div v-if="play.skill">
                <dt>Skill</dt>
                <dd>
                  {{ play.skill.name }}
                  <small v-if="play.skill.grade !== null">Lv{{ play.skill.grade }}</small>
                </dd>
              </div>
              <div v-if="play.skillResult !== null">
                <dt>Skill result</dt>
                <dd>{{ play.skillResult.toLocaleString('en-GB') }}</dd>
              </div>
            </dl>
          </section>
        </template>
      </ScoreDetail>

      <nav class="links">
        <NuxtLink v-if="play.song.id" :to="`/songs/${play.song.id}`">Song</NuxtLink>
        <NuxtLink
          v-if="play.song.id"
          :to="`/records/${play.song.id}/${play.chart.difficulty}`"
        >Your record</NuxtLink>
        <NuxtLink
          v-if="play.song.id"
          :to="`/leaderboard?songId=${play.song.id}&difficulty=${play.chart.difficulty}`"
        >Leaderboard</NuxtLink>
        <NuxtLink
          v-if="play.chart.maxCombo"
          :to="`/tools?notecount=${play.chart.maxCombo}`"
        >Borders</NuxtLink>
      </nav>

      <nav class="pager">
        <NuxtLink v-if="position > 0" :to="`/plays/${position - 1}`">← Newer</NuxtLink>
        <span v-else />
        <NuxtLink :to="`/plays/${position + 1}`">Older →</NuxtLink>
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

.drift {
  margin: 0 0 1rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius);
  border-left: 3px solid var(--color-down);
  background: var(--color-surface);
  font-size: 0.8125rem;
  color: var(--color-muted);
  max-width: 44rem;
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

.meta dt {
  font-size: 0.75rem;
  color: var(--color-muted);
}

.meta dd {
  margin: 0.1rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.35;
}

.meta dd small {
  margin-left: 0.35rem;
  color: var(--color-muted);
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

.pager {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  font-size: 0.875rem;
}

.pager a {
  color: var(--color-muted);
  text-decoration: none;
}
</style>
