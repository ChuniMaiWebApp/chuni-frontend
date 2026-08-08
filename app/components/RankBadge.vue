<script setup lang="ts">
import { Rank } from '~~/shared/types/api'

/**
 * A rank badge, D through SSS+.
 *
 * S through SSS share one colour on purpose: SEGA's artwork does too, and the
 * game distinguishes them by badge shape and sheen rather than hue. Rather
 * than invent five colours the game does not use, the S tiers are separated by
 * a filled backing that the lower ranks do not get.
 */
const props = withDefaults(
  defineProps<{ rank: Rank, size?: 'sm' | 'md' }>(),
  { size: 'md' },
)

const colour = computed(() => rankColour(props.rank))

/** S and above earn the filled treatment; SSS+ is iridescent on top of it. */
const isTop = computed(() => props.rank >= Rank.S)
</script>

<template>
  <span
    class="rank"
    :class="[
      `rank--${size}`,
      { 'rank--top': isTop, 'rank--iridescent': isIridescentRank(rank) },
    ]"
    :style="{ '--rank-colour': colour }"
  >{{ rankLabel(rank) }}</span>
</template>

<style scoped>
.rank {
  display: inline-block;
  border: 1px solid var(--rank-colour);
  border-radius: 999px;
  color: var(--rank-colour);
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.rank--sm {
  font-size: 0.625rem;
  padding: 0.15rem 0.4rem;
}

.rank--md {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}

/*
 * S and above sit on their own colour rather than outlined in it. The game
 * marks the jump from AAA to S far more strongly than the steps within either
 * group, and this is the same idea without inventing hues.
 */
.rank--top {
  background: color-mix(in srgb, var(--rank-colour) 18%, transparent);
  border-color: color-mix(in srgb, var(--rank-colour) 60%, transparent);
  /* The S-tier cream is nearly white; on a light page it needs a darker ink
     than the badge colour to stay readable. */
  color: color-mix(in srgb, var(--rank-colour) 70%, var(--color-text) 30%);
}

/* SSS+ gets the same vertical ramp as rating 16+ — the game's two multi-hue
   values are painted alike. */
.rank--iridescent {
  background: var(--iridescent);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  paint-order: stroke fill;
  -webkit-text-stroke: 0.055em var(--iridescent-outline);
  border-color: #28ffbd;
}
</style>
