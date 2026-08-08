<script setup lang="ts">
/**
 * A spinner, with room for a line saying what is being waited on.
 *
 * Every slow wait in this app is the same wait — a CHUNITHM-NET round trip
 * through SEGA's SSO, one to three seconds — so the label is worth having:
 * "Asking CHUNITHM-NET…" explains a pause that a bare spinner would just make
 * you sit through.
 *
 * Drawn with a conic gradient rather than a spinning border so the trail fades
 * instead of chasing a hard edge, and it reads at 16px as well as at 32.
 */
withDefaults(
  defineProps<{
    size?: number
    label?: string | null
    /** `block` centres it in the page; `inline` sits it beside text. */
    layout?: 'block' | 'inline'
  }>(),
  { size: 28, label: null, layout: 'block' },
)
</script>

<template>
  <div
    class="spinner"
    :class="`spinner--${layout}`"
    role="status"
    :aria-label="label ?? 'Loading'"
  >
    <span
      class="spinner__disc"
      :style="{ width: `${size}px`, height: `${size}px` }"
      aria-hidden="true"
    />
    <span v-if="label" class="spinner__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.spinner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-muted);
}

.spinner--block {
  flex-direction: column;
  justify-content: center;
  padding: 3rem 1rem;
}

.spinner--inline {
  display: inline-flex;
  gap: 0.4rem;
}

.spinner__disc {
  border-radius: 50%;
  /* A cone fading to nothing, masked into a ring. */
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    color-mix(in srgb, var(--color-accent) 25%, transparent) 45%,
    var(--color-accent) 100%
  );
  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0);
  animation: spin 0.8s linear infinite;
}

.spinner__label {
  font-size: 0.8125rem;
}

@keyframes spin {
  to {
    transform: rotate(1turn);
  }
}

/*
 * Reduced motion still needs to say "working". The disc stops turning and
 * pulses instead, which carries the same message without the rotation.
 */
@media (prefers-reduced-motion: reduce) {
  .spinner__disc {
    animation: spinner-pulse 1.4s ease-in-out infinite;
  }

  @keyframes spinner-pulse {
    50% {
      opacity: 0.35;
    }
  }
}
</style>
