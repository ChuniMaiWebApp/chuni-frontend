<script setup lang="ts">
import type { AnyScore } from '~~/shared/types/api'

/**
 * One score, sized for a list of fifty.
 *
 * The card this replaces stood about 150px tall for four short lines, which
 * meant a Best 50 ran to some seven screens of thumb. Everything here is on
 * two rows: what the play was, and what it was worth.
 *
 * Reading order is deliberate. Scanning a list, a player is looking for the
 * song and the score, so those are the largest things and sit at opposite ends
 * of the first row. Difficulty, rank and lamps qualify the play and sit
 * underneath at label size. Rating and OVER POWER close the row on the right,
 * where the eye already is after the score.
 */
const props = defineProps<{
  score: AnyScore
  /** Position in a best30/new20 list. */
  index?: number
}>()

const lamps = computed(() => scoreLamps(props.score))

const trackNo = computed(() =>
  'trackNo' in props.score ? props.score.trackNo : null,
)

const isNewRecord = computed(() =>
  'isNewRecord' in props.score ? props.score.isNewRecord : false,
)

/** `95.53%` — the raw OVER POWER means little without its ceiling. */
const overpowerPercent = computed(() => {
  const { overpower, maxOverpower } = props.score

  if (overpower === null || maxOverpower === null || maxOverpower === 0) {
    return null
  }

  return `${(Math.floor((overpower / maxOverpower) * 10_000) / 100).toFixed(2)}%`
})
</script>

<template>
  <article
    class="score"
    :style="{ '--difficulty': difficultyInk(score.chart.difficulty) }"
  >
    <img
      v-if="score.song.jacketUrl"
      :src="score.song.jacketUrl"
      :alt="score.song.title"
      loading="lazy"
      width="52"
      height="52"
      class="score__jacket"
    >
    <div v-else class="score__jacket score__jacket--empty" aria-hidden="true" />

    <div class="score__body">
      <div class="score__row">
        <span v-if="index !== undefined" class="score__index">{{ index }}</span>
        <span v-else-if="trackNo" class="score__index">T{{ trackNo }}</span>

        <h3 class="score__title" :title="score.song.title">{{ score.song.title }}</h3>

        <span v-if="isNewRecord" class="score__new">NEW</span>

        <span class="score__value tabular">{{ formatScore(score.score) }}</span>
      </div>

      <div class="score__row score__row--meta">
        <div class="score__badges">
          <DifficultyLabel
            :difficulty="score.chart.difficulty"
            :level="chartLevelValue(score)"
            size="sm"
          />

          <RankBadge :rank="score.rank" size="sm" />

          <LampBadge
            v-for="lamp in lamps"
            :key="lamp.label"
            :lamp="lamp"
            size="sm"
          />
        </div>

        <span class="score__worth tabular">
          <RatingValue :rating="score.rating" size="sm" />
          <span v-if="overpowerPercent" class="score__op">{{ overpowerPercent }}</span>
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.score {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  /* The difficulty reads from the left edge without a bar thick enough to
     compete with the jacket next to it. */
  border-left: 3px solid var(--difficulty);
  border-radius: 6px;
  background: var(--color-surface);
  overflow: hidden;
}

.score__jacket {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 4px;
  object-fit: cover;
  display: block;
}

.score__jacket--empty {
  background: var(--color-bg);
}

.score__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  overflow: hidden;
}

.score__row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  min-width: 0;
}

.score__row--meta {
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  min-width: 0;
  overflow: hidden;
}

.score__badges {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  min-width: 0;
  flex-shrink: 1;
  overflow: hidden;
}

.score__index {
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-muted);
  flex-shrink: 0;
}

.score__title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.score__new {
  flex-shrink: 0;
  font-size: 0.5625rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--color-accent);
}

/* Pushed to the far edge: the eye lands on the title, then travels to it. */
.score__value {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.score__worth {
  margin-left: auto;
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  flex-shrink: 0;
  white-space: nowrap;
}

.score__op {
  font-size: 0.6875rem;
  color: var(--color-muted);
}
</style>
