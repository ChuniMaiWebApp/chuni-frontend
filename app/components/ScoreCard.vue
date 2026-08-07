<script setup lang="ts">
import { ComboLamp, type AnyScore } from '~~/shared/types/api'

const props = defineProps<{
  score: AnyScore
  /** Position in a best30/new20 list. */
  index?: number
}>()

/**
 * A combo lamp supersedes the clear lamp, so CLEAR is only worth showing when
 * there is no FULL COMBO / ALL JUSTICE. Unknown lamps render as nothing.
 */
const lamps = computed(() =>
  [
    comboLampLabel(props.score.comboLamp),
    chainLampLabel(props.score.chainLamp),
    props.score.comboLamp === ComboLamp.NONE
      ? clearLampLabel(props.score.clearLamp)
      : null,
  ].filter((lamp): lamp is string => lamp !== null),
)

const trackNo = computed(() =>
  'trackNo' in props.score ? props.score.trackNo : null,
)
const isNewRecord = computed(() =>
  'isNewRecord' in props.score ? props.score.isNewRecord : false,
)
const judgements = computed(() => props.score.judgements)
</script>

<template>
  <article
    class="score"
    :style="{ '--difficulty': difficultyColour(score.chart.difficulty) }"
  >
    <div class="score__jacket">
      <img
        v-if="score.song.jacketUrl"
        :src="score.song.jacketUrl"
        :alt="score.song.title"
        loading="lazy"
        width="72"
        height="72"
      >
      <div v-else class="score__jacket-placeholder" aria-hidden="true" />
    </div>

    <div class="score__body">
      <header class="score__header">
        <span v-if="index !== undefined" class="score__index">#{{ index }}</span>
        <span v-else-if="trackNo" class="score__index">TRACK {{ trackNo }}</span>

        <h3 class="score__title">{{ score.song.title }}</h3>

        <span v-if="isNewRecord" class="score__badge">NEW</span>
      </header>

      <p class="score__chart">{{ chartLabel(score) }}</p>

      <p class="score__line">
        <strong class="score__rank">{{ rankLabel(score.rank) }}</strong>
        <span class="score__value">{{ formatScore(score.score) }}</span>
        <span v-for="lamp in lamps" :key="lamp" class="score__lamp">{{ lamp }}</span>
      </p>

      <p v-if="judgements" class="score__judgements">
        {{ judgements.justiceCritical }} / {{ judgements.justice }} /
        {{ judgements.attack }} / {{ judgements.miss }}
        <span v-if="score.maxCombo !== null">· x{{ score.maxCombo }}</span>
      </p>

      <footer class="score__footer">
        <span>Rating <strong>{{ formatRating(score.rating) }}</strong></span>
        <span>OP {{ formatOverpower(score) }}</span>
        <span v-if="score.achievedAt" class="score__date">
          {{ formatDateTime(score.achievedAt) }}
        </span>
      </footer>
    </div>
  </article>
</template>

<style scoped>
.score {
  display: flex;
  gap: 0.875rem;
  padding: 0.875rem;
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--difficulty);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.score__jacket img,
.score__jacket-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  object-fit: cover;
  display: block;
}

.score__jacket-placeholder {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.score__body {
  flex: 1;
  min-width: 0;
}

.score__header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.score__index {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-muted);
  flex-shrink: 0;
}

.score__title {
  font-size: 0.9375rem;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score__badge {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-accent);
  flex-shrink: 0;
}

.score__chart {
  margin: 0.125rem 0 0.375rem;
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  color: var(--difficulty);
  font-weight: 600;
}

.score__line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
}

.score__rank {
  font-size: 1rem;
  letter-spacing: 0.02em;
}

.score__value {
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}

.score__lamp {
  font-size: 0.6875rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  padding: 0.05rem 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-muted);
}

.score__judgements {
  margin: 0.375rem 0 0;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-muted);
}

.score__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
}

.score__footer strong {
  color: var(--color-text);
}

.score__date {
  margin-left: auto;
}
</style>
