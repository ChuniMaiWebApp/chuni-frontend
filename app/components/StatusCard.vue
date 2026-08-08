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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
  box-shadow: 0 0 6px var(--color-up);
}

.status-card--down .status-card__dot {
  background: var(--color-down);
  box-shadow: 0 0 6px var(--color-down);
}

.status-card__label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
}

.status-card__value {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}
</style>

