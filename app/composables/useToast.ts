import { ref } from 'vue'

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

const toasts = ref<ToastItem[]>([])

export function useToast() {
  const showToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const item: ToastItem = {
      id,
      duration: 4500,
      ...toast,
    }
    toasts.value.push(item)

    if (item.duration && item.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, item.duration)
    }
  }

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const success = (title: string, message?: string) => showToast({ type: 'success', title, message })
  const error = (title: string, message?: string) => showToast({ type: 'error', title, message })
  const info = (title: string, message?: string) => showToast({ type: 'info', title, message })
  const warning = (title: string, message?: string) => showToast({ type: 'warning', title, message })

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }
}
