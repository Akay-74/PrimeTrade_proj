import React from 'react';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters.js';

const badgeClasses = (type) => {
  if (type === 'BUY') {
    return 'bg-[var(--accent-green)] text-black';
  }
  return 'bg-[var(--accent-red)] text-white';
};

const statusClasses = (status) => {
  switch (status) {
    case 'OPEN':
      return 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]';
    case 'CLOSED':
      return 'border-slate-500 text-slate-300';
    case 'CANCELLED':
      return 'border-[var(--accent-red)] text-[var(--accent-red)]';
    default:
      return 'border-slate-500 text-slate-300';
  }
};

const TradeCard = ({ trade, onEdit, onDelete }) => {
  return (
    <div className="glass-card p-3 flex justify-between items-center gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-elevated)] text-sm font-bold mono">
          {trade.coin[0]}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="mono font-semibold">{trade.coin}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeClasses(
                trade.type
              )}`}
            >
              {trade.type}
            </span>
          </div>
          <div className="text-xs text-text-secondary">
            {formatNumber(trade.amount)} @ {formatCurrency(trade.price)}
          </div>
          <div className="text-[11px] text-text-secondary">
            {formatDate(trade.createdAt)}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div
          className={`mono text-sm ${
            trade.type === 'BUY'
              ? 'text-[var(--accent-green)]'
              : 'text-[var(--accent-red)]'
          }`}
        >
          {formatCurrency(trade.totalValue)}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusClasses(
            trade.status
          )}`}
        >
          {trade.status}
        </span>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => onEdit(trade)}
            className="px-2 py-0.5 rounded-md bg-[rgba(0,212,255,0.1)] text-[var(--accent-cyan)]"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(trade)}
            className="px-2 py-0.5 rounded-md bg-[rgba(255,59,107,0.15)] text-[var(--accent-red)]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeCard;

