<script setup lang="ts">
import type { DependencyStatus } from '~~/shared/types/api'

defineProps<{
  label: string
  status: DependencyStatus
}>()
</script>

<template>
  <div class="status-card" :class="`status-card--${status}`">
    <span class="status-card__dot" aria-hidden="true" />
    <span class="status-card__label">{{ label }}</span>
    <span class="status-card__value">{{ status }}</span>
  </div>
</template>

<style scoped>
.status-card {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 0.9375rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.status-card__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-muted);
  flex-shrink: 0;
}

.status-card--up .status-card__dot {
  background: var(--color-up);
}

.status-card--down .status-card__dot {
  background: var(--color-down);
}

.status-card__label {
  font-weight: 550;
}

.status-card__value {
  margin-left: auto;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-muted);
}
</style>
