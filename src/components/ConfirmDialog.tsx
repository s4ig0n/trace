import { useEffect, useRef } from 'react'

interface Props { open: boolean; title: string; children: React.ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void }

export function ConfirmDialog({ open, title, children, confirmLabel, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current; if (!dialog) return; if (open && !dialog.open) dialog.showModal(); if (!open && dialog.open) dialog.close() }, [open])
  return <dialog ref={ref} className="dialog" onCancel={event => { event.preventDefault(); onCancel() }}>
    <h2>{title}</h2><div className="dialog-copy">{children}</div>
    <div className="dialog-actions"><button className="button ghost" onClick={onCancel}>Cancel</button><button className="button danger" onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>
}
