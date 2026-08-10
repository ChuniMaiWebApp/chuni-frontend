<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast-list">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
          :class="`toast-item--${toast.type}`"
        >
          <div class="toast-icon">
            <AppIcon v-if="toast.type === 'success'" name="check" :size="20" />
            <AppIcon v-else-if="toast.type === 'error'" name="alert" :size="20" />
            <AppIcon v-else-if="toast.type === 'warning'" name="alert" :size="20" />
            <AppIcon v-else name="history" :size="20" />
          </div>

          <div class="toast-content">
            <h4 class="toast-title">{{ toast.title }}</h4>
            <p v-if="toast.message" class="toast-message">{{ toast.message }}</p>
          </div>

          <button
            type="button"
            class="toast-close"
            aria-label="Close toast"
            @click="removeToast(toast.id)"
          >
            &times;
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 24rem;
  width: calc(100vw - 3rem);
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px color-mix(in srgb, var(--color-border) 60%, transparent);
  overflow: hidden;
}

.toast-item--success {
  border-left: 4px solid #10b981;
}

.toast-item--success .toast-icon {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
}

.toast-item--error {
  border-left: 4px solid #ef4444;
}

.toast-item--error .toast-icon {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

.toast-item--warning {
  border-left: 4px solid #f59e0b;
}

.toast-item--warning .toast-icon {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}

.toast-item--info {
  border-left: 4px solid var(--color-accent);
}

.toast-item--info .toast-icon {
  color: var(--color-accent);
  background: var(--color-surface-hover);
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.toast-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.toast-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.35;
}

.toast-message {
  font-size: 0.8125rem;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: var(--color-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.toast-close:hover {
  opacity: 1;
  color: var(--color-text);
}

.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}
</style>
