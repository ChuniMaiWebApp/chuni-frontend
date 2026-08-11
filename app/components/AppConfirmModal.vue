<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { useConfirm } from '~/composables/useConfirm'

const { isVisible, options, handleConfirm, handleCancel } = useConfirm()

const confirmButton = ref<HTMLButtonElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)

// The element focus returns to once the modal closes. Without this, focus is
// dropped to <body> on close and a keyboard user loses their place on the
// page that opened the dialog.
let lastFocused: HTMLElement | null = null

// `aria-modal="true"` is a promise that focus cannot leave the dialog while
// it's open. Without this, Tab from the last button walked focus out to
// whatever the teleported markup happens to sit next to in the DOM — the
// backdrop stayed up but keyboard focus carried on through the page behind it.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleCancel()
    return
  }

  if (event.key !== 'Tab') return

  const first = cancelButton.value
  const last = confirmButton.value
  if (!first || !last) return

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(isVisible, async (visible) => {
  if (visible) {
    lastFocused = document.activeElement as HTMLElement | null
    document.addEventListener('keydown', onKeydown)
    // Locks background scroll while the dialog is open, same as the toast
    // container achieves implicitly by floating above everything.
    document.body.style.overflow = 'hidden'

    await nextTick()
    // Destructive actions default focus to Cancel, so a reflexive Enter press
    // does not confirm something irreversible. Everything else defaults to
    // Confirm, since that is almost always what the keyboard user wants next.
    ;(options.value.type === 'danger' ? cancelButton : confirmButton).value?.focus()
  }
  else {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
    lastFocused?.focus()
    lastFocused = null
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isVisible"
        class="modal-backdrop"
        @click.self="handleCancel"
      >
        <div
          class="modal-box"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="'confirm-modal-title'"
          :aria-describedby="'confirm-modal-message'"
        >
          <div class="modal-header">
            <div class="modal-icon" :class="`modal-icon--${options.type}`">
              <AppIcon v-if="options.type === 'danger'" name="trash" :size="22" />
              <AppIcon v-else-if="options.type === 'warning'" name="alert" :size="22" />
              <AppIcon v-else name="history" :size="22" />
            </div>
            <h3 id="confirm-modal-title" class="modal-title">
              {{ options.title }}
            </h3>
          </div>

          <p id="confirm-modal-message" class="modal-message">
            {{ options.message }}
          </p>

          <div class="modal-actions">
            <button
              ref="cancelButton"
              type="button"
              class="modal-btn modal-btn--ghost"
              @click="handleCancel"
            >
              {{ options.cancelText || 'Cancel' }}
            </button>
            <button
              ref="confirmButton"
              type="button"
              class="modal-btn"
              :class="options.type === 'danger' ? 'modal-btn--danger' : 'modal-btn--primary'"
              @click="handleConfirm"
            >
              {{ options.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(8, 6, 12, 0.6);
  backdrop-filter: blur(6px);
}

.modal-box {
  width: 100%;
  max-width: 25rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.4),
    0 0 0 1px color-mix(in srgb, var(--color-accent) 16%, transparent);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  flex-shrink: 0;
}

.modal-icon--danger {
  background: rgba(239, 68, 68, 0.14);
  color: #ef4444;
}

.modal-icon--warning {
  background: rgba(245, 158, 11, 0.14);
  color: #f59e0b;
}

.modal-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
}

.modal-message {
  font-size: 0.9375rem;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.55;
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.625rem;
  margin-top: 0.25rem;
}

/*
 * There was no `.btn` class defined anywhere in the app — AppConfirmModal was
 * the only place that referenced one, so both buttons fell back to the
 * browser's unstyled <button> chrome. Scoped here rather than added to
 * main.css, since nothing else in the app shares this exact button shape yet.
 */
.modal-btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: var(--radius);
  padding: 0.5625rem 1.125rem;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease;
}

.modal-btn:active {
  transform: scale(0.97);
}

.modal-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.modal-btn--ghost {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text);
}

.modal-btn--ghost:hover {
  background: var(--color-surface-hover);
  border-color: color-mix(in srgb, var(--color-border) 70%, var(--color-text));
}

.modal-btn--primary {
  background: var(--color-accent);
  color: var(--color-surface);
}

.modal-btn--primary:hover {
  background: var(--color-accent-hover);
}

.modal-btn--danger {
  background: #dc2626;
  color: white;
}

.modal-btn--danger:hover {
  background: #b91c1c;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal-box,
.modal-fade-leave-active .modal-box {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-box,
.modal-fade-leave-to .modal-box {
  opacity: 0;
  transform: scale(0.95) translateY(4px);
}
</style>
