import React, { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const push = (type, message) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 3000);
  };

  const value = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message)
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`glass-card px-4 py-3 flex items-center gap-3 text-sm shadow-lg border-l-4 ${
              toast.type === 'success'
                ? 'border-[var(--accent-green)] bg-[rgba(0,40,30,0.95)]'
                : 'border-[var(--accent-red)] bg-[rgba(45,0,20,0.95)]'
            }`}
          >
            <span className="text-lg">
              {toast.type === 'success' ? '✔' : '✕'}
            </span>
            <span className="text-text-primary">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};

