export const formatCurrency = (value) => {
  if (!Number.isFinite(value)) return '$0.00';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatNumber = (value) => {
  if (!Number.isFinite(value)) return '0';

  if (Number.isInteger(value)) {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 0
    });
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatDate = (isoDate) => {
  if (!isoDate) return '';
  return new Date(isoDate + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
};

