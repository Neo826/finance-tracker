'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export default function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] bg-slate-800 rounded-t-2xl border-t border-slate-700 shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'duration-300',
            className
          )}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-600" />
          </div>

          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
              <Dialog.Title className="text-lg font-semibold text-white">{title}</Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
          )}

          <div className="overflow-y-auto max-h-[80vh] pb-safe">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
