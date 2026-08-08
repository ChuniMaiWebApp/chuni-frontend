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
    :class="[`rating--${size}`, `rating--${kind}`, { 'rating--iridescent': tier === 'rainbow' }]"
    :style="tier === 'rainbow' ? undefined : { color: colour }"
    :title="tier ? `Rating band: ${tier}` : undefined"
  >{{ rating === null ? '—' : rating.toFixed(2) }}</span>
</template>

<style scoped>
.rating {
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  /* The tier colours are tuned for a dark backdrop; a hairline of the page
     colour keeps the palest ones (platinum, silver) legible on light too. */
  text-shadow: 0 0 1px color-mix(in srgb, var(--color-bg) 70%, transparent);
}

.rating--sm { font-size: 0.8125rem; }
.rating--md { font-size: 1rem; }
.rating--lg { font-size: 2.25rem; letter-spacing: -0.02em; }

/* A player's overall rating is the headline number; a play rating is one row
   in a list. Weight separates them where colour cannot. */
.rating--play { font-weight: 600; }

/*
 * Rating 16+, painted the way the game paints it.
 *
 * The ramp runs top to bottom through the whole glyph — pink, gold, lime,
 * green, mint, cyan — not as a sweep across the number. Measured out of
 * rating_rainbow_*.png; see design/00-game-colours.md.
 *
 * Declared here rather than on a global class so it carries this component's
 * scope attribute. A plain class loses on specificity to any `.something span`
 * rule in a parent page, which is exactly what silently reverted this to grey
 * once already.
 */
.rating--iridescent {
  background: var(--iridescent);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  /* Drawn behind the fill, so the keyline adds an edge rather than eating the
     glyph. Transparent in dark mode — see --iridescent-outline. */
  paint-order: stroke fill;
  -webkit-text-stroke: 0.055em var(--iridescent-outline);
  text-shadow: none;
}
</style>
