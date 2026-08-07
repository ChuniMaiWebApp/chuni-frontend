<script setup lang="ts">
import type { SongDetail } from '~~/shared/types/api'

const route = useRoute()

const { data: song, error } = await useApiFetch<SongDetail>(
  () => `/songs/${route.params.id}`,
)

useHead(() => ({ title: song.value ? `${song.value.title} · ChunithmQueue` : 'Song' }))

const bpmLabel = computed(() => {
  const bpm = song.value?.bpm

  if (!bpm?.primary) return null
  if (bpm.min !== null && bpm.max !== null && bpm.min !== bpm.max) {
    return `${bpm.primary} (${bpm.min}–${bpm.max})`
  }

  return String(bpm.primary)
})

const durationLabel = computed(() => {
  const seconds = song.value?.durationSeconds

  if (!seconds) return null

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})

const totalNotes = (chart: SongDetail['charts'][number]) =>
  chart.maxCombo ?? null

/** "3 hours ago" / "2 days ago", for dating the availability claim. */
const freshness = (ageHours: number | null): string => {
  if (ageHours === null) return 'of unknown age'
  if (ageHours < 1) return 'updated just now'
  if (ageHours < 24) return `updated ${ageHours}h ago`

  const days = Math.round(ageHours / 24)

  return `updated ${days} day${days === 1 ? '' : 's'} ago`
}

/**
 * The availability notice.
 *
 * Every branch is a lookup in a dataset that tracks Japan and International
 * separately, so each one can say what it knows and when that was last
 * checked. A song that is simply playable gets no notice; the only reason to
 * interrupt someone is when a chart they are looking at is not on their
 * cabinet.
 */
const availability = computed(() => {
  const info = song.value?.availability

  if (!info) return null

  const dated = info.source ? ` Song list ${freshness(info.source.ageHours)}.` : ''

  if (info.status === 'removed') {
    return {
      tone: 'warning' as const,
      text: 'This song has been removed from the game.',
      detail: null,
    }
  }

  if (info.status === 'japanOnly') {
    return {
      tone: 'warning' as const,
      text: 'Not playable on CHUNITHM International.',
      detail: `It is in the Japanese version only. International usually gets `
        + `songs some months after Japan, so this may change.${dated}`,
    }
  }

  if (info.status === 'absent') {
    return {
      tone: 'warning' as const,
      text: 'Not playable in either version right now.',
      detail: `Neither the Japanese nor the International song list has it.${dated}`,
    }
  }

  if (info.status === 'unknown') {
    return {
      tone: 'note' as const,
      text: 'Availability unknown.',
      detail: `The regional song list has no entry for this song, so we cannot `
        + `say either way.${dated}`,
    }
  }

  // Playable, but International shipped it without some of its charts. Worth
  // saying on the page that lists those charts.
  if (info.chartsMissingHere.length > 0) {
    return {
      tone: 'note' as const,
      text: `Playable, but ${info.chartsMissingHere.join(' and ')} `
        + `${info.chartsMissingHere.length === 1 ? 'is' : 'are'} Japan-only.`,
      detail: `The rest of the charts are on International.${dated}`,
    }
  }

  return null
})
</script>

<template>
  <section>
    <ApiError v-if="error" :error="error" />

    <template v-else-if="song">
      <NuxtLink to="/songs" class="back">← Songs</NuxtLink>

      <header class="hero">
        <img
          v-if="song.jacketUrl"
          :src="song.jacketUrl"
          :alt="song.title"
          width="140"
          height="140"
        >

        <div class="hero__body">
          <h1>{{ song.title }}</h1>
          <p class="hero__artist">{{ song.artist }}</p>

          <dl class="facts">
            <div><dt>Genre</dt><dd>{{ song.genre }}</dd></div>
            <div><dt>Version</dt><dd>{{ song.version }}</dd></div>
            <div v-if="song.releaseDate">
              <dt>Released</dt><dd>{{ song.releaseDate }}</dd>
            </div>
            <div v-if="bpmLabel"><dt>BPM</dt><dd>{{ bpmLabel }}</dd></div>
            <div v-if="durationLabel">
              <dt>Length</dt><dd>{{ durationLabel }}</dd>
            </div>
          </dl>

          <p v-if="availability" class="notice" :class="`notice--${availability.tone}`">
            {{ availability.text }}
            <span v-if="availability.detail">{{ availability.detail }}</span>
          </p>

          <p v-if="song.aliases.length" class="aliases">
            Also known as:
            <span v-for="alias in song.aliases" :key="alias">{{ alias }}</span>
          </p>
        </div>
      </header>

      <h2 class="section-title">Charts</h2>

      <ul class="charts">
        <li
          v-for="chart in song.charts"
          :key="chart.difficultyName"
          class="chart"
          :style="{ '--difficulty': difficultyColour(chart.difficulty) }"
        >
          <div class="chart__head">
            <span class="chart__difficulty">
              {{ chart.difficultyName }}
              <!-- Only flagged when Japan has it and we do not; a chart absent
                   from both is not a regional difference. -->
              <span
                v-if="chart.availableIntl === false && chart.availableJp"
                class="chart__region"
                title="In the Japanese version only"
              >JP only</span>
            </span>
            <span class="chart__level">
              {{ chart.level }}
              <small v-if="chart.const !== null">({{ chart.const }})</small>
            </span>
          </div>

          <dl class="chart__notes">
            <div v-if="totalNotes(chart)">
              <dt>Notes</dt><dd>{{ totalNotes(chart) }}</dd>
            </div>
            <div v-if="chart.notes.tap"><dt>Tap</dt><dd>{{ chart.notes.tap }}</dd></div>
            <div v-if="chart.notes.hold"><dt>Hold</dt><dd>{{ chart.notes.hold }}</dd></div>
            <div v-if="chart.notes.slide"><dt>Slide</dt><dd>{{ chart.notes.slide }}</dd></div>
            <div v-if="chart.notes.air"><dt>Air</dt><dd>{{ chart.notes.air }}</dd></div>
            <div v-if="chart.notes.flick"><dt>Flick</dt><dd>{{ chart.notes.flick }}</dd></div>
          </dl>

          <p v-if="chart.charter" class="chart__charter">
            Charted by {{ chart.charter }}
          </p>

          <div class="chart__links">
            <a
              v-if="chart.sdvxinUrl"
              :href="chart.sdvxinUrl"
              target="_blank"
              rel="noopener"
            >Chart view</a>
            <a :href="chart.youtubeUrl" target="_blank" rel="noopener">Video</a>
            <NuxtLink
              :to="`/leaderboard?songId=${song.id}&difficulty=${chart.difficulty}`"
            >Leaderboard</NuxtLink>
            <NuxtLink
              v-if="totalNotes(chart)"
              :to="`/tools?notecount=${totalNotes(chart)}`"
            >Borders</NuxtLink>
          </div>
        </li>
      </ul>
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

.hero {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.hero img {
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.hero h1 {
  margin: 0;
  font-size: 1.5rem;
}

.hero__artist {
  margin: 0.25rem 0 1rem;
  color: var(--color-muted);
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin: 0;
}

.facts dt {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.facts dd {
  margin: 0.1rem 0 0;
  font-variant-numeric: tabular-nums;
}

.notice {
  margin: 1rem 0 0;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius);
  border-left: 3px solid currentColor;
  background: var(--color-surface);
  font-size: 0.8125rem;
  max-width: 44rem;
}

.notice--warning {
  color: var(--color-down);
}

.notice--note {
  color: var(--color-muted);
}

/* The claim carries the colour; the evidence behind it is set quieter. */
.notice span {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-muted);
}

.aliases {
  margin: 1rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.aliases span::after {
  content: ', ';
}

.aliases span:last-child::after {
  content: '';
}

.section-title {
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.charts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.75rem;
}

.chart {
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--difficulty);
  border-radius: var(--radius);
  background: var(--color-surface);
  padding: 0.875rem 1rem;
}

.chart__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.chart__difficulty {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 650;
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
  color: var(--difficulty);
}

.chart__region {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.05rem 0.4rem;
  font-size: 0.5625rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: var(--color-muted);
}

.chart__level {
  font-size: 1.125rem;
  font-variant-numeric: tabular-nums;
}

.chart__level small {
  font-size: 0.75rem;
  color: var(--color-muted);
}

.chart__notes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0.75rem 0 0;
}

.chart__notes dt {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.chart__notes dd {
  margin: 0;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.chart__charter {
  margin: 0.625rem 0 0;
  font-size: 0.75rem;
  color: var(--color-muted);
}

.chart__links {
  display: flex;
  gap: 0.875rem;
  margin-top: 0.75rem;
  font-size: 0.8125rem;
}

.chart__links a {
  color: var(--color-accent);
  text-decoration: none;
}
</style>
