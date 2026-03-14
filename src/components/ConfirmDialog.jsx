import React from 'react';
import Modal from './Modal.jsx';

const ConfirmDialog = ({ open, title, message, onClose, onConfirm, confirmLabel = 'Delete' }) => (
  <Modal open={open} onClose={onClose} title={title}>
    <p className="text-sm text-text-secondary mb-6">{message}</p>
    <div className="flex justify-end gap-3">
      <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
      <button type="button" className="btn-danger" onClick={onConfirm}>{confirmLabel}</button>
    </div>
  </Modal>
);

export default ConfirmDialog;
