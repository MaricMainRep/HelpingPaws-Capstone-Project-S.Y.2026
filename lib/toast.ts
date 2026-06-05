'use client';

import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  description?: string;
}

function showToast(type: ToastType, message: string, options?: ToastOptions) {
  const { description } = options || {};

  switch (type) {
    case 'success':
      sonnerToast.success(message, { description });
      break;
    case 'error':
      sonnerToast.error(message, { description });
      break;
    case 'info':
      sonnerToast.info(message, { description });
      break;
    case 'warning':
      sonnerToast.warning(message, { description });
      break;
    default:
      sonnerToast(message, { description });
  }
}

export const toast = {
  success: (message: string, options?: ToastOptions) => showToast('success', message, options),
  error: (message: string, options?: ToastOptions) => showToast('error', message, options),
  info: (message: string, options?: ToastOptions) => showToast('info', message, options),
  warning: (message: string, options?: ToastOptions) => showToast('warning', message, options),
};
