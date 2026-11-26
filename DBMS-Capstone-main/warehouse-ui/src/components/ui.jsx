export function Panel({ title, right, children, className = '', bodyClassName = 'p-3' }) {
  return (
    <section className={`border border-gray-300 bg-white rounded-[3px] ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3.5 py-2">
          {title && <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-700">{title}</h2>}
          {right && <div className="flex items-center gap-2">{right}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Spinner({ size = 'sm', className = '' }) {
  const sizeMap = {
    xs: 'h-3 w-3 border-[1.5px]',
    sm: 'h-3.5 w-3.5 border-2',
    md: 'h-4 w-4 border-2',
  };

  return (
    <span
      className={`inline-block animate-spin rounded-full border-blue-700 border-t-transparent ${sizeMap[size] ?? sizeMap.sm} ${className}`}
      aria-label="Loading"
    />
  );
}

export function ErrorLine({ error, onRetry, className = '' }) {
  if (!error) return null;
  const statusLabel = error.status ? `HTTP ${error.status}` : 'Error';
  const errorMessage = error.message || String(error);

  return (
    <div
      className={`flex items-center justify-between gap-3 border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800 rounded-[2px] ${className}`}
    >
      <div>
        <strong>{statusLabel}</strong>: {errorMessage}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="border border-red-400 bg-white px-2 py-0.5 text-xs font-medium text-red-800 hover:bg-red-100 rounded-[2px]"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, className = '' }) {
  return (
    <div className={`py-8 text-center text-xs text-gray-500 ${className}`}>
      <div className="font-medium text-gray-700">{title}</div>
      {description && <div className="mt-0.5 text-gray-500">{description}</div>}
    </div>
  );
}

export function Modal({ title, isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className="w-full max-w-md border border-gray-300 bg-white rounded-[3px]">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3.5 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xs px-1"
          >
            ✕
          </button>
        </div>
        <div className="p-3.5">{children}</div>
      </div>
    </div>
  );
}
