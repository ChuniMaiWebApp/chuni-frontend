<script setup lang="ts">
import type { SongDetail } from '~~/shared/types/api'

const route = useRoute()

const { data: song, error } = await useApiFetch<SongDetail>(
  () => `/songs/${route.params.id}`,
)

useHead(() => ({ title: song.value ? `${song.value.title} · ChunithmQueue` : 'Song Detail' }))

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
  <section class="song-detail-page">
    <ApiError v-if="error" :error="error" />

    <template v-else-if="song">
      <NuxtLink to="/songs" class="back-link">← Back to Songs</NuxtLink>

      <header class="hero card">
        <img
          v-if="song.jacketUrl"
          :src="song.jacketUrl"
          :alt="song.title"
          width="140"
          height="140"
          class="hero__jacket"
        >
        <div v-else class="hero__jacket-placeholder" />

        <div class="hero__body">
          <h1 class="hero__title">{{ song.title }}</h1>
          <p class="hero__artist">{{ song.artist }}</p>

          <dl class="facts-grid">
            <div class="fact-item"><dt>Genre</dt><dd>{{ song.genre }}</dd></div>
            <div class="fact-item"><dt>Version</dt><dd>{{ song.version }}</dd></div>
            <div v-if="song.releaseDate" class="fact-item">
              <dt>Released</dt><dd>{{ song.releaseDate }}</dd>
            </div>
            <div v-if="bpmLabel" class="fact-item"><dt>BPM</dt><dd class="tabular">{{ bpmLabel }}</dd></div>
            <div v-if="durationLabel" class="fact-item">
              <dt>Length</dt><dd class="tabular">{{ durationLabel }}</dd>
            </div>
          </dl>

          <!-- MANDATORY NOTICE PRESERVED -->
          <p v-if="availability" class="notice" :class="`notice--${availability.tone}`">
            <strong>{{ availability.text }}</strong>
            <span v-if="availability.detail">{{ availability.detail }}</span>
          </p>

          <p v-if="song.aliases.length" class="aliases">
            Aliases:
            <span v-for="alias in song.aliases" :key="alias" class="alias-tag">{{ alias }}</span>
          </p>
        </div>
      </header>

      <h2 class="section-title">Charts &amp; Boundaries</h2>

      <ul class="charts-grid">
        <li
          v-for="chart in song.charts"
          :key="chart.difficultyName"
          class="chart-card card"
          :style="{ '--difficulty': difficultyInk(chart.difficulty) }"
        >
          <div class="chart__head">
            <span class="chart__difficulty">
              <DifficultyLabel
                :difficulty="chart.difficulty"
                :level="chart.const ?? chart.level"
              />
              <span
                v-if="chart.availableIntl === false && chart.availableJp"
                class="chart__region"
                title="In the Japanese version only"
              >JP ONLY</span>
            </span>
            <span class="chart__level tabular">{{ chart.level }}</span>
          </div>

          <dl class="chart__notes">
            <div v-if="totalNotes(chart)" class="note-fact">
              <dt>Total</dt><dd class="tabular">{{ totalNotes(chart) }}</dd>
            </div>
            <div v-if="chart.notes.tap" class="note-fact"><dt>Tap</dt><dd class="tabular">{{ chart.notes.tap }}</dd></div>
            <div v-if="chart.notes.hold" class="note-fact"><dt>Hold</dt><dd class="tabular">{{ chart.notes.hold }}</dd></div>
            <div v-if="chart.notes.slide" class="note-fact"><dt>Slide</dt><dd class="tabular">{{ chart.notes.slide }}</dd></div>
            <div v-if="chart.notes.air" class="note-fact"><dt>Air</dt><dd class="tabular">{{ chart.notes.air }}</dd></div>
            <div v-if="chart.notes.flick" class="note-fact"><dt>Flick</dt><dd class="tabular">{{ chart.notes.flick }}</dd></div>
          </dl>

          <p v-if="chart.charter" class="chart__charter">
            Charted by <strong>{{ chart.charter }}</strong>
          </p>

          <div class="chart__links">
            <a
              v-if="chart.sdvxinUrl"
              :href="chart.sdvxinUrl"
              target="_blank"
              rel="noopener"
              class="chart-link"
            ><AppIcon name="external" /> Chart view</a>
            <a :href="chart.youtubeUrl" target="_blank" rel="noopener" class="chart-link"><AppIcon name="external" /> Video</a>
            <NuxtLink
              :to="`/leaderboard?songId=${song.id}&difficulty=${chart.difficulty}`"
              class="chart-link"
            ><AppIcon name="trophy" /> Leaderboard</NuxtLink>
            <NuxtLink
              v-if="totalNotes(chart)"
              :to="`/tools?notecount=${totalNotes(chart)}`"
              class="chart-link"
            ><AppIcon name="chart" /> Borders</NuxtLink>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.song-detail-page {
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

.hero {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
}

.hero__jacket,
.hero__jacket-placeholder {
  width: 140px;
  height: 140px;
  border-radius: var(--radius);
  object-fit: cover;
  flex-shrink: 0;
}

.hero__jacket-placeholder {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.hero__body {
  flex: 1;
  min-width: 0;
}

.hero__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
}

.hero__artist {
  margin: 0.25rem 0 1rem;
  color: var(--color-muted);
  font-size: 0.9375rem;
  font-weight: 600;
}

.facts-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin: 0;
}

.fact-item dt {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.fact-item dd {
  margin: 0.15rem 0 0;
  font-size: 0.9375rem;
  font-weight: 700;
}

.notice {
  margin: 1rem 0 0;
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  border-left: 4px solid currentColor;
  background: var(--color-bg);
  font-size: 0.8125rem;
  max-width: 44rem;
}

.notice--warning {
  color: var(--color-down);
  border-color: var(--color-down);
}

.notice--note {
  color: var(--color-muted);
  border-color: var(--color-accent);
}

.notice span {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-muted);
}

.aliases {
  margin: 1rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-muted);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.alias-tag {
  background: var(--color-bg);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0.5rem 0 0;
}

.charts-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
  gap: 0.875rem;
}

.chart-card {
  border-left: 4px solid var(--difficulty);
  padding: 1.125rem;
}

.chart__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.chart__difficulty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 800;
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  color: var(--difficulty);
}

.chart__region {
  border: 1px solid var(--color-down);
  border-radius: 999px;
  padding: 0.05rem 0.45rem;
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--color-down);
  background: color-mix(in srgb, var(--color-down) 10%, transparent);
}

.chart__level {
  font-size: 1.25rem;
  font-weight: 800;
}

.chart__level small {
  font-size: 0.8125rem;
  color: var(--color-muted);
  font-weight: 600;
}

.chart__notes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.875rem;
  margin: 0.875rem 0 0;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.note-fact dt {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.note-fact dd {
  margin: 0.1rem 0 0;
  font-size: 0.9375rem;
  font-weight: 700;
}

.chart__charter {
  margin: 0.75rem 0 0;
  font-size: 0.78125rem;
  color: var(--color-muted);
}

.chart__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.875rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.8125rem;
  font-weight: 650;
}

.chart-link {
  color: var(--color-accent);
  text-decoration: none;
}

.chart-link:hover {
  text-decoration: underline;
}

@media (max-width: 40rem) {
  .hero {
    flex-direction: column;
  }
}
</style>

