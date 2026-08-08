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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--rank-colour);
  border-radius: 999px;
  color: var(--rank-colour);
  font-weight: 750;
  letter-spacing: 0.04em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  background: var(--color-game-chip-bg);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--rank-colour) 20%, transparent);
}

.rank--sm {
  font-size: 0.625rem;
  padding: 0.15rem 0.45rem;
}

.rank--md {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
}

/*
 * S and above sit on a highlighted backing.
 */
.rank--top {
  background: color-mix(in srgb, var(--rank-colour) 22%, var(--color-game-chip-bg) 78%);
  border-color: color-mix(in srgb, var(--rank-colour) 70%, transparent);
  color: color-mix(in srgb, var(--rank-colour) 85%, #ffffff 15%);
  box-shadow: 0 0 6px color-mix(in srgb, var(--rank-colour) 25%, transparent);
}

/* SSS+ gets the same vertical ramp as rating 16+ */
.rank--iridescent {
  background: var(--iridescent);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  paint-order: stroke fill;
  -webkit-text-stroke: 0.055em var(--iridescent-outline);
  border-color: #28ffbd;
  box-shadow: 0 0 8px rgba(40, 255, 189, 0.4);
}
</style>

