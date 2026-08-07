<script setup lang="ts">
import type { ApiErrorResponse } from '~~/shared/types/api'

const props = defineProps<{
  error: unknown
}>()

/**
 * Nest wraps failures in a consistent envelope, so pull the message out of
 * `data` when it is there and fall back to the transport error otherwise.
 */
const message = computed(() => {
  const data = (props.error as { data?: ApiErrorResponse })?.data

  if (data?.message) {
    return Array.isArray(data.message) ? data.message.join(', ') : data.message
  }

  return (props.error as Error)?.message ?? 'Something went wrong.'
})

const isAuthError = computed(
  () => (props.error as { statusCode?: number })?.statusCode === 401,
)
</script>

<template>
  <div class="api-error">
    <p class="api-error__message">{{ message }}</p>

    <NuxtLink v-if="isAuthError" to="/login" class="api-error__action">
      Link your account again
    </NuxtLink>
  </div>
</template>

<style scoped>
.api-error {
  border: 1px solid var(--color-down);
  border-radius: var(--radius);
  background: var(--color-surface);
  padding: 1rem 1.25rem;
}

.api-error__message {
  margin: 0;
  color: var(--color-down);
}

.api-error__action {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-accent);
}
</style>
