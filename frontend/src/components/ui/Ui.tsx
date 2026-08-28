import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Loader2, X } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <header className="page-heading">
    <div className="page-heading__copy">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
    {action ? <div className="page-heading__action">{action}</div> : null}
  </header>
);

interface FeedbackProps {
  label: string;
  compact?: boolean;
}

export const LoadingState: React.FC<FeedbackProps> = ({ label, compact = false }) => (
  <div className={`feedback-state feedback-state--loading${compact ? ' feedback-state--compact' : ''}`} role="status">
    <Loader2 aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export const ErrorState: React.FC<FeedbackProps> = ({ label, compact = false }) => (
  <div className={`feedback-state feedback-state--error${compact ? ' feedback-state--compact' : ''}`} role="alert">
    <AlertCircle aria-hidden="true" />
    <span>{label}</span>
  </div>
);

interface EmptyStateProps extends FeedbackProps {
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ label, icon, compact = false }) => (
  <div className={`feedback-state feedback-state--empty${compact ? ' feedback-state--compact' : ''}`}>
    {icon}
    <span>{label}</span>
  </div>
);

interface MetricCardProps {
  label: string;
  value: string;
  note?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'positive' | 'negative' | 'warning';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  note,
  icon,
  tone = 'default',
}) => (
  <article className={`metric-card metric-card--${tone}`}>
    {icon ? <span className="metric-card__icon">{icon}</span> : null}
    <div className="metric-card__copy">
      <p>{label}</p>
      <strong>{value}</strong>
      {note ? <span>{note}</span> : null}
    </div>
  </article>
);

interface ModalProps {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  eyebrow = 'Novo lançamento',
  onClose,
  children,
  labelledBy = 'modal-title',
  className = '',
}) => {
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    const appRoot = document.getElementById('root');
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    appRoot?.setAttribute('inert', '');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    const frame = window.requestAnimationFrame(() => {
      const preferredTarget = dialog?.querySelector<HTMLElement>(
        'input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)',
      );
      (preferredTarget || dialog)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      appRoot?.removeAttribute('inert');
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return createPortal(
    <div
      className="modal-layer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={`modal-card ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        <div className="modal-card__header">
          <div>
            <span>{eyebrow}</span>
            <h2 id={labelledBy}>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <X aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
};
