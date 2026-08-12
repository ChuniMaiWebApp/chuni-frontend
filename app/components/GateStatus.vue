<script setup lang="ts">
import type { LinkedGateProgress } from '~~/shared/types/api'

/**
 * One Linked VERSE gate: the game's own badge, and the gate's name.
 *
 * No status text and no state colouring, on purpose. CHUNITHM-NET serves the
 * hexagon already drawn in whatever state that gate is in, and a player who
 * sees these on the cabinet every session reads the artwork faster than any
 * label. Restating it in words could only ever agree with the picture or
 * contradict it, and twice now it contradicted it:
 *
 *   - a heuristic here guessed "cleared" from the badge filename. The
 *     filenames are opaque hashes, so the guess matched everything and every
 *     gate read as cleared, including ones never found.
 *   - reading the real status instead was correct but incomplete: what a badge
 *     means has to be recorded by hand, so gates nobody had got to yet read as
 *     "Not cleared" while their artwork plainly showed otherwise.
 *
 * Both failures came from the same place — a second, slower-moving source of
 * truth sitting next to an image that was already right. So the image is left
 * to speak for itself.
 *
 * `status` is still on the payload and still worth having: a count of gates
 * cleared, or a filter, needs a machine-readable answer. It is just not what
 * this card is for.
 */
defineProps<{ gate: LinkedGateProgress }>()
</script>

<template>
  <div class="gate">
    <img
      v-if="gate.badgeUrl"
      :src="gate.badgeUrl"
      :alt="`${gate.gate} gate badge`"
      class="gate__badge"
      width="36"
      height="36"
      loading="lazy"
    >
    <!-- Stands in only when the image itself fails to load. -->
    <span v-else class="gate__mark" aria-hidden="true">◇</span>

    <span class="gate__name">{{ gate.gate }}</span>
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

/*
 * The fallback, for a gate whose badge image did not load.
 *
 * Deliberately says nothing about progress: if the one thing that carries the
 * state is missing, inventing a mark for it would be guessing.
 */
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

.gate__name {
  font-size: 0.8125rem;
  font-weight: 650;
  text-transform: capitalize;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
