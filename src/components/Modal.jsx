import React from 'react';

const Modal = ({ open, title, children, onClose, wide }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`glass-card w-full max-h-[90vh] overflow-y-auto ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        } mx-4 sm:mx-0 p-6`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;

