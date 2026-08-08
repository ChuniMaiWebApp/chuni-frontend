<script setup lang="ts">
import { Difficulty } from '~~/shared/types/api'

/**
 * A difficulty name and its chart constant, as coloured text.
 *
 * Filled plates were tried and rejected: white-on-colour is heavy, and a list
 * of fifty of them turns into fifty coloured blocks competing with the score.
 * Coloured text carries the same information at a fraction of the weight.
 *
 * ULTIMA is the awkward one and has been solved twice.
 *
 * Its colour in the game is near-black `#141414`, invisible on a dark page.
 * The first attempt kept the black and added the pink-red keyline the game
 * uses — faithful, but at label size the pink is most of what you see, and it
 * read as another EXPERT. So ULTIMA is now neutral: charcoal on light, warm
 * silver on dark. Grey is what separates it from the five coloured
 * difficulties, which is the job the black does in the cabinet.
 */
const props = defineProps<{
  difficulty: Difficulty
  /** The chart constant, or the displayed level when no constant is known. */
  level?: string | number | null
  size?: 'sm' | 'md'
}>()

const isUltima = computed(() => props.difficulty === Difficulty.ULTIMA)
</script>

<template>
  <span
    class="diff"
    :class="[`diff--${size ?? 'md'}`, { 'diff--ultima': isUltima }]"
    :style="{ '--ink': difficultyInk(difficulty) }"
  >
    <span class="diff__name">{{ difficultyLabel(difficulty) }}</span>
    <span v-if="level !== null && level !== undefined" class="diff__level">{{ level }}</span>
  </span>
</template>

<style scoped>
/*
 * The game's inks come off a cabinet screen and neither theme suits them raw.
 *
 * Measured against this app's own cards: on white the worst was EXPERT at
 * 4.37:1; on the dark card the worst was MASTER at 2.95:1 — and MASTER is most
 * of what this app shows. So light mode takes them 25% toward black and dark
 * mode 30% toward white, which puts every difficulty above 4.9:1 in both.
 *
 * Hue is untouched by design. These have to stay recognisable as BASIC green
 * and MASTER purple; a shift in lightness keeps that, a shift in hue would not.
 */
.diff {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4em;
  color: var(--ink);
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.3;
  white-space: nowrap;
}

/* Light is the default, so it owns the base rule. */
.diff {
  color: color-mix(in srgb, var(--ink) 75%, #000000);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .diff {
    color: color-mix(in srgb, var(--ink) 70%, #ffffff);
  }
}

:root[data-theme='dark'] .diff {
  color: color-mix(in srgb, var(--ink) 70%, #ffffff);
}

:root[data-theme='light'] .diff {
  color: color-mix(in srgb, var(--ink) 75%, #000000);
}

.diff--sm {
  font-size: 0.6875rem;
}

.diff--md {
  font-size: 0.8125rem;
}

.diff__level {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
  opacity: 0.85;
}

/*
 * ULTIMA's true colour is black, which a dark page swallows. The game solves
 * this with a pink-red keyline; a thin stroke of it does the same job here and
 * keeps the letterform reading as black rather than as red.
 */
/*
 * Explicit per theme rather than the shared lightness shift: run through that,
 * a neutral lands within a few points of the muted text colour and stops
 * reading as a difficulty at all. 13.7:1 on white, 12.9:1 on the dark card.
 */
:root .diff--ultima,
:root[data-theme='light'] .diff--ultima {
  color: #332b33;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .diff--ultima {
    color: #ded5dd;
  }
}

:root[data-theme='dark'] .diff--ultima {
  color: #ded5dd;
}
</style>
