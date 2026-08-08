<script setup lang="ts">
import type { AnyScore, ChartView } from '~~/shared/types/api'

/**
 * The full breakdown of one play.
 *
 * Shared by the recent-play page and the chart-record page: the two differ in
 * where the score comes from, not in how it reads once you have it.
 */
const props = defineProps<{
  score: AnyScore
  /** Chart metadata from the song database, when the page has it. */
  chart?: ChartView | null
  /** Play number within the credit, for a playlog entry. */
  trackNo?: number | null
  isNewRecord?: boolean
}>()

const notecount = computed(
  () => props.chart?.maxCombo ?? props.score.chart.maxCombo,
)

const lamps = computed(() => scoreLamps(props.score))

const loss = computed(() =>
  'judgementLoss' in props.score ? props.score.judgementLoss : null,
)

const notePercentage = computed(() =>
  'notePercentage' in props.score ? props.score.notePercentage : null,
)

/** `-1,127.04`, or nothing at all when the notecount is unknown. */
const formatLoss = (value: number | undefined) =>
  value === undefined
    ? null
    : `−${value.toLocaleString('en-GB', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`

const judgementRows = computed(() => {
  const judgements = props.score.judgements

  if (!judgements) return []

  return [
    { key: 'critical', label: 'CRITICAL', count: judgements.justiceCritical, lost: null },
    { key: 'justice', label: 'JUSTICE', count: judgements.justice, lost: formatLoss(loss.value?.justice) },
    { key: 'attack', label: 'ATTACK', count: judgements.attack, lost: formatLoss(loss.value?.attack) },
    { key: 'miss', label: 'MISS', count: judgements.miss, lost: formatLoss(loss.value?.miss) },
  ]
})

const noteRows = computed(() => {
  const percentage = notePercentage.value

  if (!percentage) return []

  // Ordered as the game shows them, and only the note types the chart has
  return (
    [
      ['TAP', percentage.tap, props.chart?.notes.tap],
      ['HOLD', percentage.hold, props.chart?.notes.hold],
      ['SLIDE', percentage.slide, props.chart?.notes.slide],
      ['AIR', percentage.air, props.chart?.notes.air],
      ['FLICK', percentage.flick, props.chart?.notes.flick],
    ] as const
  )
    .filter(([, value, count]) => value !== null && (count === undefined || count))
    .map(([label, value, count]) => ({ label, value, count: count ?? null }))
})

/**
 * Where each bar starts.
 *
 * Note accuracy lives between roughly 90% and 101%, so a bar scaled from zero
 * spends nine tenths of its length on the part that is always full: 96.91% and
 * 100.99% drew as the same bar. Anchoring to just below the worst row in this
 * play makes the differences the bar exists to show actually visible.
 *
 * The floor is stated in the heading, because a bar that does not start at
 * zero is a lie unless it says so.
 */
const noteFloor = computed(() => {
  const values = noteRows.value
    .map(row => row.value)
    .filter((value): value is number => value !== null)

  if (values.length === 0) return 0

  return Math.max(0, Math.floor(Math.min(...values)) - 1)
})

const noteBarWidth = (value: number | null): string => {
  const floor = noteFloor.value
  const ceiling = 101

  if (value === null || ceiling <= floor) return '0%'

  const fraction = (value - floor) / (ceiling - floor)

  return `${Math.max(0, Math.min(fraction, 1)) * 100}%`
}

const overpowerPercent = computed(() => {
  const { overpower, maxOverpower } = props.score

  if (overpower === null || maxOverpower === null || maxOverpower === 0) {
    return null
  }

  return Math.floor((overpower / maxOverpower) * 10_000) / 100
})
</script>

<template>
  <article
    class="detail"
    :style="{ '--difficulty': difficultyInk(score.chart.difficulty) }"
  >
    <header class="detail__head">
      <img
        v-if="score.song.jacketUrl"
        :src="score.song.jacketUrl"
        :alt="score.song.title"
        class="detail__jacket"
        width="120"
        height="120"
      >
      <div v-else class="detail__jacket-placeholder" aria-hidden="true" />

      <div class="detail__identity">
        <p class="detail__eyebrow">
          <span v-if="trackNo" class="detail__track">TRACK {{ trackNo }}</span>
          <span v-if="isNewRecord" class="detail__new">NEW RECORD</span>
          <span v-if="score.achievedAt" class="detail__date tabular">{{ formatDateTime(score.achievedAt) }}</span>
        </p>

        <h2 class="detail__title">{{ score.song.title }}</h2>

        <p class="detail__chart">
          <DifficultyLabel
            :difficulty="score.chart.difficulty"
            :level="chartLevelValue(score)"
          />
        </p>

        <div class="detail__lamps">
          <RankBadge :rank="score.rank" size="md" />
          <LampBadge v-for="lamp in lamps" :key="lamp.label" :lamp="lamp" />
        </div>
      </div>

      <div class="detail__score-box">
        <span class="detail__score-val tabular">{{ formatScore(score.score) }}</span>
        <span v-if="score.maxCombo !== null" class="detail__score-combo tabular">
          ×{{ score.maxCombo }}<template v-if="notecount"> / {{ notecount }}</template>
        </span>
      </div>
    </header>

    <div class="detail__grid">
      <section v-if="judgementRows.length" class="panel panel--primary">
        <h3>Judgements</h3>
        <dl class="judgements">
          <div v-for="row in judgementRows" :key="row.key" :class="`judgements--${row.key}`">
            <dt>{{ row.label }}</dt>
            <dd>
              <span class="j-count tabular">{{ row.count.toLocaleString('en-GB') }}</span>
              <small v-if="row.lost" class="j-lost tabular">{{ row.lost }}</small>
            </dd>
          </div>
        </dl>
        <p v-if="loss" class="judgements__total tabular">
          {{ formatLoss(loss.total) }} from a perfect play
        </p>
      </section>

      <section v-if="noteRows.length" class="panel">
        <h3>
          Note accuracy
          <small v-if="noteFloor > 0" class="panel__note">from {{ noteFloor }}%</small>
        </h3>
        <ul class="notes">
          <li v-for="row in noteRows" :key="row.label">
            <span class="notes__label">{{ row.label }}</span>
            <span class="notes__bar" aria-hidden="true">
              <span :style="{ width: noteBarWidth(row.value) }" />
            </span>
            <span class="notes__value tabular">{{ row.value?.toFixed(2) }}%</span>
            <span v-if="row.count" class="notes__count tabular">{{ row.count }}</span>
          </li>
        </ul>
      </section>

      <section class="panel">
        <h3>Worth</h3>
        <dl class="worth">
          <div>
            <dt>Play rating</dt>
            <dd><RatingValue :rating="score.rating" kind="play" size="md" /></dd>
          </div>
          <div v-if="score.chart.difficulty !== undefined && chart?.const">
            <dt>Chart constant</dt>
            <dd class="tabular">{{ chart.const }}</dd>
          </div>
          <div>
            <dt>OVER POWER</dt>
            <dd class="tabular">
              {{ score.overpower === null ? '—' : score.overpower.toFixed(3) }}
              <small v-if="overpowerPercent !== null">({{ overpowerPercent.toFixed(2) }}%)</small>
            </dd>
          </div>
          <div v-if="score.maxOverpower !== null">
            <dt>Chart maximum</dt>
            <dd class="tabular">{{ score.maxOverpower.toFixed(3) }}</dd>
          </div>
        </dl>
      </section>

      <slot name="panels" />
    </div>
  </article>
</template>

<style scoped>
.detail {
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--difficulty);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.detail__head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.25rem;
  align-items: start;
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, var(--color-surface-hover), var(--color-surface));
}

.detail__jacket,
.detail__jacket-placeholder {
  width: 120px;
  height: 120px;
  border-radius: var(--radius);
  object-fit: cover;
}

.detail__jacket-placeholder {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.detail__identity {
  min-width: 0;
}

.detail__eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
  margin: 0 0 0.35rem;
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.detail__track {
  font-weight: 700;
}

.detail__new {
  color: var(--color-accent);
  font-weight: 800;
  background: var(--color-accent-subtle);
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}

.detail__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 750;
  line-height: 1.2;
  color: var(--color-text);
}

.detail__chart {
  margin: 0.35rem 0 0;
}

.detail__difficulty {
  color: var(--difficulty);
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.03em;
}

.detail__lamps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.75rem 0 0;
}

.detail__score-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.detail__score-val {
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.detail__score-combo {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-muted);
}

.detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1px;
  background: var(--color-border);
}

.panel {
  background: var(--color-surface);
  padding: 1.125rem 1.25rem;
}

.panel h3 {
  margin: 0 0 0.875rem;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
  font-weight: 700;
}

.judgements {
  display: grid;
  gap: 0.45rem;
  margin: 0;
}

.judgements > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.judgements dt {
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.judgements dd {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
}

.j-lost {
  margin-left: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-down);
}

.judgements--critical dt { color: var(--color-text); }
.judgements--justice dt { color: var(--color-muted); }
.judgements--attack dt { color: var(--rating-orange); }
.judgements--miss dt { color: var(--color-down); }

.judgements__total {
  margin: 0.75rem 0 0;
  padding-top: 0.6rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.75rem;
  color: var(--color-muted);
}

.notes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}

.notes li {
  display: grid;
  grid-template-columns: 3.25rem 1fr auto auto;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.notes__label {
  letter-spacing: 0.05em;
  font-weight: 650;
  color: var(--color-muted);
}

/* Says the axis is truncated, so the bars are not read as absolute. */
.panel__note {
  margin-left: 0.4rem;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.75;
}

.notes__bar {
  height: 6px;
  border-radius: 999px;
  background: var(--color-border);
  overflow: hidden;
}

.notes__bar > span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--difficulty);
}

.notes__value {
  font-weight: 650;
  color: var(--color-text);
}

.notes__count {
  min-width: 3rem;
  text-align: right;
  color: var(--color-muted);
}

.worth {
  display: grid;
  gap: 0.6rem;
  margin: 0;
}

.worth > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.worth dt {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
}

.worth dd {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
}

.worth dd small {
  margin-left: 0.35rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-muted);
}

@media (max-width: 40rem) {
  .detail__head {
    grid-template-columns: auto 1fr;
  }

  .detail__score-box {
    grid-column: 1 / -1;
    text-align: left;
    align-items: flex-start;
    margin-top: 0.5rem;
  }
}
</style>

