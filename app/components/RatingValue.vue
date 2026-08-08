<script setup lang="ts">
/**
 * A rating, coloured by the band the game would colour it.
 *
 * 16.00 and above is iridescent and moving, because that is how the game draws
 * it and it is the number players show off. Everything below is a flat tier
 * colour. See design/00-game-colours.md for where the values came from.
 */
const props = withDefaults(
  defineProps<{
    rating: number | null
    /** `player` is a total rating; `play` is one chart's contribution. */
    kind?: 'player' | 'play'
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { kind: 'play', size: 'md' },
)

const tier = computed(() =>
  props.rating === null ? null : ratingTier(props.rating),
)

const colour = computed(() =>
  tier.value === null ? 'var(--color-muted)' : RATING_COLOUR[tier.value].core,
)
</script>

<template>
  <span
    class="rating"
    :class="[
      `rating--${size}`,
      `rating--${kind}`,
      { 'rating--iridescent': tier === 'rainbow' },
    ]"
    :style="tier === 'rainbow' ? undefined : { color: colour }"
    :title="tier ? `Rating band: ${tier}` : undefined"
  >{{ rating === null ? '—' : rating.toFixed(2) }}</span>
</template>

<style scoped>
.rating {
  display: inline-flex;
  align-items: center;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
  /* A hairline of the page colour keeps the palest tiers — platinum, silver —
     from dissolving into a light background. */
  text-shadow: 0 0 2px color-mix(in srgb, var(--color-bg) 75%, transparent);
}

.rating--sm {
  font-size: 0.8125rem;
}
.rating--md {
  font-size: 1rem;
}
.rating--lg {
  font-size: 2.25rem;
  letter-spacing: -0.02em;
}

/*
 * A player's overall rating and a single play's rating differ in weight and in
 * where they sit, not in decoration.
 *
 * The overall one used to be boxed in a dark chip with a border. On a card that
 * already has a border and a heading, that was a third frame around one number
 * — and it made the headline read worse than the plain 13px version on every
 * score card.
 */
.rating--player {
  font-weight: 800;
}

.rating--play {
  font-weight: 650;
}

/* Rating 16+, vertical iridescent ramp */
.rating--iridescent {
  background: var(--iridescent);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  paint-order: stroke fill;
  -webkit-text-stroke: 0.055em var(--iridescent-outline);
  text-shadow: none;
}
</style>

