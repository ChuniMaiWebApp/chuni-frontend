<script setup lang="ts">
import { ComboLamp, type AnyScore, type ChartView } from '~~/shared/types/api'

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

const lamps = computed(() =>
  [
    comboLampLabel(props.score.comboLamp),
    chainLampLabel(props.score.chainLamp),
    // A combo lamp supersedes the clear lamp, so CLEAR is only worth showing
    // when there is no FULL COMBO / ALL JUSTICE.
    props.score.comboLamp === ComboLamp.NONE
      ? clearLampLabel(props.score.clearLamp)
      : null,
  ].filter((label): label is string => label !== null),
)

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

  // Ordered as the game shows them, and only the note types the chart has:
  // a chart with no flicks should not read as 0% flick.
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
    :style="{ '--difficulty': difficultyColour(score.chart.difficulty) }"
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

      <div class="detail__identity">
        <p class="detail__eyebrow">
          <span v-if="trackNo">TRACK {{ trackNo }}</span>
          <span v-if="isNewRecord" class="detail__new">NEW RECORD</span>
          <span v-if="score.achievedAt">{{ formatDateTime(score.achievedAt) }}</span>
        </p>

        <h2 class="detail__title">{{ score.song.title }}</h2>

        <p class="detail__chart">
          <span class="detail__difficulty">{{ chartLabel(score) }}</span>
        </p>

        <p class="detail__lamps">
          <RankBadge :rank="score.rank" />
          <span v-for="lamp in lamps" :key="lamp" class="detail__lamp">{{ lamp }}</span>
        </p>
      </div>

      <p class="detail__score">
        {{ formatScore(score.score) }}
        <small v-if="score.maxCombo !== null">
          ×{{ score.maxCombo }}<template v-if="notecount">/{{ notecount }}</template>
        </small>
      </p>
    </header>

    <div class="detail__grid">
      <section v-if="judgementRows.length" class="panel">
        <h3>Judgements</h3>
        <dl class="judgements">
          <div v-for="row in judgementRows" :key="row.key" :class="`judgements--${row.key}`">
            <dt>{{ row.label }}</dt>
            <dd>
              {{ row.count.toLocaleString('en-GB') }}
              <!-- What the misses actually cost, which the game never spells out. -->
              <small v-if="row.lost">{{ row.lost }}</small>
            </dd>
          </div>
        </dl>
        <p v-if="loss" class="judgements__total">
          {{ formatLoss(loss.total) }} from a perfect play
        </p>
      </section>

      <section v-if="noteRows.length" class="panel">
        <h3>Note accuracy</h3>
        <ul class="notes">
          <li v-for="row in noteRows" :key="row.label">
            <span class="notes__label">{{ row.label }}</span>
            <span class="notes__bar" aria-hidden="true">
              <!-- Percentages run past 100 on JUSTICE CRITICAL, so the bar is
                   scaled to 101 rather than clipping the best rows flat. -->
              <span :style="{ width: `${Math.min((row.value ?? 0) / 101 * 100, 100)}%` }" />
            </span>
            <span class="notes__value">{{ row.value?.toFixed(2) }}%</span>
            <span v-if="row.count" class="notes__count">{{ row.count }}</span>
          </li>
        </ul>
      </section>

      <section class="panel">
        <h3>Worth</h3>
        <dl class="worth">
          <div>
            <dt>Play rating</dt>
            <dd><RatingValue :rating="score.rating" /></dd>
          </div>
          <div v-if="score.chart.difficulty !== undefined && chart?.const">
            <dt>Chart constant</dt>
            <dd>{{ chart.const }}</dd>
          </div>
          <div>
            <dt>OVER POWER</dt>
            <dd>
              {{ score.overpower === null ? '—' : score.overpower.toFixed(3) }}
              <small v-if="overpowerPercent !== null">{{ overpowerPercent.toFixed(2) }}%</small>
            </dd>
          </div>
          <div v-if="score.maxOverpower !== null">
            <dt>Chart maximum</dt>
            <dd>{{ score.maxOverpower.toFixed(3) }}</dd>
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
  border-radius: var(--radius);
  background: var(--color-surface);
  overflow: hidden;
}

.detail__head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.25rem;
  align-items: start;
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.detail__jacket {
  border-radius: 8px;
  object-fit: cover;
}

.detail__identity {
  min-width: 0;
}

.detail__eyebrow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  margin: 0 0 0.35rem;
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.detail__new {
  color: var(--color-accent);
  font-weight: 650;
}

.detail__title {
  margin: 0;
  font-size: 1.375rem;
  line-height: 1.2;
}

.detail__chart {
  margin: 0.35rem 0 0;
}

.detail__difficulty {
  color: var(--difficulty);
  font-weight: 650;
  font-size: 0.875rem;
  letter-spacing: 0.03em;
}

.detail__lamps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.625rem 0 0;
}

.detail__lamp {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.1rem 0.55rem;
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
}

.detail__lamp {
  color: var(--color-muted);
}

.detail__score {
  margin: 0;
  text-align: right;
  font-size: 2rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.detail__score small {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--color-muted);
}

.detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 1px;
  background: var(--color-border);
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

.judgements {
  display: grid;
  gap: 0.4rem;
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
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.judgements dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-size: 0.9375rem;
}

.judgements dd small {
  margin-left: 0.4rem;
  font-size: 0.75rem;
  color: var(--color-down);
}

.judgements--critical dt { color: var(--color-up, #ffd45e); }
.judgements--miss dt { color: var(--color-down); }

.judgements__total {
  margin: 0.75rem 0 0;
  padding-top: 0.6rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.75rem;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
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
  grid-template-columns: 3rem 1fr auto auto;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.notes__label {
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.notes__bar {
  height: 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-border) 70%, transparent);
  overflow: hidden;
}

.notes__bar > span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--difficulty);
}

.notes__value {
  font-variant-numeric: tabular-nums;
}

.notes__count {
  min-width: 3rem;
  text-align: right;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
}

.worth {
  display: grid;
  gap: 0.5rem;
  margin: 0;
}

.worth > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.worth dt {
  font-size: 0.75rem;
  color: var(--color-muted);
}

.worth dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-size: 0.9375rem;
}

.worth dd small {
  margin-left: 0.35rem;
  font-size: 0.75rem;
  color: var(--color-muted);
}

@media (max-width: 34rem) {
  .detail__head {
    grid-template-columns: auto 1fr;
  }

  .detail__score {
    grid-column: 1 / -1;
    text-align: left;
    font-size: 1.75rem;
  }
}
</style>
