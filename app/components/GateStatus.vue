<script setup lang="ts">
import type { LinkedGateProgress } from '~~/shared/types/api'

/**
 * One Linked VERSE gate.
 *
 * Ten of these sit side by side, so the state has to survive a glance. Text
 * alone did not: `Not found` and `Cleared` are the same shape and weight, and
 * scanning ten of them meant reading ten labels.
 *
 * The badge is the game's own art, served straight from CHUNITHM-NET: a
 * hexagon per gate, already drawn in its cleared or uncleared state. Nothing
 * invented here would be as recognisable to someone who sees those hexagons on
 * the cabinet every session. A drawn mark stands in only when the image is
 * missing.
 *
 * Colour is never the only signal, because it fails for anyone who cannot
 * separate red from green, and because these print small.
 *
 * `unknown` deliberately looks nothing like `not_found`. Conflating them is
 * the bug this feature was built to fix: the app reported gates as unbroken
 * that the player had already cleared.
 */
defineProps<{ gate: LinkedGateProgress }>()

const STATE = {
  clear: { label: 'Cleared', mark: '✓' },
  linkable: { label: 'Linkable', mark: '→' },
  under_analysis: { label: 'Analysing', mark: '◌' },
  not_found: { label: 'Not found', mark: '·' },
  unknown: { label: 'Unrecognised', mark: '?' },
} as const
</script>

<template>
  <div class="gate" :data-status="gate.status">
    <img
      v-if="gate.badgeUrl"
      :src="gate.badgeUrl"
      :alt="`${gate.gate} gate badge`"
      class="gate__badge"
      width="36"
      height="36"
      loading="lazy"
    >
    <span v-else class="gate__mark" aria-hidden="true">{{ STATE[gate.status].mark }}</span>

    <span class="gate__body">
      <span class="gate__name">{{ gate.gate }}</span>
      <span class="gate__state">{{ STATE[gate.status].label }}</span>
    </span>
  </div>
</template>

<style scoped>
.gate {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  min-width: 0;
}

.gate__badge {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  object-fit: contain;
}

/* The fallback, for a gate whose badge image did not load. */
.gate__mark {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid currentColor;
  font-size: 0.75rem;
  line-height: 1;
  color: var(--color-muted);
}

.gate__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.gate__name {
  font-size: 0.8125rem;
  font-weight: 650;
  text-transform: capitalize;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gate__state {
  font-size: 0.6875rem;
  color: var(--color-muted);
}

.gate[data-status='clear'] {
  border-color: color-mix(in srgb, var(--lamp-clear) 40%, transparent);
}

.gate[data-status='clear'] .gate__state {
  color: var(--lamp-clear);
}

.gate[data-status='clear'] .gate__mark {
  color: var(--lamp-clear);
}

.gate[data-status='linkable'] {
  border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
}

.gate[data-status='linkable'] .gate__state,
.gate[data-status='linkable'] .gate__mark {
  color: var(--color-accent);
}

.gate[data-status='under_analysis'] .gate__state,
.gate[data-status='under_analysis'] .gate__mark {
  color: var(--rating-orange);
}

/* Nothing here yet — the quietest state, and the only one that should be. */
.gate[data-status='not_found'] {
  opacity: 0.55;
}

/* The game draws an unearned gate colourless too, so this follows a convention
   rather than inventing one. */
.gate[data-status='not_found'] .gate__badge {
  filter: grayscale(0.85);
}

/*
 * A badge the backend does not recognise. Loud on purpose: it means the data
 * is incomplete, and the last time this was allowed to look like `not_found`
 * the app told a player they had not cleared gates they had.
 */
.gate[data-status='unknown'] {
  border-color: var(--rating-purple);
  background: color-mix(in srgb, var(--rating-purple) 10%, var(--color-surface));
}

.gate[data-status='unknown'] .gate__state,
.gate[data-status='unknown'] .gate__mark {
  color: var(--rating-purple);
  font-weight: 700;
}
</style>
