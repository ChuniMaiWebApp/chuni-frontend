<script setup lang="ts">
import type { LinkedGateProgress } from '~~/shared/types/api'

/**
 * One Linked VERSE gate.
 *
 * The badge is the game's own art, served straight from CHUNITHM-NET: a
 * hexagon per gate, already drawn in the state that gate is in. It carries the
 * detail on its own — a player who sees these on the cabinet every session
 * reads them faster than any label — so this component adds one thing only:
 * whether the gate is cleared.
 *
 * Two states, not five. The game distinguishes found, analysing and linkable
 * in the artwork; repeating that in text and a coloured border made ten cards
 * of competing highlights and said nothing the picture had not. Only `clear`
 * is marked, and everything else is left plain — an uncleared gate is the
 * resting state, and resting states do not need decoration.
 *
 * Colour is never the only signal, because it fails for anyone who cannot
 * separate red from green, and because these print small.
 */
const props = defineProps<{ gate: LinkedGateProgress }>()

/**
 * Cleared, as the API established it.
 *
 * There was a heuristic here that guessed instead: any gate whose badge
 * filename did not contain "off" was rendered as cleared. CHUNITHM-NET serves
 * those badges under opaque hashes — `Y9BRPL5DR4EDEOH06QV5OUPD2WYFF14I.png` —
 * so the substring never matched and every gate with any artwork at all came
 * back "Cleared", including ones the player had never found.
 *
 * What a badge means is recorded in `app.linked_gate_badges`, by someone who
 * can see it. A gate whose badge nobody has labelled yet reads as not cleared,
 * which is the safer of the two: the artwork beside it still shows the truth,
 * and claiming a clear that did not happen is the worse mistake.
 */
const isCleared = computed(() => props.gate.status === 'clear')
</script>

<template>
  <div class="gate" :data-cleared="isCleared">
    <img
      v-if="gate.badgeUrl"
      :src="gate.badgeUrl"
      :alt="`${gate.gate} gate badge`"
      class="gate__badge"
      width="36"
      height="36"
      loading="lazy"
    >
    <!-- Stands in only when the image fails to load. -->
    <span v-else class="gate__mark" aria-hidden="true">{{ isCleared ? '✓' : '·' }}</span>

    <span class="gate__body">
      <span class="gate__name">{{ gate.gate }}</span>
      <span class="gate__state">{{ isCleared ? 'Cleared' : 'Not cleared' }}</span>
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

/*
 * Only the cleared state is marked.
 *
 * An uncleared gate gets no border, no tint and no fading: it is the resting
 * state, and ten cards each shouting a different colour was what made this
 * section hard to read. The badge art still distinguishes the stages the game
 * knows about — this only answers "done or not".
 *
 * No grayscale filter on the uncleared badge either. SEGA already serves an
 * uncleared gate in its own muted artwork, so dimming it here would be dimming
 * it twice.
 */
.gate[data-cleared='true'] {
  border-color: color-mix(in srgb, var(--lamp-clear) 40%, transparent);
}

.gate[data-cleared='true'] .gate__state,
.gate[data-cleared='true'] .gate__mark {
  color: var(--lamp-clear);
}
</style>
