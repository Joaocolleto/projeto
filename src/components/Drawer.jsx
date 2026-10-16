import { useEffect, useRef } from 'react';
import { BackIcon } from './Icons';

/** Painel lateral (como no Figma: cabeçalho escuro, voltar + salvar no rodapé). */
export default function Drawer({ title, onClose, onSubmit, onDelete, submitLabel = 'Salvar alteração', children }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('input, select')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="drawer-root">
      <div className="drawer-backdrop" onClick={onClose} />
      <form
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        ref={ref}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        noValidate
      >
        <header className="drawer-head">
          <h2 id="drawer-title">{title}</h2>
        </header>
        <div className="drawer-body">
          <div className="stack">{children}</div>
        </div>
        <footer className="drawer-foot">
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Voltar sem salvar">
            <BackIcon />
          </button>
          {onDelete && (
            <button type="button" className="btn-danger-link" onClick={onDelete}>
              Excluir
            </button>
          )}
          <span className="spacer" />
          <button type="submit" className="btn btn-primary">
            {submitLabel}
          </button>
        </footer>
      </form>
    </div>
  );
}
