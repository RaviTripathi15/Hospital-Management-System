import React from 'react'
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  loading = false,
}) {
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {message || t('common.confirmDelete')}
        </p>
      </div>
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
          {cancelLabel || t('common.cancel')}
        </Button>
        <Button variant={variant} fullWidth onClick={onConfirm} loading={loading}>
          {confirmLabel || t('common.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
