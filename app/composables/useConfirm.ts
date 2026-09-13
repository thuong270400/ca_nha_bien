import ConfirmDialog from '~/components/ConfirmDialog.vue'

export interface ConfirmOptions {
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  color?: 'error' | 'primary' | 'warning' | 'neutral' | 'success' | 'info'
}

/**
 * Programmatic replacement for the browser's native `confirm()`. Returns a promise
 * resolving to `true` only if the user clicks the confirm button — dismissing via
 * ESC/backdrop resolves `undefined`, which callers should treat as "not confirmed".
 */
export function useConfirm() {
  const overlay = useOverlay()
  const modal = overlay.create(ConfirmDialog, { destroyOnClose: true })

  return function confirm(options: ConfirmOptions = {}) {
    return modal.open(options).result as Promise<boolean | undefined>
  }
}
