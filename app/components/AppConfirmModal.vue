<script setup lang="ts">
import { useConfirm } from '~/composables/useConfirm'

const { isVisible, options, handleConfirm, handleCancel } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isVisible" class="modal-backdrop" @click.self="handleCancel">
        <div class="modal-box card" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div class="modal-icon" :class="`modal-icon--${options.type}`">
              <AppIcon v-if="options.type === 'danger'" name="trash" :size="24" />
              <AppIcon v-else-if="options.type === 'warning'" name="alert" :size="24" />
              <AppIcon v-else name="history" :size="24" />
            </div>
            <h3 class="modal-title">{{ options.title }}</h3>
          </div>

          <div class="modal-body">
            <p>{{ options.message }}</p>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn btn--secondary"
              @click="handleCancel"
            >
              {{ options.cancelText || 'Hủy' }}
            </button>
            <button
              type="button"
              class="btn"
              :class="options.type === 'danger' ? 'btn--danger' : 'btn--primary'"
              @click="handleConfirm"
            >
              {{ options.confirmText || 'Xác nhận' }}
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
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
}

.modal-box {
  width: 100%;
  max-width: 26rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px color-mix(in srgb, var(--color-accent) 20%, transparent);
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
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-surface-hover);
  color: var(--color-accent);
  flex-shrink: 0;
}

.modal-icon--danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.modal-icon--warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
}

.modal-body p {
  font-size: 0.9375rem;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn--danger {
  background: #dc2626;
  color: white;
  border: none;
}

.btn--danger:hover {
  background: #b91c1c;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
