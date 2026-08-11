<script setup lang="ts">
import type { SongDetail, StoredScore } from '~~/shared/types/api'

const route = useRoute()
const { isSignedIn } = useAuth()
const api = useApi()

const { data: song, error } = await useApiFetch<SongDetail>(
  () => `/songs/${route.params.id}`,
)

const userScores = ref<StoredScore[]>([])
const userScoresLoading = ref(false)

const loadUserScores = async () => {
  if (!isSignedIn.value || !song.value) return
  userScoresLoading.value = true
  try {
    const res = await api<StoredScore[]>(`/records/songs/${song.value.id}`)
    userScores.value = res ?? []
  }
  catch {
    userScores.value = []
  }
  finally {
    userScoresLoading.value = false
  }
}

onMounted(() => {
  loadUserScores()
})

// Was a hand-rolled ladder of raw numbers, and the numbers did not match the
// enum: ClearLamp is FAILED 0, CLEAR 1, HARD 4, BRAVE 5, ABSOLUTE 6,
// CATASTROPHY 7, so `clearLamp === 1` was labelling every ordinary clear
// "HARD", 2 and 3 could never match anything, and a real HARD clear came out
// as "CATS". scoreLamps() classifies on the enum and is what every other
// surface already uses.
const lampsFor = (record: StoredScore) => scoreLamps(record)

const overpowerFormatted = (record: StoredScore): string | null => {
  if (record.overpower === null) return null
  if (!record.maxOverpower) return record.overpower.toFixed(3)
  const pct = ((record.overpower / record.maxOverpower) * 100).toFixed(2)
  return `${record.overpower.toFixed(3)} (${pct}%)`
}

useHead(() => ({ title: song.value ? `${song.value.title} · ChunithmWebApp` : 'Song Detail' }))

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
              :to="`/tools?notecount=${totalNotes(chart)}&const=${chart.const ?? chart.level}&score=1009000`"
              class="chart-link"
            ><AppIcon name="chart" /> Borders</NuxtLink>
          </div>
        </li>
      </ul>

      <!-- User Play Records Section -->
      <section v-if="isSignedIn" class="user-scores-container">
        <h2 class="user-scores-title">Your Play Records</h2>

        <!-- Loading State -->
        <div v-if="userScoresLoading" class="card empty-scores-card">
          <p class="empty-scores-sub">Loading score history…</p>
        </div>

        <!-- Empty State: No plays on ANY difficulty -->
        <div v-else-if="userScores.length === 0" class="card empty-scores-card">
          <div class="empty-scores-content">
            <AppIcon name="history" :size="22" class="empty-scores-icon" />
            <div>
              <h3 class="empty-scores-heading">Chưa có score cho bài hát này</h3>
              <p class="empty-scores-sub">Bạn chưa chơi hoặc chưa đồng bộ điểm số bài hát này từ CHUNITHM-NET.</p>
            </div>
          </div>
        </div>

        <!-- Played State: List of score cards for each played difficulty -->
        <div v-else class="user-scores-list">
          <article
            v-for="record in userScores"
            :key="record.chart.difficulty"
            class="card user-score-card"
            :style="{ '--diff-color': difficultyInk(record.chart.difficulty) }"
          >
            <div class="user-score-card__border-strip" />

            <div class="user-score-card__content">
              <!-- Top Row: Title + Chart Badge & Jacket -->
              <div class="user-score-card__header">
                <h3 class="user-score-card__title">
                  {{ record.song.title }}
                  <span class="user-score-card__chart-badge" :style="{ color: difficultyInk(record.chart.difficulty) }">
                    [{{ record.chart.difficultyName }} {{ record.chart.const ?? record.chart.level }}]
                  </span>
                </h3>
                <img
                  v-if="record.song.jacketUrl"
                  :src="record.song.jacketUrl"
                  :alt="record.song.title"
                  class="user-score-card__jacket"
                  width="48"
                  height="48"
                  loading="lazy"
                >
              </div>

              <!-- Middle Row: Rank + Lamp + Score -->
              <div class="user-score-card__main">
                <span class="score-arrow">▶</span>
                <RankBadge :rank="record.rank" size="md" />
                <span class="score-arrow">▶</span>
                <LampBadge
                  v-for="lamp in lampsFor(record)"
                  :key="lamp.label"
                  :lamp="lamp"
                  size="sm"
                />
                <span class="score-arrow">▶</span>
                <span class="user-score-card__score tabular">{{ record.score.toLocaleString('en-US') }}</span>
              </div>

              <!-- Footer Row: Rating · OP · Attempts · Achieved Date -->
              <div class="user-score-card__footer tabular">
                <span v-if="record.rating !== null" class="meta-part">
                  Rating: <strong>{{ record.rating.toFixed(2) }}</strong>
                </span>
                <span v-if="overpowerFormatted(record)" class="meta-part">
                  OP: <strong>{{ overpowerFormatted(record) }}</strong>
                </span>
                <span class="meta-part">
                  <strong>{{ record.playCount ?? 1 }}</strong> {{ (record.playCount ?? 1) === 1 ? 'attempt' : 'attempts' }}
                </span>
                <span v-if="record.achievedAt" class="meta-part meta-part--date">
                  {{ formatDateTime(record.achievedAt) }}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
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

/* User Scores Section (Image 2 style) */
.user-scores-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.user-scores-title {
  font-size: 1.1875rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.empty-scores-card {
  padding: 1.25rem 1.5rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.empty-scores-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.empty-scores-icon {
  color: var(--color-muted);
  flex-shrink: 0;
}

.empty-scores-heading {
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--color-text);
  margin: 0 0 0.2rem;
}

.empty-scores-sub {
  font-size: 0.8125rem;
  color: var(--color-muted);
  margin: 0;
}

.user-scores-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.user-score-card {
  position: relative;
  display: flex;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.user-score-card:hover {
  transform: translateY(-2px);
  border-color: var(--diff-color);
}

.user-score-card__border-strip {
  width: 5px;
  background: var(--diff-color);
  flex-shrink: 0;
}

.user-score-card__content {
  flex: 1;
  padding: 0.875rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.user-score-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.user-score-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
}

.user-score-card__chart-badge {
  font-size: 0.875rem;
  font-weight: 750;
  margin-left: 0.25rem;
}

.user-score-card__jacket {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.user-score-card__main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
}

.score-arrow {
  color: var(--color-muted);
  font-size: 0.7rem;
  opacity: 0.6;
}

.user-score-card__score {
  font-size: 1.125rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--color-text);
}

.user-score-card__footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.8125rem;
  color: var(--color-muted);
  border-top: 1px solid color-mix(in srgb, var(--color-border) 40%, transparent);
  padding-top: 0.45rem;
}

.meta-part strong {
  color: var(--color-text);
}

.meta-part--date {
  margin-left: auto;
  opacity: 0.8;
}

@media (max-width: 40rem) {
  .hero {
    flex-direction: column;
  }
}
</style>

