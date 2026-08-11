import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'primary' | 'danger' | 'warning'
}

const isVisible = ref(false)
const options = ref<ConfirmOptions>({ title: '', message: '' })
let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirm() {
  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    options.value = {
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'primary',
      ...opts,
    }
    isVisible.value = true

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const handleConfirm = () => {
    isVisible.value = false
    if (resolvePromise) resolvePromise(true)
    resolvePromise = null
  }

  const handleCancel = () => {
    isVisible.value = false
    if (resolvePromise) resolvePromise(false)
    resolvePromise = null
  }

  return {
    isVisible,
    options,
    confirm,
    handleConfirm,
    handleCancel,
  }
}
