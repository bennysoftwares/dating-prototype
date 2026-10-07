import { useEffect, useRef, type ReactNode } from 'react';
import { IconButton } from './Button';
import './BottomSheet.css';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Modal sheet anchored to the bottom on phones (within thumb reach) and centred on
 * wide screens. Built on native <dialog>: focus trapping, Escape and inert background
 * are handled by the browser.
 */
export function BottomSheet({ open, onClose, title, description, children, footer }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The native `close` event also fires when we close the dialog ourselves (open → false).
  // Only report closes the browser initiated, or a sheet-to-sheet hand-off would be undone.
  const handleClose = () => {
    if (openRef.current) onClose();
  };

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={handleClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="sheet__panel">
          <div className="sheet__grabber" aria-hidden="true" />
          <header className="sheet__header">
            <div>
              <h2 id="sheet-title" className="sheet__title">{title}</h2>
              {description && <p className="sheet__description">{description}</p>}
            </div>
            <IconButton icon="close" label="Close" onClick={onClose} />
          </header>
          <div className="sheet__body">{children}</div>
          {footer && <footer className="sheet__footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
