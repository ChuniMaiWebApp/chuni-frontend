<script setup lang="ts">
import type { LampBadge } from '~/utils/lamps'

/**
 * One lamp, coloured by what it is rather than by what its label says.
 *
 * Colours follow the project owner's brief: clear green, failed red, FULL
 * COMBO yellow, ALL JUSTICE and AJC iridescent. SEGA defines no CSS colour for
 * lamps — they are badge images — so unlike rank and rating these are a choice,
 * not a measurement.
 *
 * Every lamp sits on the dark chip in both themes. On a white card the tinted
 * version measured 1.34:1 for FULL COMBO and 1.76:1 for CLEAR — unreadable —
 * and darkening the colours until they passed turned the yellow into olive,
 * losing the one thing the brief was specific about. The chip keeps the hue
 * exact and is what rank badges and the AJC count already do.
 */
defineProps<{ lamp: LampBadge, size?: 'sm' | 'md' }>()
</script>

<template>
  <span
    class="lamp"
    :class="[`lamp--${lamp.kind}`, `lamp--${size ?? 'md'}`]"
    :title="lamp.label"
  >{{ size === 'sm' && lamp.shortLabel ? lamp.shortLabel : lamp.label }}</span>
</template>

<style scoped>
.lamp {
  display: inline-block;
  border: 1px solid color-mix(in srgb, currentColor 45%, transparent);
  border-radius: 999px;
  background: var(--color-game-chip-bg);
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.2;
  white-space: nowrap;
}

.lamp--sm {
  font-size: 0.53125rem;
  padding: 0.06rem 0.28rem;
  flex-shrink: 0;
}

.lamp--md {
  font-size: 0.625rem;
  padding: 0.1rem 0.4rem;
}

.lamp--clear {
  color: var(--lamp-clear);
}

/* HARD, BRAVE, ABSOLUTE and CATASTROPHY are clears too, but harder ones. Same
   family, brighter, so they read as an upgrade rather than a different axis. */
.lamp--hardClear {
  color: var(--lamp-hard-clear);
  font-weight: 800;
}

.lamp--failed {
  color: var(--lamp-failed);
}

.lamp--fullCombo {
  color: var(--lamp-full-combo);
}

/* Chain lamps are a separate axis from combo lamps, so they get their own hue
   rather than a shade of one already in use. */
.lamp--fullChain {
  color: var(--lamp-full-chain);
}

/*
 * ALL JUSTICE and AJC take the same ramp the game gives rating 16+ and SSS+.
 * These are the rarest things on a score card and should read that way.
 */
.lamp--allJustice,
.lamp--ajc {
  background: var(--iridescent);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  paint-order: stroke fill;
  -webkit-text-stroke: 0.05em var(--iridescent-outline);
  border-color: color-mix(in srgb, #28ffbd 55%, transparent);
}

/* AJC is rarer still: every note a JUSTICE CRITICAL. Give it the halo. */
.lamp--ajc {
  border-color: #28ffbd;
  box-shadow: 0 0 6px color-mix(in srgb, #28ffbd 35%, transparent);
}
</style>
